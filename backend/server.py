from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64
import json
import csv
import io
from jose import JWTError, jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
# Carregar apenas o .env do backend (todas as variáveis estão aqui agora)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gateway Configuration
GATEWAY_FILE = Path('/app/.gateway')
FURIAPAY_BASE_URL = os.getenv('FURIAPAY_BASE_URL', 'https://api.furiapaybr.com/v1')
FURIAPAY_PUBLIC_KEY = os.getenv('FURIAPAY_PUBLIC_KEY', '')
FURIAPAY_SECRET_KEY = os.getenv('FURIAPAY_SECRET_KEY', '')
PAGLOOP_BASE_URL = os.getenv('PAGLOOP_BASE_URL', 'https://api.pagloop.tech')
PAGLOOP_CLIENT_ID = os.getenv('PAGLOOP_CLIENT_ID', '')
PAGLOOP_CLIENT_SECRET = os.getenv('PAGLOOP_CLIENT_SECRET', '')

# Zippify API Configuration (Gateway Principal)
ZIPPIFY_BASE_URL = os.getenv('ZIPPIFY_BASE_URL', 'https://api.zippify.com.br/api/public/v1')
ZIPPIFY_API_TOKEN = os.getenv('ZIPPIFY_API_TOKEN', 'pqWpAXkg9tAdxAm07xAQ4d6IODUw6C5Y0u7oL0CpfN92RFfpsqvJRkDpPqhU')
ZIPPIFY_OFFER_HASH = os.getenv('ZIPPIFY_OFFER_HASH', 'xfwh7be0ef')
ZIPPIFY_PRODUCT_HASH = os.getenv('ZIPPIFY_PRODUCT_HASH', 'rrabdugdeq')

# InverTexto API Configuration
INVERTEXTO_API_TOKEN = os.getenv('INVERTEXTO_API_TOKEN', '')
INVERTEXTO_BASE_URL = os.getenv('INVERTEXTO_BASE_URL', 'https://api.invertexto.com/v1')

# Auth Configuration
SECRET_KEY = os.environ['JWT_SECRET_KEY']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

# Senha do admin
ADMIN_USERNAME = os.environ['ADMIN_USERNAME']
ADMIN_PASSWORD_HASH = os.environ['ADMIN_PASSWORD_HASH']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="MEI Payment System API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Models
class CNPJConsulta(BaseModel):
    cnpj: str

class CNPJResponse(BaseModel):
    cnpj: str
    nome: str
    situacao: str

class DebitoItem(BaseModel):
    mes: str
    valor: float
    status: str

class DebitosResponse(BaseModel):
    cnpj: str
    total: float
    quantidade_meses: int
    debitos: List[DebitoItem]

class PagamentoRequest(BaseModel):
    cnpj: str
    nome: str
    email: Optional[str] = "contato@mei.com"
    valor: float

class PagamentoResponse(BaseModel):
    id: str
    qr_code: str
    valor: float
    status: str
    gateway: str

class GatewayResponse(BaseModel):
    gateway: str
    disponiveis: List[str]

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Helper Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica senha"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria JWT token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica token JWT"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

def get_active_gateway() -> str:
    """Lê o gateway ativo do arquivo .gateway"""
    try:
        if GATEWAY_FILE.exists():
            gateway = GATEWAY_FILE.read_text().strip()
            if gateway in ['furiapay', 'pagloop']:
                return gateway
    except Exception as e:
        logger.error(f"Erro ao ler gateway: {e}")
    return 'pagloop'  # Default

def set_active_gateway(gateway: str) -> bool:
    """Define o gateway ativo"""
    try:
        if gateway in ['furiapay', 'pagloop']:
            GATEWAY_FILE.write_text(gateway)
            return True
    except Exception as e:
        logger.error(f"Erro ao salvar gateway: {e}")
    return False


