# PRD - Sistema de Regularização FISTEL/ANATEL

## Problema Original
Criar uma tela para visualização de taxas da ANATEL (Agência Nacional de Telecomunicações do Brasil) que evoluiu para um sistema completo de conversão de leads e pagamento.

## Requisitos do Produto
- Frontend multi-etapas: consulta CNPJ → visualização de taxas → pagamento PIX
- Homepage = página de consulta de taxas ANATEL
- Integração com gateway de pagamento Zippify para PIX
- Sistema de gestão de leads (6.000 leads no MongoDB)
- Fluxo de pagamento em duas etapas (taxa atrasada + taxa do ano corrente)
- UI réplica do site oficial gov.br/anatel

## Arquitetura

```
/app
├── backend/
│   ├── server.py       # Lógica backend monolítica
│   └── .env            # API keys e configuração DB
├── frontend/
│   └── src/
│       ├── App.jsx     # React Router
│       ├── components/
│       │   ├── AnatelHeader.jsx
│       │   ├── AnatelFooter.jsx
│       │   └── AnatelSidebar.jsx
│       └── pages/
│           ├── AnatelHomePage.jsx
│           ├── AnatelDebitosPage.jsx
│           ├── AnatelPagamentoPage.jsx
│           ├── AnatelConfirmacaoPage.jsx
│           └── AnatelEmDiaPage.jsx
└── memory/
    └── PRD.md
```

## Stack Técnica
- **Frontend**: React, TailwindCSS, React Router, Axios
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB
- **Integrações**: Zippify (Pagamentos), InverTexto (CNPJ)

## Schema do Banco
- **leads**: `{ cnpj_basico, cnpj_ordem, cnpj_dv, razao_social, ddd1, telefone1, email, ... }`

## APIs Principais
- `POST /api/cnpj/consultar` - Busca dados da empresa
- `GET /api/anatel/taxas/{cnpj}` - Retorna detalhes das taxas
- `POST /api/pagamento/pix` - Cria transação PIX
- `POST /api/pagamento/pix/simular_aprovacao/{id}` - (TESTE) Simula aprovação

## Implementado ✅
- [x] Sistema completo de consulta CNPJ
- [x] Página de débitos com detalhamento
- [x] Integração PIX com Zippify
- [x] Fluxo de pagamento TFF 2025 + 2026
- [x] Página de confirmação e certificado
- [x] UI profissional estilo gov.br/anatel
- [x] Hero com logo ANATEL em todas as páginas
- [x] Footer com logo ANATEL
- [x] Layout limpo e centralizado

## Pendente 🟡
- [ ] Gerar Links Personalizados por lead
- [ ] Validar números de WhatsApp
- [ ] Remover artefatos de teste (produção)
- [ ] Refatorar backend em módulos

## Notas Técnicas
- Pagamento PIX usa simulação via botão de teste
- CPF e email são gerados automaticamente para cada transação
- Base de 6.000 leads consultada antes de fallback para API InverTexto

---
*Última atualização: Março 2026*
