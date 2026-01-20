from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import base64
import json

ROOT_DIR = Path(__file__).parent
# Carregar .env da raiz do projeto (onde estão as credenciais dos gateways)
load_dotenv('/app/.env')

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


# Helper Functions
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


# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "MEI Payment System API", "version": "2.0"}

@api_router.post("/cnpj/consultar", response_model=CNPJResponse)
async def consultar_cnpj(data: CNPJConsulta):
    """Consulta dados do CNPJ via API externa"""
    cnpj_limpo = data.cnpj.replace('.', '').replace('/', '').replace('-', '')
    
    try:
        # Tentar API externa
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://app-site-s2p-bff-prod.azurewebsites.net/v2/ReceitaFederal/{cnpj_limpo}"
            )
            
            if response.status_code == 200:
                api_data = response.json()
                if api_data.get('ResponseDetail'):
                    detail = api_data['ResponseDetail']
                    return CNPJResponse(
                        cnpj=detail.get('cnpj', data.cnpj),
                        nome=detail.get('nome', 'Empresa MEI'),
                        situacao=detail.get('situacao', 'ATIVA')
                    )
    except Exception as e:
        logger.warning(f"API CNPJ falhou: {e}")
    
    # Retornar dados mockados se API falhar
    return CNPJResponse(
        cnpj=data.cnpj,
        nome="EMPRESA MEI EXEMPLO LTDA",
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
            DebitoItem(mes="Dezembro/2025", valor=80.90, status="EM ABERTO"),
            DebitoItem(mes="Novembro/2025", valor=80.90, status="EM ABERTO")
        ]
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
