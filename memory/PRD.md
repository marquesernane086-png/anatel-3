# Sistema de Consulta e Pagamento de Taxas FISTEL - ANATEL

## Visão Geral
Sistema web para consulta e regularização de débitos de Taxa de Fiscalização de Telecomunicações (FISTEL) perante a ANATEL (Agência Nacional de Telecomunicações).

## Stack Técnica
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Pagamento**: Integração PIX via PagLoop/FuriaPay

## Funcionalidades Implementadas

### 1. Módulo ANATEL/FISTEL ✅
- **AnatelHomePage**: Página inicial com consulta de CNPJ
- **AnatelDebitosPage**: Detalhamento dos débitos FISTEL (TFF/TFI)
- **AnatelPagamentoPage**: Geração de QR Code PIX para pagamento
- **AnatelConfirmacaoPage**: Comprovante de regularização

### 2. Design Gov.br ✅
- Header com barra gov.br institucional
- Logo ANATEL com identidade visual oficial
- Navegação institucional (Consumidor, Outorgas, Homologação, etc.)
- Footer com informações de contato e serviços
- Cores institucionais: #003580 (azul ANATEL), #071D41 (azul gov.br)

### 3. Backend API ✅
- `POST /api/cnpj/consultar` - Consulta dados do CNPJ
- `GET /api/anatel/taxas/{cnpj}` - Retorna débitos FISTEL
- `POST /api/pagamento/pix` - Gera QR Code PIX
- `GET /api/pagamento/status/{id}` - Verifica status do pagamento

### 4. Fluxo de Usuário ✅
1. Usuário acessa `/anatel`
2. Digita CNPJ/CPF no campo de consulta
3. Sistema exibe dados da empresa e alerta de débitos
4. Clica em "Ver Débitos FISTEL"
5. Visualiza detalhamento (TFF, TFI, valores, acréscimos)
6. Clica em "Regularizar Taxa FISTEL"
7. QR Code PIX é gerado para pagamento
8. Após confirmação, exibe comprovante

## Arquitetura de Arquivos

```
/app
├── backend/
│   └── server.py          # API FastAPI com endpoints ANATEL
├── frontend/
│   └── src/
│       ├── App.js         # Rotas principais
│       ├── components/
│       │   ├── AnatelHeader.jsx
│       │   └── AnatelFooter.jsx
│       └── pages/
│           ├── AnatelHomePage.jsx
│           ├── AnatelDebitosPage.jsx
│           ├── AnatelPagamentoPage.jsx
│           └── AnatelConfirmacaoPage.jsx
└── memory/
    └── PRD.md
```

## Status do Projeto

| Feature | Status | Testado |
|---------|--------|---------|
| Consulta CNPJ | ✅ Completo | ✅ |
| Cálculo Taxas FISTEL | ✅ Completo | ✅ |
| Página de Débitos | ✅ Completo | ✅ |
| Geração PIX | ✅ Completo | ✅ |
| Design Institucional | ✅ Completo | ✅ |

## Dados MOCKADOS ⚠️
- **Taxas FISTEL**: Valores são gerados algoritmicamente baseados no CNPJ
- **Dados do CNPJ**: Fallback para dados mockados quando API externa falha

## Próximos Passos (Backlog)
1. Integração com API real da ANATEL (se disponível)
2. Implementar autenticação de usuários
3. Histórico de pagamentos por CNPJ
4. Notificações por email de vencimento
5. Dashboard administrativo para monitoramento

## Referências de Design
- Site oficial: gov.br/anatel
- Repositório UI/UX: github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Padrão: "Accessible & Ethical Design" / "Minimalism & Swiss Style"

---
**Última atualização**: Dezembro 2025
