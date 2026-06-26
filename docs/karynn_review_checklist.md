# Karynn Review Checklist — 3R Assist Methods Database

> **Propósito:** Confirmar todos os campos `[VERIFY]` e preencher contextos de validação antes de `active = TRUE`.
> Nenhum método é retornado ao usuário até que `active = TRUE` seja definido.
>
> **Comando para ativar após revisão completa:**
> ```sql
> UPDATE methods SET active = TRUE, updated_at = NOW() WHERE slug = '<slug>';
> ```
>
> **Como usar:**
> 1. Completar a seção **Campos globais** antes de revisar métodos individuais.
> 2. Para cada método: confirmar campos do método + preencher tabela de contextos de validação.
> 3. Marcar ☑ e registrar valor confirmado ou "sem alteração".
> 4. Executar UPDATE SQL.
> 5. Registrar data e observações na tabela-resumo.

---

## Tabela-resumo

| # | Slug | Endpoint | Contextos seeded | active | Data | Obs |
|---|---|---|---|---|---|---|
| 1 | oecd-tg439-epiderm | skin_irritation | brazil·oecd | ☐ | | |
| 2 | oecd-tg439-episkin | skin_irritation | brazil·oecd | ☐ | | |
| 3 | oecd-tg431-rhe-corrosion | skin_corrosion | brazil·oecd | ☐ | | |
| 4 | oecd-tg430-ter-corrosion | skin_corrosion | brazil·oecd | ☐ | | |
| 5 | oecd-tg435-membrane-barrier | skin_corrosion | brazil·oecd | ☐ | | |
| 6 | oecd-tg437-bcop | ocular_irritation | brazil·oecd | ☐ | | |
| 7 | oecd-tg438-ice | ocular_irritation | brazil·oecd | ☐ | | |
| 8 | oecd-tg492-rce | ocular_irritation | oecd only | ☐ | | |
| 9 | oecd-tg460-fluorescein-leakage | ocular_irritation | brazil·oecd | ☐ | | |
| 10 | oecd-tg442c-dpra | skin_sensitisation | oecd only | ☐ | | |
| 11 | oecd-tg442d-keratinosens | skin_sensitisation | oecd only | ☐ | | |
| 12 | oecd-tg442e-hclat | skin_sensitisation | oecd only | ☐ | | |
| 13 | oecd-tg429-llna | skin_sensitisation | brazil·oecd | ☐ | | |
| 14 | oecd-tg442a-llna-da | skin_sensitisation | brazil·oecd | ☐ | | |
| 15 | oecd-tg442b-llna-brdu | skin_sensitisation | brazil·oecd | ☐ | | |
| 16 | oecd-tg432-3t3nru | phototoxicity | brazil·oecd | ☐ | | |
| 17 | oecd-tg428-skin-absorption-vitro | skin_absorption | brazil·oecd | ☐ | | |
| 18 | oecd-tg471-ames | genotoxicity | brazil·oecd | ☐ | | |
| 19 | oecd-tg476-hprt | genotoxicity | brazil·oecd | ☐ | | |
| 20 | oecd-tg487-micronucleus | genotoxicity | brazil·oecd | ☐ | | |
| 21 | mat-monocyte-activation | pyrogenicity | brazil⚠️·(no oecd TG) | ☐ | | |
| 22 | niceatm-cytotox-basal-barranco | acute_toxicity | brazil·oecd·us | ☐ | | |
| 23 | oecd-tg420-fixed-dose | acute_toxicity | brazil·oecd | ☐ | | |
| 24 | oecd-tg423-atc | acute_toxicity | brazil·oecd | ☐ | | |
| 25 | oecd-tg425-udp | acute_toxicity | brazil·oecd | ☐ | | |

---

## Campos globais (fazer antes de revisar métodos individuais)

### 1. NCIt — mapear endpoint_category → ID

Acessar https://ncit.nci.nih.gov/ e buscar cada endpoint. Após confirmar:
```sql
UPDATE methods SET ncit_id = '<ID>' WHERE endpoint_category = '<endpoint>';
```

