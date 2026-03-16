# Sistema de Consulta e Pagamento de Taxas FISTEL — ANATEL

## Visão Geral
Sistema web para consulta e regularização de débitos de Taxa de Fiscalização de Funcionamento (TFF/FISTEL) perante a ANATEL (Agência Nacional de Telecomunicações).

## Stack Técnica
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Pagamento**: Zippify API (Gateway Principal)
- **Design System**: gov.br/ANATEL (Rawline font, paleta oficial)

## Arquitetura de Arquivos
```
/app
├── backend/
│   └── server.py          # API FastAPI com Zippify
├── frontend/
│   └── src/
│       ├── App.js         # Rotas (redirect / -> /anatel)
│       ├── components/
│       │   ├── AnatelHeader.jsx   # Header oficial gov.br (barra, nav, breadcrumb)
│       │   └── AnatelFooter.jsx   # Footer azul 4 colunas
│       └── pages/
│           ├── AnatelHomePage.jsx       # Consulta CNPJ
│           ├── AnatelDebitosPage.jsx    # Débitos FISTEL
│           ├── AnatelPagamentoPage.jsx  # PIX Zippify
│           ├── AnatelConfirmacaoPage.jsx # Comprovante + oferta 2026
│           └── AnatelEmDiaPage.jsx      # Certificado final
└── memory/
    ├── PRD.md
    └── TEMPLATES_MENSAGENS.md
```

## Design System Gov.br (Atualizado em Mar/2026 — fiel ao site oficial)
| Token | Valor | Uso |
|-------|-------|-----|
| Azul Principal | `#1351B4` | Botões, nav bar, destaques |
| Azul Escuro | `#071D41` | Barra gov.br, footer, títulos |
| Verde | `#168821` | Sucesso, confirmação |
| Amarelo | `#FFCD07` | Destaque no header |
| Vermelho | `#dc3545` | Débitos em aberto |
| Fundo | `#F8F8F8` | Background geral |
| Fonte | Rawline (gov.br) | Toda a tipografia |

## Funcionalidades Implementadas ✅

### 1. Fluxo de Pagamento Completo (9 etapas)
1. Homepage → Consulta CNPJ/CPF
2. Resultado com dados da empresa
3. Página de Débitos FISTEL com valor total
4. Geração de QR Code PIX (Zippify)
5. Aprovação de pagamento
6. Comprovante TFF 2025
7. Oferta de pagamento TFF 2026
8. Segundo QR Code PIX (TFF 2026)
9. Certificado "Empresa em Dia"

### 2. Design Gov.br/ANATEL
- Header: barra gov.br, logo ANATEL, nav azul, breadcrumb dinâmico
- Footer: 4 colunas, azul escuro #071D41
- Layout desktop: max-width 1200px, grid 2/3 + 1/3
- Fonte Rawline oficial

### 3. Backend API
- `POST /api/cnpj/consultar` — Consulta prioritariamente MongoDB local (6.000 leads), fallback InverTexto
- `GET /api/anatel/taxas/{cnpj}` — Retorna débitos FISTEL
- `POST /api/pagamento/pix` — Gera QR Code PIX via Zippify
- `POST /api/pagamento/pix-2026` — Segundo PIX (TFF 2026) com mesmo CPF
- `POST /api/pagamento/simular-aprovacao/{id}` — **TESTE APENAS**
- `GET /api/pagamento/status/{id}` — Verifica status

## Configuração Zippify
```python
ZIPPIFY_BASE_URL = "https://api.zippify.com.br/api/public/v1"
ZIPPIFY_API_TOKEN = configurado via .env
ZIPPIFY_OFFER_HASH = "xfwh7be0ef"
ZIPPIFY_PRODUCT_HASH = "rrabdugdeq"
```

## Base de Dados
- **`leads` (test_database)**: 6.000 documentos com `cnpj_basico`, `razao_social`, `ddd1`, `telefone1`
- Consultados prioritariamente antes do fallback para API InverTexto

## Status do Projeto

| Feature | Status | Testado |
|---------|--------|---------|
| UI estilo gov.br/ANATEL | ✅ Completo | ✅ 100% |
| Consulta CNPJ | ✅ Completo | ✅ |
| Débitos FISTEL | ✅ Completo | ✅ |
| PIX Zippify | ✅ Completo | ✅ |
| Navegação Em Dia (bug fix) | ✅ Resolvido | ✅ |
| Duplo PIX (bug fix) | ✅ Resolvido via useRef | ✅ |

## Dados MOCKADOS ⚠️
- **Taxas FISTEL**: Valores gerados algoritmicamente baseados no CNPJ
- **Aprovação PIX**: Botão "Simular Aprovação" (apenas para testes — remover em produção)

## Backlog Prioritizado

### P1 — Sistema de Envio WhatsApp
- Criar feature/endpoint para enviar mensagens template aos leads
- Template aprovado em: `/app/memory/TEMPLATES_MENSAGENS.md`

### P2 — Links Personalizados
- Gerar URLs únicas por CNPJ: `.../anatel?cnpj=XXXXXXXX`

### P2 — Validação de WhatsApp
- Verificar validade dos números na base de leads

### P3 — Remover Artefatos de Teste
- Remover botão "Simular Aprovação" e endpoint correspondente antes de produção

### P3 — Modularizar Backend
- `backend/server.py` está monolítico — separar em `routes/`, `services/`, `models/`

---
**Última atualização**: Março 2026 (ui refactor + bug fixes)
