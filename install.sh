#!/bin/bash

#############################################
# 🚀 INSTALADOR AUTOMÁTICO - PORTAL ANATEL
# Execute como root: bash install.sh
#############################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "============================================"
echo "   INSTALADOR PORTAL ANATEL"
echo "============================================"
echo -e "${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Execute como root: sudo bash install.sh${NC}"
  exit 1
fi

# Variáveis
DOMAIN=${1:-"portal-anatel.com"}
APP_DIR="/var/www/portal-anatel"

echo -e "${YELLOW}Domínio: $DOMAIN${NC}"
echo ""

#############################################
# 1. ATUALIZAR SISTEMA
#############################################
echo -e "${GREEN}[1/10] Atualizando sistema...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

#############################################
# 2. INSTALAR NODE.JS 18
#############################################
echo -e "${GREEN}[2/10] Instalando Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
npm install -g yarn pm2

#############################################
# 3. INSTALAR PYTHON 3.11
#############################################
echo -e "${GREEN}[3/10] Instalando Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3-pip

#############################################
# 4. INSTALAR MONGODB
#############################################
echo -e "${GREEN}[4/10] Instalando MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod

#############################################
# 5. INSTALAR NGINX
#############################################
echo -e "${GREEN}[5/10] Instalando Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

#############################################
# 6. CRIAR DIRETÓRIOS
#############################################
echo -e "${GREEN}[6/10] Criando estrutura...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

#############################################
# 7. COPIAR ARQUIVOS (se existirem no mesmo diretório)
#############################################
echo -e "${GREEN}[7/10] Configurando aplicação...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -d "$SCRIPT_DIR/backend" ]; then
    cp -r $SCRIPT_DIR/backend $APP_DIR/
    cp -r $SCRIPT_DIR/frontend $APP_DIR/
fi

#############################################
# 8. CONFIGURAR BACKEND
#############################################
echo -e "${GREEN}[8/10] Configurando backend...${NC}"
cd $APP_DIR/backend

# Criar venv
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar .env se não existir
if [ ! -f .env ]; then
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="portal_anatel"
CORS_ORIGINS="*"
JWT_SECRET_KEY="anatel-2025-super-secret-key-production"
ADMIN_USERNAME="anatel"
ADMIN_PASSWORD="fla10"
INVERTEXTO_API_TOKEN="24022|1JFsJD58TYjlRBqFYD0dz8yIjI3qdiKu"
INVERTEXTO_BASE_URL="https://api.invertexto.com/v1"
ZIPPIFY_API_TOKEN="pqWpAXkg9tAdxAm07xAQ4d6IODUw6C5Y0u7oL0CpfN92RFfpsqvJRkDpPqhU"
ZIPPIFY_API_KEY="pqWpAXkg9tAdxAm07xAQ4d6IODUw6C5Y0u7oL0CpfN92RFfpsqvJRkDpPqhU"
ZIPPIFY_BASE_URL="https://api.zippify.com.br/api/public/v1"
WEBHOOK_URL="https://$DOMAIN/api/webhook/zippify"
EOF
fi

# Iniciar com PM2
pm2 delete backend 2>/dev/null || true
pm2 start "cd $APP_DIR/backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001" --name backend
pm2 save

deactivate

#############################################
# 9. CONFIGURAR FRONTEND
#############################################
echo -e "${GREEN}[9/10] Configurando frontend...${NC}"
cd $APP_DIR/frontend

# Criar .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# Instalar e build
yarn install
yarn build

#############################################
# 10. CONFIGURAR NGINX
#############################################
echo -e "${GREEN}[10/10] Configurando Nginx...${NC}"

cat > /etc/nginx/sites-available/portal-anatel << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/frontend/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://127.0.0.1:8001/health;
    }
}
EOF

ln -sf /etc/nginx/sites-available/portal-anatel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

#############################################
# FINALIZAÇÃO
#############################################
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   ✅ INSTALAÇÃO CONCLUÍDA!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Domínio: ${YELLOW}$DOMAIN${NC}"
echo -e "Backend: ${YELLOW}http://localhost:8001${NC}"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
echo "1. Configure o DNS do domínio apontando para este IP"
echo "2. Execute: ${GREEN}sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
echo "3. Configure o webhook na Zippify: https://$DOMAIN/api/webhook/zippify"
echo ""
echo -e "Comandos úteis:"
echo "  pm2 logs backend     - Ver logs"
echo "  pm2 restart backend  - Reiniciar backend"
echo ""