| endpoint_category | NCIt ID | NCIt preferred label | ☐/☑ |
|---|---|---|---|
| acute_toxicity | [VERIFY] | | ☐ |
| skin_irritation | [VERIFY] | | ☐ |
| skin_corrosion | [VERIFY] | | ☐ |
| ocular_irritation | [VERIFY] | | ☐ |
| skin_sensitisation | [VERIFY] | | ☐ |
| phototoxicity | [VERIFY] | | ☐ |
| genotoxicity | [VERIFY] | | ☐ |
| pyrogenicity | [VERIFY] | | ☐ |
| skin_absorption | [VERIFY] | | ☐ |

### 2. source_db — confirmar por método

Os textos de `description_en` e `description_pt` foram escritos a partir de documentos OECD TG diretamente (`OECD_TG`) ou adaptados de entradas ECVAM DB-ALM (`ECVAM_DBALM`)? Se diferente por método, listar exceções aqui e executar UPDATE individual.

- ☐ Confirmado: todos os 23 métodos OECD usam `source_db = 'OECD_TG'`
- ☐ Exceções (listar slugs + source_db correto):

### 3. study_domain — confirmar fallback `general`

Todos os 25 métodos têm `study_domain = 'general'`. Confirmar se algum deveria ser `pharma`, `cosmetics` ou `chemical_safety` dado uso regulatório típico. (A maioria dos TGs OECD é genuinamente `general`.)

- ☐ Confirmado sem alterações
- ☐ Exceções (listar slugs + study_domain correto):

### 4. Contextos EU — [VERIFY para todos os métodos]

Os contextos `eu` não foram seeded por falta de referência específica confirmada. Após verificar contra EU Cosmetics Regulation 1223/2009 (para métodos relevantes para cosméticos) e REACH Annex (para químicos industriais), inserir:

```sql
INSERT INTO method_validation_contexts
    (method_id, study_domain, jurisdiction, validation_status, regulatory_body, regulatory_ref, regulatory_url)
VALUES
    ((SELECT id FROM methods WHERE slug='<slug>'),
     'general', 'eu', 'validated', 'ECHA', '<Reg ref>', '<URL>');
```

Métodos com maior probabilidade de contexto EU validado:
- TG 432 (3T3 NRU): EU Cosmetics Reg 1223/2009 Annex — fototoxicidade obrigatória para cosméticos
- TG 439 (EpiDerm, EpiSkin): EU Cosmetics Reg — irritação cutânea obrigatória
- TG 437/438/460: EU Cosmetics Reg — irritação ocular
- TG 429/442C/D/E: EU Cosmetics Reg + REACH — sensibilização

### 5. category_3r — confirmar casos ambíguos (ADR-021)

| Slug | Valor atual | Questão |
|---|---|---|
| oecd-tg429-llna | `["replacement"]` | Substitui cobaia (replacement) mas ainda usa camundongo. CEUAs brasileiras classificam como replacement ou reduction/refinement? |
| oecd-tg442a-llna-da | `["refinement"]` | Refinamento do TG 429 (sem radioatividade). Também é replacement em relação ao GPMT? |
| oecd-tg442b-llna-brdu | `["refinement"]` | Mesma questão do TG 442A |

Para alterar:
```sql
UPDATE methods SET category_3r = '["reduction","refinement"]'::jsonb WHERE slug = '<slug>';
```

### 6. Keywords — complementar com terminologia CEUA

A seção de keywords é um conjunto representativo. Adicionar termos que você usa em comunicações com CEUAs e pesquisadores brasileiros.

---

## Revisão por método

> Para cada método: confirmar campos do método + preencher contextos de validação faltantes.
> Os contextos `brazil` e `oecd` já estão seeded onde confirmados; indicar se precisam de correção.
> Adicionar `eu`, `us`, e qualquer contexto por `study_domain` específico que se aplicar.

---

### Template de contexto para INSERT

```sql
INSERT INTO method_validation_contexts
    (method_id, study_domain, jurisdiction, validation_status,
     regulatory_body, regulatory_ref, regulatory_url, notes)
VALUES
    ((SELECT id FROM methods WHERE slug='<slug>'),
     '<study_domain>', '<jurisdiction>', '<validation_status>',
     '<regulatory_body>', '<regulatory_ref>', '<url>', '<notes>');
```

---

### 1–2. oecd-tg439-epiderm / oecd-tg439-episkin

**Campos:**
- ☐ `name_pt` adequado para CEUA?
- ☐ `description_pt` clara para pesquisador sem familiaridade?
- ☐ `source_db` confirmado (ver campo global)
- ☐ `text_for_embedding` adequado?

