

## Plano: Resolver 8 Findings de Segurança

São 8 findings no total — **2 erros críticos** e **6 warnings**. Todos podem ser resolvidos sem quebrar nada.

### Resumo dos Findings

| # | Severidade | Problema | Solução |
|---|-----------|----------|---------|
| 1 | **ERRO** | `wa-test` acessível sem autenticação | Deletar o endpoint (é só teste) |
| 2 | **ERRO** | `wa_users` com dados de clientes expostos publicamente | Restringir SELECT com RLS — só service_role acessa |
| 3 | WARN | Webhook loga dados sensíveis no console | Sanitizar logs (mascarar telefones, remover payload raw) |
| 4 | WARN | Webhook não valida estrutura do payload | Adicionar validação básica de schema |
| 5 | WARN | Código debug em produção (echo de mensagem 🧪) | Rem