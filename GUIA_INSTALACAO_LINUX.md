# 🚀 Guia Completo de Instalação - Portal ANATEL

## Servidor Recomendado
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 1GB+ 
- **CPU:** 1 vCPU
- **Storage:** 20GB
- **IP:** Dedicado

---

## 1️⃣ PREPARAÇÃO DO SERVIDOR

```bash
# Conectar ao servidor via SSH
ssh root@SEU_IP

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git unzip software-properties-common
```

---

## 2️⃣ INSTALAR NODE.JS 18+

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
apt install -y nodejs

# Verificar versão
node -v  # Deve mostrar v18.x.x
npm -v

# Instalar Yarn e PM2
npm install -g yarn pm2
```

---

## 3️⃣ INSTALAR PYTHON 3.11+

```bash
# Adicionar repositório
add-apt-repository ppa:deadsnakes/ppa -y
apt update

# Instalar Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Verificar versão
python3.11 --version
```

---

## 4️⃣ INSTALAR MONGODB

```bash
# Importar chave GPG
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Adicionar repositório
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar MongoDB
apt update
apt install -y mongodb-org

# Iniciar e habilitar
systemctl start mongod
systemctl enable mongod

# Verificar status
systemctl status mongod
```

---

## 5️⃣ INSTALAR NGINX

```bash
apt install -y nginx

# Iniciar e habilitar
systemctl start nginx
systemctl enable nginx
```

---

## 6️⃣ CRIAR ESTRUTURA DO PROJETO

```bash
# Criar diretório
mkdir -p /var/www/portal-anatel
cd /var/www/portal-anatel

