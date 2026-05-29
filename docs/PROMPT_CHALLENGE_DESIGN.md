# PROMPT_CHALLENGE_DESIGN

> Categoria: CHALLENGE
> Módulo: M2.5 — UI Design, Pass A
> Referência: Framework v1.5, Appendix B

---

## Prompt

```
Stage: DESIGN
Input: [colar /design/pass-a-structure.md]

Produce:
1. Os três motivos mais fortes pelos quais este design falhará ou estará errado.
2. A única suposição que, se falsa, causa mais dano ao fluxo de UX.
3. Uma versão mais simples que atinge o mesmo objetivo principal com menos telas ou estados.
4. Uma coisa que provavelmente não estou vendo por estar perto demais.

5. Onde os padrões/defaults da ferramenta de IA conduziram decisões de design em vez da intenção declarada?
6. Qual tela o designer está menos confiante sobre, e o que resolveria essa incerteza?
```

---

## Como usar

Rodar após finalizar o Pass A. Resultado alimenta a decisão de prosseguir para Pass B ou fazer ajustes estruturais.

Se algum achado alterar a estrutura de telas ou o fluxo de navegação:
1. Atualizar `/design/pass-a-structure.md`
2. Se contradir `spec.md` seções 2.2, 2.3, ou 2.10 → atualizar `spec.md` e registrar ADR explicando por que o design supersedeu o spec (Spec Sync — M2.5.6)

---

## Checklist Spec Sync (M2.5.6 — gate obrigatório)

Antes de fechar o M2.5, comparar o design contra `spec.md` seções 2.2, 2.3 e 2.10.

Para cada divergência:
- [ ] `spec.md` atualizado para refletir a decisão de design
- [ ] ADR criado em `decisions.md` explicando por que o design supersedeu o spec

Contradições não resolvidas são problemas do M2.5, não do M3.
