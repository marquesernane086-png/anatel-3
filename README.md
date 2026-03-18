# Portal ANATEL - Sistema de Regularização FISTEL

## 🚀 Instalação Rápida (1 comando)

```bash
# No servidor Ubuntu 22.04, execute:
git clone https://github.com/SEU_USUARIO/portal-anatel.git
cd portal-anatel
sudo bash install.sh portal-anatel.com
sudo bash install-ssl.sh portal-anatel.com
```

## 📋 Requisitos
- Ubuntu 22.04 LTS
- 1GB RAM mínimo
- 20GB Storage
- Domínio configurado

## 🔧 O que o instalador faz automaticamente:
1. ✅ Instala Node.js 18
2. ✅ Instala Python 3.11
3. ✅ Instala MongoDB 7.0
4. ✅ Instala Nginx
5. ✅ Configura Backend (FastAPI)
6. ✅ Configura Frontend (React)
7. ✅ Configura PM2
8. ✅ Configura Nginx como proxy reverso

## 📁 Estrutura
```
/var/www/portal-anatel/
├── backend/          # FastAPI
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/         # React
│   ├── src/
│   ├── build/        # Arquivos de produção
│   └── .env
├── install.sh        # Instalador principal
└── install-ssl.sh    # Instalador SSL
```

## ⚙️ Configuração

### Variáveis de Ambiente (backend/.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="portal_anatel"
ADMIN_USERNAME="anatel"
ADMIN_PASSWORD="fla10"
ZIPPIFY_API_TOKEN="seu_token_zippify"
ZIPPIFY_BASE_URL="https://api.zippify.com.br/api/public/v1"
```

## 🔗 URLs
- **Site:** https://portal-anatel.com
- **Painel Admin:** https://portal-anatel.com/painel
- **Webhook:** https://portal-anatel.com/api/webhook/zippify

## 📊 Comandos Úteis
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs backend

# Reiniciar backend
pm2 restart backend

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 Segurança
- Login: anatel / fla10
- JWT para autenticação
- HTTPS obrigatório em produção

## 📞 Suporte
- Webhook Zippify: Configure em Configurações → Webhooks
- DNS: Aponte A record para IP do servidor