# Criar subpastas
mkdir backend frontend
```

---

## 7️⃣ UPLOAD DOS ARQUIVOS

### Opção A: Via SCP (do seu computador)
```bash
# No seu computador local, execute:
scp -r /caminho/do/projeto/backend/* root@SEU_IP:/var/www/portal-anatel/backend/
scp -r /caminho/do/projeto/frontend/* root@SEU_IP:/var/www/portal-anatel/frontend/
```

### Opção B: Via Git
```bash
# Se tiver repositório Git
cd /var/www/portal-anatel
git clone SEU_REPOSITORIO .
```

### Opção C: Via SFTP (FileZilla)
- Host: SEU_IP
- Usuário: root
- Porta: 22
- Upload para: /var/www/portal-anatel/

---

## 8️⃣ CONFIGURAR BACKEND

```bash
cd /var/www/portal-anatel/backend

# Criar ambiente virtual
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="portal_anatel"
CORS_ORIGINS="*"

# JWT Secret
JWT_SECRET_KEY="anatel-2025-super-secret-key-production"

# Admin credentials
ADMIN_USERNAME="anatel"
ADMIN_PASSWORD="fla10"

# InverTexto API
INVERTEXTO_API_TOKEN="24022|1JFsJD58TYjlRBqFYD0dz8yIjI3qdiKu"
INVERTEXTO_BASE_URL="https://api.invertexto.com/v1"

# Zippify Gateway
ZIPPIFY_API_TOKEN="pqWpAXkg9tAdxAm07xAQ4d6IODUw6C5Y0u7oL0CpfN92RFfpsqvJRkDpPqhU"
ZIPPIFY_API_KEY="pqWpAXkg9tAdxAm07xAQ4d6IODUw6C5Y0u7oL0CpfN92RFfpsqvJRkDpPqhU"
ZIPPIFY_BASE_URL="https://api.zippify.com.br/api/public/v1"

# Webhook
WEBHOOK_URL="https://portal-anatel.com/api/webhook/zippify"
EOF

# Testar se funciona
uvicorn server:app --host 0.0.0.0 --port 8001
# Ctrl+C para parar

# Iniciar com PM2
pm2 start "cd /var/www/portal-anatel/backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001" --name backend

# Salvar configuração PM2
pm2 save
pm2 startup
```

---

## 9️⃣ CONFIGURAR FRONTEND

```bash
cd /var/www/portal-anatel/frontend

# Criar arquivo .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://portal-anatel.com
EOF

# Instalar dependências
yarn install

# Build de produção
yarn build

# Os arquivos estáticos estarão em /var/www/portal-anatel/frontend/build
```

---

## 🔟 CONFIGURAR NGINX

```bash
# Criar configuração do site
cat > /etc/nginx/sites-available/portal-anatel << 'EOF'
server {
    listen 80;
    server_name portal-anatel.com www.portal-anatel.com;

    # Frontend - Arquivos estáticos
    root /var/www/portal-anatel/frontend/build;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8001/health;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/portal-anatel /etc/nginx/sites-enabled/

# Remover site padrão
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## 1️⃣1️⃣ CONFIGURAR SSL (HTTPS)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado SSL (substitua pelo seu domínio)
certbot --nginx -d portal-anatel.com -d www.portal-anatel.com

# Aceitar os termos e seguir instruções

# Renovação automática (já configurada por padrão)
certbot renew --dry-run
```

---

## 1️⃣2️⃣ CONFIGURAR FIREWALL

```bash
# Instalar UFW
apt install -y ufw

# Configurar regras
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 27017  # MongoDB (se precisar acesso externo)

# Ativar firewall
ufw enable

# Verificar status
ufw status
```

---

## 1️⃣3️⃣ CONFIGURAR DNS

No painel do seu domínio (portal-anatel.com), configure:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | SEU_IP_DO_SERVIDOR | 3600 |
| A | www | SEU_IP_DO_SERVIDOR | 3600 |

---

## 1️⃣4️⃣ IMPORTAR LEADS (OPCIONAL)

```bash
cd /var/www/portal-anatel

# Upload do arquivo leads_60000.json via SCP/SFTP

# Importar para MongoDB
mongoimport --db portal_anatel --collection leads --file leads_60000.json --jsonArray
```

---

## ✅ VERIFICAÇÃO FINAL

```bash
# Verificar serviços
systemctl status nginx
systemctl status mongod
pm2 status

# Testar backend
curl http://localhost:8001/health

# Testar frontend
curl http://localhost/

# Testar API
curl -X POST http://localhost:8001/api/pagamento/pix \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"12345678000190","nome":"TESTE","email":"t@t.com","valor":68.85}'
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Reiniciar backend
pm2 restart backend

# Ver logs do backend
pm2 logs backend

# Reiniciar Nginx
systemctl restart nginx

# Ver logs do Nginx
tail -f /var/log/nginx/error.log

# Ver logs do MongoDB
tail -f /var/log/mongodb/mongod.log

# Backup do MongoDB
mongodump --db portal_anatel --out /backup/$(date +%Y%m%d)

# Restaurar MongoDB
mongorestore --db portal_anatel /backup/YYYYMMDD/portal_anatel
```

---

## 🚨 TROUBLESHOOTING

### Erro 502 Bad Gateway
```bash
# Verificar se backend está rodando
pm2 status
pm2 restart backend
```

### Erro de conexão MongoDB
```bash
# Verificar se MongoDB está rodando
systemctl status mongod
systemctl restart mongod
```

### Erro de permissão
```bash
# Corrigir permissões
chown -R www-data:www-data /var/www/portal-anatel
chmod -R 755 /var/www/portal-anatel
```

### Certificado SSL não renova
```bash
certbot renew --force-renewal
systemctl restart nginx
```

---

## 📞 WEBHOOK ZIPPIFY

Configure no painel da Zippify:
- **URL:** `https://portal-anatel.com/api/webhook/zippify`
- **Eventos:** Pagamento PIX Aprovado

---

## 📊 MONITORAMENTO

```bash
# Instalar htop
apt install -y htop

# Ver recursos
htop

# Ver uso de disco
df -h

# Ver memória
free -m
```

---

**🎉 Pronto! Seu site estará disponível em https://portal-anatel.com**
