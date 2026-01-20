#!/usr/bin/env python3
"""
Script para importar 3 milhões de CNPJs para o MongoDB

USO:
1. Prepare seu arquivo CSV/JSON com os CNPJs
2. Execute: python importar_cnpjs.py arquivo.csv
3. O script importa em batches de 10.000 para otimização

FORMATO CSV ESPERADO:
cnpj,nome,situacao
12345678000190,EMPRESA TESTE LTDA,ATIVA
98765432000111,OUTRA EMPRESA LTDA,ATIVA
"""

import asyncio
import csv
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from pathlib import Path

# Configuração MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')

BATCH_SIZE = 10000  # Importar 10k por vez (otimizado)


async def importar_de_csv(arquivo_path: str):
    """Importa CNPJs de arquivo CSV"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"🚀 Iniciando importação de {arquivo_path}")
    print(f"📊 Batch size: {BATCH_SIZE}")
    
    try:
        with open(arquivo_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            batch = []
            total_importados = 0
            total_erros = 0
            
            for row in reader:
                cnpj_limpo = row['cnpj'].replace('.', '').replace('/', '').replace('-', '')
                
                doc = {
                    'cnpj': cnpj_limpo,
                    'cnpj_formatado': row['cnpj'],
                    'nome': row['nome'],
                    'situacao': row.get('situacao', 'ATIVA'),
                    'fonte': 'importacao_csv',
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                
                batch.append(doc)
                
                # Quando atingir o tamanho do batch, inserir
                if len(batch) >= BATCH_SIZE:
                    try:
                        await db.cnpjs_database.insert_many(batch, ordered=False)
                        total_importados += len(batch)
                        print(f"✅ Importados: {total_importados:,} CNPJs")
                    except Exception as e:
                        print(f"⚠️  Erro no batch: {e}")
                        total_erros += len(batch)
                    
                    batch = []
            
            # Importar último batch (se houver)
            if batch:
                try:
                    await db.cnpjs_database.insert_many(batch, ordered=False)
                    total_importados += len(batch)
                    print(f"✅ Importados: {total_importados:,} CNPJs")
                except Exception as e:
                    print(f"⚠️  Erro no último batch: {e}")
                    total_erros += len(batch)
        
        # Criar índices após importação
        print("\n📊 Criando índices...")
        await db.cnpjs_database.create_index("cnpj", unique=True)
        await db.cnpjs_database.create_index("situacao")
        
        print(f"\n✅ Importação concluída!")
        print(f"   Total importados: {total_importados:,}")
        print(f"   Total erros: {total_erros:,}")
        print(f"   Índices criados: 2")
        
    finally:
        client.close()


async def importar_de_json(arquivo_path: str):
    """Importa CNPJs de arquivo JSON"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"🚀 Iniciando importação de {arquivo_path}")
    
    try:
        with open(arquivo_path, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        print(f"📊 Total de registros: {len(dados):,}")
        
        # Processar em batches
        for i in range(0, len(dados), BATCH_SIZE):
            batch_data = dados[i:i + BATCH_SIZE]
            
            batch = []
            for item in batch_data:
                cnpj_limpo = item['cnpj'].replace('.', '').replace('/', '').replace('-', '')
                doc = {
                    'cnpj': cnpj_limpo,
                    'cnpj_formatado': item['cnpj'],
                    'nome': item['nome'],
                    'situacao': item.get('situacao', 'ATIVA'),
                    'fonte': 'importacao_json',
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                batch.append(doc)
            
            try:
                await db.cnpjs_database.insert_many(batch, ordered=False)
                print(f"✅ Importados: {i + len(batch):,} / {len(dados):,} CNPJs")
            except Exception as e:
                print(f"⚠️  Erro no batch {i}: {e}")
        
        # Criar índices
        print("\n📊 Criando índices...")
        await db.cnpjs_database.create_index("cnpj", unique=True)
        await db.cnpjs_database.create_index("situacao")
        
        print(f"\n✅ Importação concluída!")
        
    finally:
        client.close()


async def gerar_cnpjs_exemplo(quantidade: int = 100):
    """Gera CNPJs de exemplo para teste"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"🚀 Gerando {quantidade:,} CNPJs de exemplo")
    
    try:
        batch = []
        for i in range(quantidade):
            # Gerar CNPJ fictício
            cnpj_num = f"{10000000000000 + i:014d}"
            cnpj_formatado = f"{cnpj_num[:2]}.{cnpj_num[2:5]}.{cnpj_num[5:8]}/{cnpj_num[8:12]}-{cnpj_num[12:14]}"
            
            doc = {
                'cnpj': cnpj_num,
                'cnpj_formatado': cnpj_formatado,
                'nome': f"EMPRESA MEI {i+1:06d} LTDA",
                'situacao': 'ATIVA',
                'fonte': 'geracao_automatica',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            batch.append(doc)
            
            # Inserir em batches
            if len(batch) >= BATCH_SIZE:
                await db.cnpjs_database.insert_many(batch, ordered=False)
                print(f"✅ Gerados: {i+1:,} CNPJs")
                batch = []
        
        # Inserir último batch
        if batch:
            await db.cnpjs_database.insert_many(batch, ordered=False)
        
        # Criar índices
        await db.cnpjs_database.create_index("cnpj", unique=True)
        
        print(f"\n✅ {quantidade:,} CNPJs de exemplo criados!")
        
    finally:
        client.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("📋 USO:")
        print("  python importar_cnpjs.py arquivo.csv")
        print("  python importar_cnpjs.py arquivo.json")
        print("  python importar_cnpjs.py --gerar 100000  # Gerar 100k de exemplo")
        sys.exit(1)
    
    comando = sys.argv[1]
    
    if comando == '--gerar':
        quantidade = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        asyncio.run(gerar_cnpjs_exemplo(quantidade))
    elif comando.endswith('.csv'):
        asyncio.run(importar_de_csv(comando))
    elif comando.endswith('.json'):
        asyncio.run(importar_de_json(comando))
    else:
        print("❌ Formato não suportado. Use .csv ou .json")
