## Descrição

> Descreva brevemente o propósito desta mudança. O que ela faz e por quê?

---

## Checklist de merge

Confirme todos os itens antes de solicitar revisão:

- [ ] **CI verde** — todos os checks de lint, typecheck e test passaram.
- [ ] **Sem segredos** — nenhum arquivo `.env` real, token, senha ou chave privada foi versionado.
- [ ] **Lint passou** — `pnpm nx run-many -t lint --all` sem erros.
- [ ] **Typecheck passou** — `pnpm nx run-many -t typecheck --all` sem erros.
- [ ] **Testes passaram** — `pnpm nx run-many -t test --all --passWithNoTests` sem falhas.
- [ ] **Docs atualizadas** — README, comentários ou docs impactados foram atualizados.
- [ ] **Sem `.env` real** — confirmado via `git ls-files | grep -E '^\.env$'` (deve retornar vazio).
- [ ] **Escopo correto** — apenas mudanças relacionadas à story/task descritas acima.

---

## Política de falha

Pull requests que não atendam aos critérios acima **não serão mergeados**.  
Se algum check obrigatório falhar, corrija e reabra a revisão.
