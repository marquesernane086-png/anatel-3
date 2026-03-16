# Templates de Mensagens - ANATEL FISTEL

## Template Principal (WhatsApp)

```
⚠️ ANATEL – Débito FISTEL

{{razao_social}}
CNPJ: {{cnpj}}

Consta em nosso sistema pendência da Taxa de Fiscalização de Funcionamento (TFF) referente ao exercício 2025.

📞 Linha: {{numero}}
📅 Prazo final: {{data_prazo}}

Caso não seja quitada até a data limite, a linha poderá sofrer bloqueio ou suspensão, conforme regulamentação da Resolução nº 632/2025 da Agência Nacional de Telecomunicações.

Regularize pelo link abaixo:
🔗 {{link}}
```

## Variáveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{razao_social}}` | Nome da empresa | GIL RANDERSON DE ASSIS CERQUEIRA |
| `{{cnpj}}` | CNPJ formatado | 47.420.867/0001-60 |
| `{{numero}}` | Telefone com DDD | (71) 996939035 |
| `{{data_prazo}}` | Data limite | 20/03/2026 |
| `{{link}}` | Link de pagamento | https://telecoms-brazil.preview.emergentagent.com/anatel?cnpj=47420867000160 |

## Exemplo Preenchido

```
⚠️ ANATEL – Débito FISTEL

GIL RANDERSON DE ASSIS CERQUEIRA
CNPJ: 47.420.867/0001-60

Consta em nosso sistema pendência da Taxa de Fiscalização de Funcionamento (TFF) referente ao exercício 2025.

📞 Linha: (71) 996939035
📅 Prazo final: 20/03/2026

Caso não seja quitada até a data limite, a linha poderá sofrer bloqueio ou suspensão, conforme regulamentação da Resolução nº 632/2025 da Agência Nacional de Telecomunicações.

Regularize pelo link abaixo:
🔗 https://telecoms-brazil.preview.emergentagent.com/anatel?cnpj=47420867000160
```
