# Design Tokens — 3R Assist

> Pass B output. Referência para implementação M3.
> Toda decisão visual documentada aqui; desvios no M3 requerem entrada no execution-log.md.

---

## Tipografia

| Token | Valor | Uso |
|---|---|---|
| `--font` | DM Sans (fallback: system-ui) | Toda a interface |
| `--mono` | DM Mono (fallback: monospace) | Scores de confiança, parâmetros extraídos |
| Peso regular | 400 | Corpo, labels secundários |
| Peso médio | 500 | Headings, nome de métodos, nav ativo |
| Tamanhos | 17px heading · 14px corpo · 13px campo · 12px label · 11px meta | — |

---

## Cores base

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#F7F6F2` | Fundo de página (off-white quente) |
| `--surface` | `#FFFFFF` | Cards, inputs, nav |
| `--border` | `#E4E2DB` | Bordas padrão (0.5–1px) |
| `--border-md` | `#CBC9C1` | Bordas de ênfase, input focus |
| `--text-1` | `#1A1916` | Texto primário, CTA principal |
| `--text-2` | `#6B6960` | Texto secundário, labels |
| `--text-3` | `#A09E96` | Texto terciário, placeholders |

---

## Cores semânticas — 3Rs

Regra: **badges 3Rs são o único uso de cor cromática na interface.** Tudo o mais é neutro.

| Classe | Background | Texto | Borda | Quando usar |
|---|---|---|---|---|
| Substituição | `#EAF3DE` | `#27500A` | `#639922` | método que substitui animais |
| Redução | `#FAEEDA` | `#633806` | `#BA7517` | método que reduz número de animais |
| Refinamento | `#E1F5EE` | `#085041` | `#1D9E75` | método que melhora procedimento |

---

## Cores semânticas — jurisdição e status

| Classe | Background | Texto | Borda | Quando usar |
|---|---|---|---|---|
| Brasil / Intl. | `#E6F1FB` | `#0C447C` | `#378ADD` | validado nos dois contextos |
| Intl. apenas | `#F1EFE8` | `#5F5E5A` | `#B4B2A9` | sem validação CONCEA |
| Brasil apenas | `#FAEEDA` | `#633806` | `#BA7517` | validado CONCEA, não ECVAM |

---

## Componentes-chave

### Card de resultado
- Borda: `1px solid var(--border)`, `border-radius: 10px`
- Fundo: `var(--surface)`
- Hover: `border-color: var(--border-md)`
- Cards com score ≤ 65%: `opacity: 0.65`
- Score: monospace, `var(--text-3)`, canto superior direito

### CTA primário
- Fundo: `var(--text-1)` (preto)
- Texto: `#FFFFFF`
- Sem cor cromática — sobriedade científica

### Input de protocolo
- Shell com borda `var(--border-md)`
- Focus: `border-color: var(--text-1)` (transição 150ms)
- Lang toggle: pills dentro do campo (não fora)

### Navigation
- Nav link ativo: `border-bottom: 2px solid var(--text-1)`, `font-weight: 500`
- Altura: 48px
- Fundo: `var(--surface)`

---

## Questão aberta para validação

O tom da paleta quente (off-white `#F7F6F2`) precisa ser validado com a Karynn antes de M3.

**Hipótese favorável:** pesquisadores e membros de CEUA associam a paleta quente com seriedade acadêmica (como papel de documento) — mais confortável do que azul-frio corporativo.

**Hipótese contrária:** em contexto regulatório formal, o off-white pode parecer informal ou pouco profissional — preferência por branco puro e azul institucional.

**Como testar:** mostrar o `pass-b-visual.html` para 2–3 pesquisadores/membros de CEUA da rede da Karynn antes de implementar. Pergunta direta: "Você submeteria uma consulta usando esta ferramenta em contexto de revisão de protocolo?"

---

*Criado em M2.5 Pass B. Referência para M3 implementação frontend.*