**Contextos seeded:** brazil (CONCEA, RN 18/2014) · oecd (TG 439)

**Contextos a verificar:**

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |
| general | eu | validated | ECHA | REACH Reg 1907/2006 | ☐ |
| general | us | accepted | ICCVAM | [VERIFY] | ☐ |

**Notas:**

---

### 3. oecd-tg431-rhe-corrosion

**Campos:**
- ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 431)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| general | eu | validated | ECHA | REACH Annex VIII | ☐ |
| general | us | accepted | ICCVAM | [VERIFY] | ☐ |

**Notas:**

---

### 4. oecd-tg430-ter-corrosion

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 430)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| general | eu | validated | ECHA | REACH Annex VIII | ☐ |

**Notas:**

---

### 5. oecd-tg435-membrane-barrier

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`
- ☐ Nota de aplicabilidade (pH < 2 ou > 11,5) está clara para o usuário no S3?

**Contextos seeded:** brazil · oecd (TG 435)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| chemical_safety | eu | validated | ECHA | REACH Annex VIII | ☐ |

**Notas:**

---

### 6. oecd-tg437-bcop

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 437)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |
| general | eu | validated | ECHA | REACH Annex VIII | ☐ |
| general | us | accepted | ICCVAM | [VERIFY] | ☐ |

**Notas:**

---

### 7. oecd-tg438-ice

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 438)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |
| general | eu | validated | ECHA | REACH Annex VIII | ☐ |

**Notas:**

---

### 8. oecd-tg492-rce ⚠️ sem contexto brazil

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** oecd only (TG 492, publicado 2019, pós-RN 18/2014)

- ☐ **Verificar se CONCEA emitiu RN posterior adotando TG 492.** Se sim, inserir contexto brazil.

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| general | brazil | validated | CONCEA | [RN posterior — VERIFY] | ☐ |
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |

**Notas:**

---

### 9. oecd-tg460-fluorescein-leakage

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 460)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |

**Notas:**

---

### 10–12. oecd-tg442c-dpra / oecd-tg442d-keratinosens / oecd-tg442e-hclat ⚠️ sem brazil

**Campos (cada um):** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** oecd only (TG 442C/D/E publicados 2015–2017, pós-RN 18)

- ☐ **Verificar se CONCEA emitiu RN adotando TG 442C/D/E.** Se sim, inserir contextos brazil.

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| general | brazil | validated | CONCEA | [RN posterior — VERIFY] | ☐ |
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |
| chemical_safety | eu | validated | ECHA | REACH Annex VIII | ☐ |

**Notas:**

---

### 13. oecd-tg429-llna ⚠️ category_3r a confirmar

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`
- ☐ **`category_3r`**: atualmente `["replacement"]`. CEUAs brasileiras tratam LLNA como replacement do GPMT/Buehler (cobaia) ou como reduction/refinement (ainda usa camundongo)? Confirmar e atualizar se necessário.

**Contextos seeded:** brazil · oecd (TG 429)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |
| chemical_safety | eu | validated | ECHA | REACH Annex VIII | ☐ |

**Notas:**

---

### 14–15. oecd-tg442a-llna-da / oecd-tg442b-llna-brdu ⚠️ category_3r a confirmar

**Campos (cada):** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`
- ☐ **`category_3r`**: atualmente `["refinement"]`. Também é replacement em relação ao GPMT? Confirmar.

**Contextos seeded:** brazil · oecd (TG 442A / TG 442B)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 | ☐ |

**Notas:**

---

### 16. oecd-tg432-3t3nru

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 432)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| cosmetics | eu | validated | ECHA/JRC | EU Cosmetics Reg 1223/2009 Annex | ☐ |
| pharma | eu | accepted | EMA | [VERIFY guideline ref] | ☐ |

**Notas:**

---

### 17. oecd-tg428-skin-absorption-vitro

**Campos:** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 428)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| chemical_safety | eu | validated | ECHA | REACH Annex VIII | ☐ |
| pharma | eu | accepted | EMA | [VERIFY] | ☐ |

**Notas:**

---

### 18–20. oecd-tg471-ames / oecd-tg476-hprt / oecd-tg487-micronucleus

**Campos (cada):** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`