# PagLoop Integration
async def pagloop_authenticate() -> str:
    """Autentica no PagLoop e retorna token"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PAGLOOP_BASE_URL}/api/auth/login",
                json={
                    "client_id": PAGLOOP_CLIENT_ID,
                    "client_secret": PAGLOOP_CLIENT_SECRET
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get('token', '')
    except Exception as e:
        logger.error(f"Erro autenticação PagLoop: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na autenticação PagLoop: {str(e)}")

async def pagloop_create_pix(valor: float, cnpj: str, nome: str, email: str) -> Dict[str, Any]:
    """Cria pagamento PIX no PagLoop"""
    try:
        token = await pagloop_authenticate()
        
        external_id = f"mei_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{PAGLOOP_BASE_URL}/api/payments/deposit",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": valor,
                    "external_id": external_id,
                    "clientCallbackUrl": "https://meusite.com/callback",
                    "payer": {
                        "name": nome,
                        "document": cnpj.replace('.', '').replace('/', '').replace('-', ''),
                        "email": email
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                'id': data.get('qrCodeResponse', {}).get('transactionId', external_id),
                'qr_code': data.get('qrCodeResponse', {}).get('qrcode', ''),
                'valor': valor,
                'status': data.get('qrCodeResponse', {}).get('status', 'pending'),
                'gateway': 'pagloop'
            }
    except Exception as e:
        logger.error(f"Erro PagLoop create PIX: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PIX PagLoop: {str(e)}")


# FuriaPay Integration
async def furiapay_create_pix(valor: float, cnpj: str, nome: str, email: str) -> Dict[str, Any]:
    """Cria pagamento PIX no FuriaPay"""
    try:
        # Auth Basic
        credentials = f"{FURIAPAY_PUBLIC_KEY}:{FURIAPAY_SECRET_KEY}"
        auth_header = 'Basic ' + base64.b64encode(credentials.encode()).decode()
        
        # Converter valor para centavos
        amount_cents = int(valor * 100)
        
        # Limpar documento
        document_clean = cnpj.replace('.', '').replace('/', '').replace('-', '')
        document_type = 'cpf' if len(document_clean) == 11 else 'cnpj'
        
        payload = {
            "amount": amount_cents,
            "paymentMethod": "pix",
            "customer": {
                "name": nome,
                "email": email,
                "document": {
                    "type": document_type,
                    "number": document_clean
                },
                "phoneNumber": "11999999999"
            },
            "items": [
                {
                    "title": "Pagamento DAS CNPJ",
                    "unitPrice": amount_cents,
                    "quantity": 1,
                    "tangible": False
                }
            ]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{FURIAPAY_BASE_URL}/transactions",
                headers={
                    "Authorization": auth_header,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                'id': data.get('id', str(uuid.uuid4())),
                'qr_code': data.get('pix', {}).get('qrcode', ''),
                'valor': valor,
                'status': data.get('status', 'waiting_payment'),
                'gateway': 'furiapay'
            }
    except Exception as e:
        logger.error(f"Erro FuriaPay create PIX: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PIX FuriaPay: {str(e)}")


# Zippify Integration (Gateway Principal)
async def zippify_create_pix(valor: float, cnpj: str, nome: str, email: str, phone: str = "11999999999") -> Dict[str, Any]:
    """Cria pagamento PIX no Zippify - Gateway Principal
    
    API: https://api.zippify.com.br/api/public/v1/transactions
    Documentação: Zippify Public API v1
    """
    try:
        # Converter valor para centavos (API espera em centavos)
        amount_cents = int(valor * 100)
        
        # Limpar documento (remover pontuação)
        document_clean = cnpj.replace('.', '').replace('/', '').replace('-', '')
        
        # Payload conforme documentação Zippify
        payload = {
            "offer_hash": ZIPPIFY_OFFER_HASH,
            "amount": amount_cents,
            "payment_method": "pix",
            "customer": {
                "name": nome,
                "email": email,
                "phone_number": phone,
                "document": document_clean
            },
            "cart": [
                {
                    "product_hash": ZIPPIFY_PRODUCT_HASH,
                    "title": "Taxa FISTEL - ANATEL",
                    "price": amount_cents,
                    "quantity": 1,
                    "operation_type": 1,
                    "tangible": False
                }
            ]
        }
        
        logger.info(f"[ZIPPIFY] Criando PIX - Valor: R$ {valor:.2f} ({amount_cents} centavos)")
        logger.info(f"[ZIPPIFY] Documento: {document_clean}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{ZIPPIFY_BASE_URL}/transactions",
                params={"api_token": ZIPPIFY_API_TOKEN},
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                json=payload
            )
            
            logger.info(f"[ZIPPIFY] Response status: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                logger.error(f"[ZIPPIFY] Error response: {response.text[:500]}")
                raise HTTPException(status_code=response.status_code, detail=f"Erro Zippify: {response.text[:200]}")
            
            data = response.json()
            logger.info(f"[ZIPPIFY] Response data keys: {data.keys() if isinstance(data, dict) else 'not dict'}")
            
            # Extrair dados do PIX da resposta
            # A estrutura pode variar - vamos tentar diferentes caminhos
            transaction_id = data.get('id') or data.get('transaction_id') or data.get('data', {}).get('id') or str(uuid.uuid4())
            
            # Tentar encontrar o QR code em diferentes lugares da resposta
            qr_code = (
                data.get('pix_qrcode') or 
                data.get('qr_code') or 
                data.get('pix', {}).get('qrcode') or
                data.get('data', {}).get('pix_qrcode') or
                data.get('data', {}).get('qr_code') or
                data.get('payment', {}).get('pix_qrcode') or
                ''
            )
            
            status = data.get('status') or data.get('data', {}).get('status') or 'pending'
            
            logger.info(f"[ZIPPIFY] Transaction ID: {transaction_id}")
            logger.info(f"[ZIPPIFY] QR Code length: {len(qr_code) if qr_code else 0}")
            logger.info(f"[ZIPPIFY] Status: {status}")
            
            return {
                'id': str(transaction_id),
                'qr_code': qr_code,
                'valor': valor,
                'status': status,
                'gateway': 'zippify',
                'raw_response': data  # Para debug
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ZIPPIFY] Erro ao criar PIX: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PIX Zippify: {str(e)}")


# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "MEI Payment System API", "version": "2.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint para Kubernetes"""
    try:
        # Verificar se MongoDB está conectado
        await db.command('ping')
        return {
            "status": "healthy",
            "service": "MEI Payment System",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Login administrativo - retorna JWT token"""
    
    # Verificar credenciais
    if credentials.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    
    if not verify_password(credentials.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    
    # Criar token
    access_token = create_access_token(
        data={"sub": credentials.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Login bem-sucedido: {credentials.username}")
    
    return TokenResponse(access_token=access_token)

@api_router.get("/auth/verify")
async def verify_token(current_user: str = Depends(get_current_user)):
    """Verifica se token é válido"""
    return {"valid": True, "username": current_user}

@api_router.post("/cnpj/consultar", response_model=CNPJResponse)
async def consultar_cnpj(data: CNPJConsulta):
    """Consulta CNPJ - API InverTexto PRINCIPAL
    
    ESTRATÉGIA SIMPLIFICADA:
    1. Cache (se já consultado antes) - 1-5ms
    2. API InverTexto (dados oficiais) - 500ms-1s
    3. Mockado (fallback) - <1ms
    """
    cnpj_limpo = data.cnpj.replace('.', '').replace('/', '').replace('-', '')
    
    # PASSO 1: Verificar CACHE primeiro (mais rápido)
    try:
        cache_doc = await db.cnpjs_cache.find_one(
            {'cnpj_raw': cnpj_limpo},
            {'_id': 0}
        )
        
        if cache_doc:
            cache_age_days = (datetime.now(timezone.utc) - datetime.fromisoformat(cache_doc['cached_at'])).days
            
            if cache_age_days < 7:  # Cache válido por 7 dias
                logger.info(f"[CACHE] CNPJ {cnpj_limpo} encontrado ({cache_age_days}d)")
                
                await db.cnpjs_cache.update_one(
                    {'cnpj_raw': cnpj_limpo},
                    {'$inc': {'hit_count': 1}}
                )
                
                return CNPJResponse(
                    cnpj=cache_doc.get('cnpj_formatado', data.cnpj),
                    nome=cache_doc.get('razao_social', 'Empresa'),
                    situacao=cache_doc.get('situacao', 'ATIVA')
                )
    except Exception as e:
        logger.error(f"Erro cache: {e}")
    
    # PASSO 2: API INVERTEXTO (Principal)
    if INVERTEXTO_API_TOKEN:
        try:
            logger.info(f"[INVERTEXTO] Consultando {cnpj_limpo}...")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{INVERTEXTO_BASE_URL}/cnpj/{cnpj_limpo}",
                    params={"token": INVERTEXTO_API_TOKEN}
                )
                
                logger.info(f"[INVERTEXTO] Status: {response.status_code}")
                
                if response.status_code == 200:
                    api_data = response.json()
                    logger.info(f"[INVERTEXTO] Dados recebidos: {api_data.get('razao_social', 'N/A')}")
                    
                    # Salvar no cache
                    cache_doc = {
                        'cnpj_raw': cnpj_limpo,
                        'cnpj_formatado': api_data.get('cnpj', data.cnpj),
                        'razao_social': api_data.get('razao_social', 'Empresa'),
                        'situacao': api_data.get('situacao', {}).get('nome', 'ATIVA') if isinstance(api_data.get('situacao'), dict) else 'ATIVA',
                        'fonte': 'invertexto',
                        'cached_at': datetime.now(timezone.utc).isoformat(),
                        'hit_count': 0
                    }
                    
                    try:
                        await db.cnpjs_cache.insert_one(cache_doc)
                        logger.info(f"[INVERTEXTO] Salvo no cache")
                    except Exception:
                        pass
                    
                    return CNPJResponse(
                        cnpj=api_data.get('cnpj', data.cnpj),
                        nome=api_data.get('razao_social', 'Empresa'),
                        situacao=cache_doc['situacao']
                    )
                else:
                    logger.warning(f"[INVERTEXTO] Status não-200: {response.status_code}")
                    logger.warning(f"[INVERTEXTO] Response: {response.text[:200]}")
        except Exception as e:
            logger.error(f"[INVERTEXTO] Erro: {str(e)}")
    
    # PASSO 3: FALLBACK - Mockado
    logger.info(f"[MOCKADO] Usando fallback para {cnpj_limpo}")
    
    ultimos_digitos = cnpj_limpo[-4:] if len(cnpj_limpo) >= 4 else "0001"
    
    return CNPJResponse(
        cnpj=data.cnpj,
        nome=f"EMPRESA MEI {ultimos_digitos} LTDA",
        situacao="ATIVA"
    )

@api_router.get("/cnpj/{cnpj}/debitos", response_model=DebitosResponse)
async def obter_debitos(cnpj: str):
    """Retorna débitos DAS do CNPJ"""
    # Para MVP, retornando dados fixos
    # Em produção, consultaria banco de dados real
    return DebitosResponse(
        cnpj=cnpj,
        total=161.80,
        quantidade_meses=2,
        debitos=[
            DebitoItem(mes="Maio/2025", valor=80.90, status="EM ABERTO"),
            DebitoItem(mes="Abril/2025", valor=80.90, status="EM ABERTO")
        ]
    )


# ─── ANATEL / FISTEL Models ────────────────────────────────────────────────────

class AnatelTaxaItem(BaseModel):
    tipo: str
    periodo: str
    principal: float
    acrescimos: float
    total_item: float

class AnatelTaxasResponse(BaseModel):
    cnpj: str
    servico: str
    num_estacoes: int
    quantidade_anos: int
    total: float
    taxas: List[AnatelTaxaItem]

# ─── ANATEL Endpoints ──────────────────────────────────────────────────────────

@api_router.get("/anatel/taxas/{cnpj}", response_model=AnatelTaxasResponse)
async def obter_taxas_anatel(cnpj: str):
    """Retorna débitos de Taxa FISTEL da ANATEL para o CNPJ informado"""
    import random

    cnpj_limpo = cnpj.replace(".", "").replace("/", "").replace("-", "")
    # Usa os últimos 4 dígitos do CNPJ para variar levemente os valores
    seed = int(cnpj_limpo[-4:]) if cnpj_limpo else 1234
    random.seed(seed)

    # Valores TFF para pequenas prestadoras (categoria C)
    # Baseado nos valores reais da tabela ANATEL/FISTEL
    valor_tff_base = round(random.uniform(320.00, 540.00), 2)
    valor_tfi_base = round(valor_tff_base * 0.5, 2)

    # Simula 1 ou 2 anos em atraso
    anos_atraso = random.choice([1, 2])

    taxas = []
    anos_referencia = [2024, 2025] if anos_atraso == 2 else [2025]

    total_geral = 0.0

    for ano in anos_referencia[:anos_atraso]:
        # TFF – Taxa de Fiscalização de Funcionamento
        principal_tff = valor_tff_base
        acrescimos_tff = round(principal_tff * 0.20, 2)   # multa 20%
        total_tff = round(principal_tff + acrescimos_tff, 2)
        total_geral += total_tff

        taxas.append(AnatelTaxaItem(
            tipo="TFF – Taxa de Fiscalização de Funcionamento",
            periodo=f"Exercício {ano}",
            principal=principal_tff,
            acrescimos=acrescimos_tff,
            total_item=total_tff
        ))

        # TFI – Taxa de Fiscalização de Instalação (somente no 1º ano do débito)
        if ano == anos_referencia[0]:
            principal_tfi = valor_tfi_base
            acrescimos_tfi = round(principal_tfi * 0.20, 2)
            total_tfi = round(principal_tfi + acrescimos_tfi, 2)
            total_geral += total_tfi

            taxas.append(AnatelTaxaItem(
                tipo="TFI – Taxa de Fiscalização de Instalação",
                periodo=f"Exercício {ano}",
                principal=principal_tfi,
                acrescimos=acrescimos_tfi,
                total_item=total_tfi
            ))

    total_geral = round(total_geral, 2)

    servicos = [
        "SCM – Serviço de Comunicação Multimídia",
        "SMP – Serviço Móvel Pessoal",
        "STFC – Serviço Telefônico Fixo Comutado",
        "SRD – Serviço de Radioamador",
    ]
    servico = servicos[seed % len(servicos)]

    return AnatelTaxasResponse(
        cnpj=cnpj,
        servico=servico,
        num_estacoes=random.randint(1, 5),
        quantidade_anos=anos_atraso,
        total=total_geral,
        taxas=taxas
    )


@api_router.post("/pagamento/pix", response_model=PagamentoResponse)
async def gerar_pix(data: PagamentoRequest):
    """Gera QR Code PIX usando gateway ativo"""
    gateway = get_active_gateway()
    
    logger.info(f"Gerando PIX via {gateway.upper()} - Valor: R$ {data.valor}")
    
    try:
        if gateway == 'pagloop':
            result = await pagloop_create_pix(
                valor=data.valor,
                cnpj=data.cnpj,
                nome=data.nome,
                email=data.email or "contato@mei.com"
            )
        else:  # furiapay
            result = await furiapay_create_pix(
                valor=data.valor,
                cnpj=data.cnpj,
                nome=data.nome,
                email=data.email or "contato@mei.com"
            )
        
        # Salvar transação no MongoDB
        transaction = {
            'id': result['id'],
            'cnpj': data.cnpj,
            'nome': data.nome,
            'valor': data.valor,
            'qr_code': result['qr_code'],
            'status': result['status'],
            'gateway': result['gateway'],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        return PagamentoResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar PIX: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/pagamento/status/{transaction_id}")
async def verificar_status(transaction_id: str):
    """Verifica status do pagamento"""
    # Buscar no banco
    transaction = await db.transactions.find_one({'id': transaction_id}, {'_id': 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    gateway = transaction.get('gateway', 'pagloop')
    
    # Consultar gateway para atualizar status
    try:
        if gateway == 'pagloop':
            # PagLoop status endpoint
            token = await pagloop_authenticate()
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{PAGLOOP_BASE_URL}/api/transactions/getStatusTransac/{transaction_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code == 200:
                    data = response.json()
                    new_status = data.get('status', transaction['status'])
                    
                    # Atualizar no banco
                    await db.transactions.update_one(
                        {'id': transaction_id},
                        {'$set': {'status': new_status, 'updated_at': datetime.now(timezone.utc).isoformat()}}
                    )
                    transaction['status'] = new_status
        else:
            # FuriaPay status endpoint
            credentials = f"{FURIAPAY_PUBLIC_KEY}:{FURIAPAY_SECRET_KEY}"
            auth_header = 'Basic ' + base64.b64encode(credentials.encode()).decode()
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{FURIAPAY_BASE_URL}/transactions/{transaction_id}",
                    headers={"Authorization": auth_header}
                )
                if response.status_code == 200:
                    data = response.json()
                    new_status = data.get('status', transaction['status'])
                    
                    await db.transactions.update_one(
                        {'id': transaction_id},
                        {'$set': {'status': new_status, 'updated_at': datetime.now(timezone.utc).isoformat()}}
                    )
                    transaction['status'] = new_status
    except Exception as e:
        logger.warning(f"Erro ao atualizar status: {e}")
    
    return transaction

@api_router.get("/gateway/current", response_model=GatewayResponse)
async def get_gateway():
    """Retorna gateway ativo"""
    return GatewayResponse(
        gateway=get_active_gateway(),
        disponiveis=['furiapay', 'pagloop']
    )

@api_router.post("/gateway/switch")
async def switch_gateway(gateway: str):
    """Troca o gateway ativo"""
    if gateway not in ['furiapay', 'pagloop']:
        raise HTTPException(status_code=400, detail="Gateway inválido")
    
    if set_active_gateway(gateway):
        return {"success": True, "gateway": gateway, "message": f"Gateway alterado para {gateway}"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao trocar gateway")

@api_router.post("/webhook/pagloop")
async def webhook_pagloop(payload: Dict[str, Any]):
    """Webhook do PagLoop para notificações de pagamento"""
    logger.info(f"Webhook PagLoop recebido: {payload}")
    
    transaction_id = payload.get('transactionId') or payload.get('id')
    status = payload.get('status')
    
    if transaction_id and status:
        await db.transactions.update_one(
            {'id': transaction_id},
            {'$set': {'status': status, 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"success": True}

@api_router.post("/webhook/furiapay")
async def webhook_furiapay(payload: Dict[str, Any]):
    """Webhook do FuriaPay para notificações de pagamento"""
    logger.info(f"Webhook FuriaPay recebido: {payload}")
    
    transaction_id = payload.get('id')
    status = payload.get('status')
    
    if transaction_id and status:
        await db.transactions.update_one(
            {'id': str(transaction_id)},
            {'$set': {'status': status, 'updated_at': datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"success": True}

@api_router.get("/transactions", response_model=List[dict])
async def list_transactions(limit: int = 50):
    """Lista transações recentes"""
    transactions = await db.transactions.find(
        {}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return transactions


# Dashboard Endpoints
@api_router.get("/dashboard/stats")
async def dashboard_stats(current_user: str = Depends(get_current_user)):
    """Estatísticas gerais do dashboard"""
    try:
        # Total de transações
        total_transacoes = await db.transactions.count_documents({})
        
        # Total arrecadado
        pipeline_total = [
            {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
        ]
        result_total = await db.transactions.aggregate(pipeline_total).to_list(1)
        total_arrecadado = result_total[0]["total"] if result_total else 0
        
        # Transações por status
        pipeline_status = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_counts = await db.transactions.aggregate(pipeline_status).to_list(10)
        
        # Transações por gateway
        pipeline_gateway = [
            {"$group": {"_id": "$gateway", "count": {"$sum": 1}, "total": {"$sum": "$valor"}}}
        ]
        gateway_stats = await db.transactions.aggregate(pipeline_gateway).to_list(10)
        
        # Últimas 24h
        from datetime import timedelta
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        transacoes_24h = await db.transactions.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        # Taxa de sucesso
        total_pagas = await db.transactions.count_documents({"status": {"$in": ["paid", "approved", "CONFIRMED"]}})
        taxa_sucesso = (total_pagas / total_transacoes * 100) if total_transacoes > 0 else 0
        
        return {
            "total_transacoes": total_transacoes,
            "total_arrecadado": round(total_arrecadado, 2),
            "transacoes_24h": transacoes_24h,
            "taxa_sucesso": round(taxa_sucesso, 2),
            "por_status": status_counts,
            "por_gateway": gateway_stats,
            "gateway_ativo": get_active_gateway()
        }
    except Exception as e:
        logger.error(f"Erro ao buscar stats: {e}")
        return {
            "total_transacoes": 0,
            "total_arrecadado": 0,
            "transacoes_24h": 0,
            "taxa_sucesso": 0,
            "por_status": [],
            "por_gateway": [],
            "gateway_ativo": get_active_gateway()
        }

@api_router.get("/dashboard/grafico")
async def dashboard_chart(days: int = 7, current_user: str = Depends(get_current_user)):
    """Dados para gráfico de transações por dia"""
    try:
        from datetime import timedelta
        
        # Últimos N dias
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date.isoformat()}}},
            {
                "$group": {
                    "_id": {"$substr": ["$created_at", 0, 10]},
                    "count": {"$sum": 1},
                    "total": {"$sum": "$valor"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        result = await db.transactions.aggregate(pipeline).to_list(days)
        
        # Preencher dias sem transações
        chart_data = []
        for i in range(days):
            date = (datetime.now(timezone.utc) - timedelta(days=days-i-1)).strftime('%Y-%m-%d')
            existing = next((r for r in result if r["_id"] == date), None)
            chart_data.append({
                "date": date,
                "count": existing["count"] if existing else 0,
                "total": round(existing["total"], 2) if existing else 0
            })
        
        return chart_data
    except Exception as e:
        logger.error(f"Erro ao gerar gráfico: {e}")
        return []

@api_router.get("/dashboard/transacoes")
async def dashboard_transactions(
    status: Optional[str] = None,
    gateway: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    """Lista transações com filtros"""
    try:
        query = {}
        
        if status:
            query["status"] = status
        
        if gateway:
            query["gateway"] = gateway
        
        if data_inicio or data_fim:
            query["created_at"] = {}
            if data_inicio:
                query["created_at"]["$gte"] = data_inicio
            if data_fim:
                query["created_at"]["$lte"] = data_fim
        
        transactions = await db.transactions.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return transactions
    except Exception as e:
        logger.error(f"Erro ao listar transações: {e}")
        return []


# Endpoints de Gestão de CNPJs (para 3M+ registros)
@api_router.post("/cnpjs/importar")
async def importar_cnpjs(cnpjs: List[Dict[str, str]]):
    """Importa CNPJs em massa para o banco de dados
    
    Body exemplo:
    [
        {"cnpj": "12345678000190", "nome": "Empresa 1", "situacao": "ATIVA"},
        {"cnpj": "98765432000111", "nome": "Empresa 2", "situacao": "ATIVA"},
        ...
    ]
    
    Para importar 3M de registros, envie em batches de 1000-10000 por vez
    """
    try:
        documentos = []
        for item in cnpjs:
            cnpj_limpo = item['cnpj'].replace('.', '').replace('/', '').replace('-', '')
            doc = {
                'cnpj': cnpj_limpo,
                'cnpj_formatado': item['cnpj'],
                'nome': item['nome'],
                'situacao': item.get('situacao', 'ATIVA'),
                'fonte': 'importacao_manual',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            documentos.append(doc)
        
        # Inserção em massa (muito mais rápido)
        result = await db.cnpjs_database.insert_many(documentos, ordered=False)
        
        logger.info(f"Importados {len(result.inserted_ids)} CNPJs")
        
        return {
            "success": True,
            "total_importados": len(result.inserted_ids),
            "message": f"{len(result.inserted_ids)} CNPJs importados com sucesso"
        }
    except Exception as e:
        logger.error(f"Erro na importação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao importar CNPJs: {str(e)}")

@api_router.post("/cnpjs/criar-indices")
async def criar_indices():
    """Cria índices no MongoDB para otimizar buscas em 3M+ registros
    
    Índice no campo 'cnpj' permite busca em O(log n) = ~1-5ms
    """
    try:
        # Criar índice único no campo cnpj
        await db.cnpjs_database.create_index("cnpj", unique=True)
        
        # Índice para situacao (para filtros)
        await db.cnpjs_database.create_index("situacao")
        
        logger.info("Índices criados com sucesso")
        
        return {
            "success": True,
            "message": "Índices criados - banco otimizado para 3M+ registros"
        }
    except Exception as e:
        logger.error(f"Erro ao criar índices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cnpjs/stats")
async def cnpjs_stats():
    """Estatísticas da base de CNPJs - Estratégia Híbrida"""
    try:
        # Subset local (CNPJs prioritários importados)
        total_subset = await db.cnpjs_subset.count_documents({})
        
        # Cache (CNPJs consultados e salvos automaticamente)
        total_cache = await db.cnpjs_cache.count_documents({})
        
        # Cache hits
        cache_stats = await db.cnpjs_cache.aggregate([
            {"$group": {
                "_id": None,
                "total_hits": {"$sum": "$hit_count"},
                "avg_hits": {"$avg": "$hit_count"}
            }}
        ]).to_list(1)
        
        total_hits = cache_stats[0]['total_hits'] if cache_stats else 0
        
        # Por fonte
        cache_por_fonte = await db.cnpjs_cache.aggregate([
            {"$group": {"_id": "$fonte", "count": {"$sum": 1}}}
        ]).to_list(10)
        
        return {
            "subset_local": total_subset,
            "cache_automatico": total_cache,
            "total_disponivel_rapido": total_subset + total_cache,
            "cache_hits_total": total_hits,
            "por_fonte": cache_por_fonte,
            "estrategia": "Híbrida: Subset + Cache + API Externa",
            "info": {
                "subset": f"{total_subset:,} CNPJs prioritários (1-5ms)",
                "cache": f"{total_cache:,} CNPJs em cache (1-5ms)",  
                "api_externa": "Backup para CNPJs novos (500ms-2s)",
                "crescimento": "Cache cresce automaticamente com uso"
            }
        }
    except Exception as e:
        logger.error(f"Erro ao buscar stats CNPJs: {e}")
        return {
            "subset_local": 0,
            "cache_automatico": 0,
            "total_disponivel_rapido": 0
        }


# Status de importação global
importacao_status = {
    "em_andamento": False,
    "total_processados": 0,
    "total_importados": 0,
    "total_erros": 0,
    "progresso": 0,
    "mensagem": ""
}


async def processar_importacao_background(conteudo: str, tipo: str):
    """Processa importação em background"""
    global importacao_status
    
    importacao_status["em_andamento"] = True
    importacao_status["total_processados"] = 0
    importacao_status["total_importados"] = 0
    importacao_status["total_erros"] = 0
    importacao_status["progresso"] = 0
    importacao_status["mensagem"] = "Iniciando importação..."
    
    try:
        if tipo == "csv":
            reader = csv.DictReader(io.StringIO(conteudo))
            rows = list(reader)
        else:  # json
            rows = json.loads(conteudo)
        
        total_linhas = len(rows)
        importacao_status["mensagem"] = f"Processando {total_linhas:,} registros..."
        
        BATCH_SIZE = 10000
        batch = []
        
        for idx, row in enumerate(rows):
            try:
                cnpj_limpo = str(row.get('cnpj', '')).replace('.', '').replace('/', '').replace('-', '')
                
                if not cnpj_limpo or len(cnpj_limpo) < 11:
                    importacao_status["total_erros"] += 1
                    continue
                
                doc = {
                    'cnpj': cnpj_limpo,
                    'cnpj_raw': cnpj_limpo,
                    'cnpj_formatado': row.get('cnpj', cnpj_limpo),
                    'razao_social': row.get('nome', row.get('razao_social', f'EMPRESA {cnpj_limpo[-4:]}')),
                    'situacao_cadastral': '02' if row.get('situacao', 'ATIVA') == 'ATIVA' else '03',
                    'situacao': row.get('situacao', row.get('situacao_cadastral', 'ATIVA')),
                    'fonte': 'importacao_subset',
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                batch.append(doc)
                
                # Inserir batch quando atingir limite
                if len(batch) >= BATCH_SIZE:
                    try:
                        await db.cnpjs_subset.insert_many(batch, ordered=False)
                        importacao_status["total_importados"] += len(batch)
                    except Exception as e:
                        logger.error(f"Erro no batch: {e}")
                        importacao_status["total_erros"] += len(batch)
                    
                    batch = []
                    importacao_status["total_processados"] = idx + 1
                    importacao_status["progresso"] = int((idx + 1) / total_linhas * 100)
                    importacao_status["mensagem"] = f"Processando... {idx+1:,}/{total_linhas:,} ({importacao_status['progresso']}%)"
                
            except Exception as e:
                logger.error(f"Erro na linha {idx}: {e}")
                importacao_status["total_erros"] += 1
        
        # Inserir último batch
        if batch:
            try:
                await db.cnpjs_subset.insert_many(batch, ordered=False)
                importacao_status["total_importados"] += len(batch)
            except Exception:
                importacao_status["total_erros"] += len(batch)
        
        importacao_status["total_processados"] = total_linhas
        importacao_status["progresso"] = 100
        importacao_status["mensagem"] = f"Concluído! {importacao_status['total_importados']:,} CNPJs importados"
        
    except Exception as e:
        logger.error(f"Erro na importação: {e}")
        importacao_status["mensagem"] = f"Erro: {str(e)}"
    finally:
        importacao_status["em_andamento"] = False


@api_router.post("/cnpjs/upload")
async def upload_cnpjs(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload de arquivo CSV ou JSON com CNPJs
    
    Aceita arquivos até 500MB
    Suporta CSV e JSON
    Processamento em background para não bloquear
    """
    try:
        # Validar tipo de arquivo
        if not file.filename.endswith(('.csv', '.json')):
            raise HTTPException(
                status_code=400, 
                detail="Apenas arquivos CSV ou JSON são aceitos"
            )
        
        # Ler conteúdo do arquivo
        conteudo = await file.read()
        conteudo_str = conteudo.decode('utf-8')
        
        # Verificar tamanho
        tamanho_mb = len(conteudo) / (1024 * 1024)
        logger.info(f"Arquivo recebido: {file.filename} ({tamanho_mb:.2f} MB)")
        
        if tamanho_mb > 500:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo muito grande: {tamanho_mb:.2f} MB. Máximo: 500 MB"
            )
        
        # Determinar tipo
        tipo = 'csv' if file.filename.endswith('.csv') else 'json'
        
        # Processar em background
        background_tasks.add_task(processar_importacao_background, conteudo_str, tipo)
        
        return {
            "success": True,
            "message": f"Upload recebido: {file.filename} ({tamanho_mb:.2f} MB)",
            "tipo": tipo,
            "status": "Importação iniciada em background"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/cnpjs/importacao/status")
async def status_importacao():
    """Retorna status da importação em andamento"""
    return importacao_status


@api_router.post("/dashboard/reset")
async def reset_dashboard(current_user: str = Depends(get_current_user)):
    """Reseta todas as estatísticas e transações do dashboard
    
    CUIDADO: Esta ação é irreversível!
    Remove:
    - Todas as transações
    - Cache de CNPJs
    - (Mantém: Subset de CNPJs prioritários)
    """
    try:
        # Deletar todas as transações
        result_trans = await db.transactions.delete_many({})
        
        # Deletar cache de CNPJs (mas manter subset)
        result_cache = await db.cnpjs_cache.delete_many({})
        
        logger.warning(f"[RESET] Dashboard resetado por {current_user}")
        logger.warning(f"  - {result_trans.deleted_count} transações removidas")
        logger.warning(f"  - {result_cache.deleted_count} CNPJs em cache removidos")
        
        return {
            "success": True,
            "transacoes_removidas": result_trans.deleted_count,
            "cache_removido": result_cache.deleted_count,
            "message": "Dashboard resetado com sucesso",
            "subset_mantido": True
        }
    except Exception as e:
        logger.error(f"Erro ao resetar dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
