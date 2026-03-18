#!/bin/bash

#############################################
# 🔒 INSTALAR SSL - PORTAL ANATEL
# Execute após install.sh
#############################################

DOMAIN=${1:-"portal-anatel.com"}

echo "Instalando SSL para $DOMAIN..."

# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Configurar renovação automática
systemctl enable certbot.timer

echo "✅ SSL instalado com sucesso!"
echo "Certificado renova automaticamente."