**Contextos seeded:** brazil · oecd (TG 471 / TG 476 / TG 487)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| pharma | eu | validated | EMA | ICH S2(R1) | ☐ |
| pharma | us | validated | FDA | ICH S2(R1) | ☐ |
| chemical_safety | eu | validated | ECHA | REACH Annex VII | ☐ |
| chemical_safety | us | validated | EPA | OCSPP 870.5100 / 870.5300 | ☐ |

**Notas:**

---

### 21. mat-monocyte-activation ⚠️ múltiplos [VERIFY]

**Campos:**
- ☐ `name_pt`
- ☐ `description_pt`
- ☐ `source_db` — confirmar: `FARMACOPEIA_BR` ou outra fonte primária?
- ☐ `oecd_tg_ref` — atualmente NULL. MAT não tem TG OECD standalone; verificar se GD 129 ou EP 2.6.30 é a referência adequada
- ☐ `text_for_embedding`

**Contextos seeded:** brazil ⚠️ (ANVISA como regulatory_body — [VERIFY])

- ☐ **Confirmar**: Farmacopeia Brasileira capítulo exato que descreve MAT + regulatory_body correto (ANVISA ou CONCEA)
- ☐ Após confirmação, atualizar o contexto brazil:
  ```sql
  UPDATE method_validation_contexts
  SET regulatory_body = '<body>', regulatory_ref = '<ref>', notes = NULL
  WHERE method_id = (SELECT id FROM methods WHERE slug = 'mat-monocyte-activation')
    AND jurisdiction = 'brazil';
  ```

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| pharma | eu | validated | EDQM | Ph. Eur. 2.6.30 | ☐ |
| pharma | us | accepted | FDA | [VERIFY] | ☐ |

**Notas:**

---

### 22. niceatm-cytotox-basal-barranco ⚠️ jurisdição brazil a confirmar

**Campos:**
- ☐ `name_pt`
- ☐ `description_pt`
- ☐ `source_db` — `NICEATM`; confirmar referência primária (Barranco et al. — qual publicação?)
- ☐ `text_for_embedding`

**Contextos seeded:** brazil (CONCEA, via GD 129 em RN 18 VI-d) · oecd (GD 129) · us (ICCVAM)

- ☐ **Confirmar** referência cruzada: GD 129 → RN 18 Art. 2 VI-d. Se confirmada, atualizar `regulatory_ref` do contexto brazil.
- ☐ Adicionar `primary_lit_url` para publicação Barranco et al.:
  ```sql
  UPDATE method_validation_contexts
  SET regulatory_ref = 'RN 18/2014 Art. 2 VI-d (via OECD GD 129)'
  WHERE method_id = (SELECT id FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco')
    AND jurisdiction = 'brazil';
  ```

**Notas:**

---

### 23–25. oecd-tg420 / oecd-tg423 / oecd-tg425 ⚠️ category_3r a confirmar

**Campos (cada):** ☐ `name_pt` · ☐ `description_pt` · ☐ `source_db` · ☐ `text_for_embedding`
- ☐ **`category_3r`**: atualmente `["reduction","refinement"]`. Confirmar se CEUAs brasileiras reconhecem essa dupla classificação, ou se preferem um único valor.

**Contextos seeded:** brazil · oecd (TG 420 / TG 423 / TG 425)

| study_domain | jurisdiction | validation_status | regulatory_body | regulatory_ref | ☐/☑ |
|---|---|---|---|---|---|
| chemical_safety | eu | validated | ECHA | REACH Annex B.1 tris | ☐ |
| pharma | eu | accepted | EMA | [VERIFY] | ☐ |
| general | us | validated | EPA | OCSPP 870.1100 | ☐ |

**Notas:**

---

## Questões para discussão com Leo

1. **Tempo por entrada**: registrar quanto tempo levou para revisar um método completo (campos + contextos). Este dado é necessário para fechar H5 (tractability).

2. **Contextos por study_domain específico**: para os métodos que têm usos regulatórios distintos (ex: genotoxicidade é obrigatória para pharma e chemical_safety mas com referências diferentes — ICH S2 vs. REACH), vale criar contextos separados por study_domain agora ou no Phase 3?

3. **MAT sem TG OECD**: se a Farmacopeia Brasileira não tiver capítulo MAT específico, reconsiderar `source_db` e criar contexto a partir da Ph. Eur. 2.6.30 com `jurisdiction = 'eu'` como contexto primário.

---

*Criado em M3. Atualizado com study_domain (ADR-020), category_3r JSONB (ADR-021), method_validation_contexts (ADR-022).*
