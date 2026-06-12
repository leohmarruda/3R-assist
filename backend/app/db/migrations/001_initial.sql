-- =============================================================================
-- 3R Assist — Migration 001: Initial schema (PostgreSQL)
-- Supersedes: SQLite methods_schema.sql + seed_methods.sql +
--             patch_rn18.sql + patch_routes.sql
-- Target: Neon / Vercel Postgres (PostgreSQL 15+)
-- Assumes: empty database, no prior tables
--
-- ADR-013: PostgreSQL replaces SQLite/Turso (supersedes ADR-004)
-- Note on pgvector: embedding_json is JSONB for MVP (25 methods, Python-side
-- cosine similarity). When corpus exceeds ~200 methods, migrate embedding_json
-- to vector(384) and enable the pgvector extension for SQL-level ANN search.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE methods (
    id                  SERIAL          PRIMARY KEY,
    slug                TEXT            NOT NULL UNIQUE,
    name_en             TEXT            NOT NULL,
    name_pt             TEXT            NOT NULL,
    description_en      TEXT            NOT NULL,
    description_pt      TEXT            NOT NULL,
    -- text_for_embedding: exact string used at embed time; stored to prevent
    -- silent drift when descriptions are edited without re-embedding
    text_for_embedding  TEXT            NOT NULL,
    category_3r         TEXT            NOT NULL
                            CHECK (category_3r IN ('replacement','reduction','refinement')),
    endpoint_category   TEXT            NOT NULL,
    application_area    TEXT            NOT NULL
                            CHECK (application_area IN ('pharma','cosmetics','chemical_safety','general')),
    oecd_tg_ref         TEXT,
    source_db           TEXT            NOT NULL,
    validation_status   TEXT            NOT NULL
                            CHECK (validation_status IN ('validated','accepted','emerging')),
    jurisdiction        TEXT            NOT NULL
                            CHECK (jurisdiction IN ('brazil','international','both')),
    jurisdiction_notes  TEXT,
    primary_lit_url     TEXT,
    regulatory_url      TEXT,
    -- routes_applicable: JSON array of route strings from parameter_model.md §3.2
    -- NULL = method is route-agnostic (in vitro genotoxicity, MAT, etc.)
    -- RetrievalService rule: include if NULL OR any protocol route is in this array
    routes_applicable   JSONB,
    -- embedding_json: JSONB array of 384 floats (all-MiniLM-L6-v2)
    -- NULL until embed_methods.py runs for this method (active must be TRUE first)
    embedding_json      JSONB,
    active              BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE method_keywords (
    id          SERIAL      PRIMARY KEY,
    method_id   INTEGER     NOT NULL REFERENCES methods(id) ON DELETE CASCADE,
    keyword     TEXT        NOT NULL,
    language    TEXT        NOT NULL CHECK (language IN ('en','pt'))
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX idx_methods_endpoint     ON methods (endpoint_category);
CREATE INDEX idx_methods_3r           ON methods (category_3r);
CREATE INDEX idx_methods_jurisdiction ON methods (jurisdiction);
CREATE INDEX idx_methods_active       ON methods (active);
CREATE INDEX idx_keywords_method      ON method_keywords (method_id);
CREATE INDEX idx_keywords_keyword     ON method_keywords (keyword, language);

-- ---------------------------------------------------------------------------
-- TRIGGER: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER methods_updated_at
    BEFORE UPDATE ON methods
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ===========================================================================
-- DATA: 25 methods (all corrections from patch_rn18 + patch_routes applied)
-- Jurisdiction logic:
--   'both'          = OECD TG present → RN 37/2018 equivalence, OR explicit
--                     recognition in a CONCEA RN (documented in notes)
--   'international' = validated OECD/ECVAM but NOT yet confirmed in any CONCEA RN
-- All entries: active = FALSE pending Karynn review (see karynn_review_checklist.md)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- ENDPOINT: skin_irritation
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg439-epiderm',
    'EpiDerm™ Skin Irritation Test (EpiDerm-SIT)',
    'Teste de Irritação Cutânea EpiDerm™ (EpiDerm-SIT)',
    'Reconstructed human epidermis model (MatTek EpiDerm™) used to assess skin irritation potential. Tissue viability measured by MTT assay after 35 minutes exposure. Classified under OECD TG 439.',
    'Modelo de epiderme humana reconstituída (MatTek EpiDerm™) para avaliação do potencial de irritação cutânea. Viabilidade tecidual medida por ensaio MTT após 35 minutos de exposição. Classificado sob OECD TG 439.',
    'EpiDerm skin irritation reconstructed human epidermis MTT assay OECD 439 in vitro dermal irritation alternative animal test',
    'replacement', 'skin_irritation', 'chemical_safety',
    'TG 439', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, I-d. Jurisdiction ''both'' via RN 37/2018 (OECD TG equivalence).',
    '[VERIFY: primary validation paper DOI]',
    'https://www.oecd.org/en/publications/test-no-439-in-vitro-skin-irritation_9789264071100-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg439-episkin',
    'EPISKIN™ Skin Irritation Test',
    'Teste de Irritação Cutânea EPISKIN™',
    'Reconstructed human epidermis model (L''Oréal EPISKIN™) for skin irritation assessment. Part of the OECD TG 439 test guideline family alongside EpiDerm-SIT.',
    'Modelo de epiderme humana reconstituída (EPISKIN™, L''Oréal) para avaliação de irritação cutânea. Integra a família de diretrizes OECD TG 439 ao lado do EpiDerm-SIT.',
    'EPISKIN skin irritation reconstructed human epidermis in vitro OECD 439 alternative dermal irritation',
    'replacement', 'skin_irritation', 'cosmetics',
    'TG 439', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, I-d. Jurisdiction ''both'' via RN 37/2018.',
    '[VERIFY: primary validation paper DOI]',
    'https://www.oecd.org/en/publications/test-no-439-in-vitro-skin-irritation_9789264071100-en.html',
    '["dermal"]'
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: skin_corrosion
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg431-rhe-corrosion',
    'Reconstructed Human Epidermis (RhE) Skin Corrosion Test',
    'Teste de Corrosão Cutânea em Epiderme Humana Reconstituída (EHR)',
    'Uses reconstructed human epidermis (RhE) models to assess skin corrosion. Viability measured after 3 and 60 minutes exposure. Models include EpiDerm-SCT and EPISKIN-SCT.',
    'Utiliza modelos de epiderme humana reconstituída (EHR) para avaliar corrosão cutânea. Viabilidade medida após 3 e 60 minutos de exposição. Inclui modelos EpiDerm-SCT e EPISKIN-SCT.',
    'reconstructed human epidermis skin corrosion RhE EpiDerm EPISKIN in vitro OECD 431 alternative',
    'replacement', 'skin_corrosion', 'chemical_safety',
    'TG 431', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, I-b.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-431-in-vitro-skin-corrosion_9789264264618-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg430-ter-corrosion',
    'Transcutaneous Electrical Resistance (TER) Test',
    'Teste de Resistência Elétrica Transcutânea (TER)',
    'Measures electrical resistance across rat skin discs to identify corrosive chemicals. A positive result (low resistance) indicates corrosive potential. Uses excised rat skin — Reduction category as it reduces live animal use compared to in vivo Draize test.',
    'Mede a resistência elétrica através de discos de pele de rato para identificar substâncias corrosivas. Resultado positivo (baixa resistência) indica potencial corrosivo. Usa pele de rato excisada — categoria Redução por reduzir uso de animais vivos em comparação ao teste de Draize in vivo.',
    'transcutaneous electrical resistance TER rat skin corrosion ex vivo OECD 430 alternative',
    'reduction', 'skin_corrosion', 'chemical_safety',
    'TG 430', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, I-a. Uses excised rat skin — not full replacement. Appropriate when RhE models are unavailable.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-430-in-vitro-skin-corrosion_9789264264595-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg435-membrane-barrier',
    'In Vitro Membrane Barrier Test for Skin Corrosion',
    'Teste de Barreira de Membrana in vitro para Corrosão Dérmica',
    'Uses a synthetic membrane coated with a protein matrix to detect skin corrosive potential by color change indicator or pH measurement after chemical exposure. Does not use biological tissue.',
    'Utiliza membrana sintética revestida com matriz proteica para detectar potencial de corrosão cutânea por mudança de cor ou medição de pH após exposição química. Não usa tecido biológico.',
    'membrane barrier in vitro skin corrosion synthetic membrane pH indicator OECD 435 alternative animal test',
    'replacement', 'skin_corrosion', 'chemical_safety',
    'TG 435', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, I-c.',
    '[VERIFY: primary validation DOI]',
    'https://www.oecd.org/en/publications/test-no-435-in-vitro-membrane-barrier-test-method-for-skin-corrosion_9789264071148-en.html',
    '["dermal"]'
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: ocular_irritation
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg437-bcop',
    'Bovine Corneal Opacity and Permeability (BCOP) Assay',
    'Ensaio de Opacidade e Permeabilidade da Córnea Bovina (BCOP)',
    'Isolated bovine corneas from slaughterhouse by-products are used to measure corneal opacity and permeability as indicators of eye irritation. Identifies severe irritants and non-irritants.',
    'Córneas bovinas isoladas de subprodutos de abatedouro são usadas para medir opacidade e permeabilidade corneana como indicadores de irritação ocular. Identifica irritantes graves e não irritantes.',
    'bovine corneal opacity permeability BCOP ocular irritation eye irritation in vitro OECD 437 alternative Draize',
    'replacement', 'ocular_irritation', 'chemical_safety',
    'TG 437', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, II-a.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-437-bovine-corneal-opacity-and-permeability-bcop-test-method_9789264071155-en.html',
    '["ocular"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg438-ice',
    'Isolated Chicken Eye (ICE) Test',
    'Teste do Olho Isolado de Galinha (ICE)',
    'Uses eyes from slaughterhouse chickens to assess ocular irritation by measuring corneal swelling, opacity, and fluorescein retention. Covers mild-to-severe irritants. Source material from food industry by-products.',
    'Utiliza olhos de galinhas de abatedouro para avaliar irritação ocular medindo inchaço corneano, opacidade e retenção de fluoresceína. Cobre irritantes de leve a grave. Material de subprodutos da indústria alimentícia.',
    'isolated chicken eye ICE test ocular irritation corneal swelling opacity fluorescein slaughterhouse OECD 438 alternative Draize',
    'replacement', 'ocular_irritation', 'chemical_safety',
    'TG 438', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, II-b.',
    '[VERIFY: primary validation DOI]',
    'https://www.oecd.org/en/publications/test-no-438-isolated-chicken-eye-ice-test-method_9789264071131-en.html',
    '["ocular"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg460-fluorescein-leakage',
    'Fluorescein Leakage (FL) Test',
    'Teste de Permeação de Fluoresceína (FL)',
    'Measures disruption of tight junctions in Madin-Darby Canine Kidney (MDCK) cell monolayers by quantifying fluorescein leakage. Identifies ocular irritants that disrupt epithelial barrier function.',
    'Mede a ruptura de junções oclusivas em monocamadas de células MDCK pela quantificação da permeação de fluoresceína. Identifica irritantes oculares que rompem a barreira epitelial.',
    'fluorescein leakage MDCK tight junctions ocular irritation epithelial barrier in vitro OECD 460 alternative eye',
    'replacement', 'ocular_irritation', 'cosmetics',
    'TG 460', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, II-c.',
    '[VERIFY: primary validation DOI]',
    'https://www.oecd.org/en/publications/test-no-460-fluorescein-leakage-test-method-for-identifying-ocular-irritants_9789264185951-en.html',
    '["ocular"]'
);

-- jurisdiction = 'international': TG 492 published 2015, postdates RN 18 (2014)
-- Verify against subsequent CONCEA RNs before changing to 'both'
INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg492-rce',
    'Reconstructed Cornea-like Epithelium (RCE) Eye Irritation Test',
    'Teste de Irritação Ocular em Epitélio Semelhante à Córnea Reconstituído (RCE)',
    'Reconstructed cornea-like epithelium models (EpiOcular™, SkinEthic™ HCE) assess eye irritation potential via cell viability after exposure. Classified under OECD TG 492.',
    'Modelos de epitélio semelhante à córnea reconstituído (EpiOcular™, SkinEthic™ HCE) avaliam potencial de irritação ocular por meio de viabilidade celular após exposição. Classificado sob OECD TG 492.',
    'reconstructed cornea epithelium EpiOcular HCE eye irritation ocular in vitro OECD 492 alternative',
    'replacement', 'ocular_irritation', 'cosmetics',
    'TG 492', 'ECVAM_DBALM', 'validated', 'international',
    'TG 492 published 2015, postdates CONCEA RN 18/2014. Verify against subsequent CONCEA RNs before setting jurisdiction = ''both''.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-492-reconstructed-human-cornea-like-epithelium-rhe-test-method_9789264242951-en.html',
    '["ocular"]'
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: skin_sensitisation
-- ---------------------------------------------------------------------------

-- jurisdiction = 'international': RN 18 covers TG 429/442A/442B only
-- TG 442C/D/E need confirmation in a subsequent CONCEA RN
INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg442c-dpra',
    'Direct Peptide Reactivity Assay (DPRA)',
    'Ensaio de Reatividade Direta com Peptídeos (DPRA)',
    'Cell-free assay measuring covalent binding of chemicals to synthetic peptides (cysteine and lysine). Addresses the first key event in the AOP for skin sensitisation. Used in defined approach combinations.',
    'Ensaio sem células que mede a ligação covalente de substâncias químicas a peptídeos sintéticos (cisteína e lisina). Aborda o primeiro evento-chave no AOP para sensibilização cutânea. Usado em combinações de abordagem definida.',
    'DPRA direct peptide reactivity skin sensitisation covalent binding cysteine lysine AOP in chemico OECD 442C alternative',
    'replacement', 'skin_sensitisation', 'chemical_safety',
    'TG 442C', 'NICEATM', 'validated', 'international',
    'CONCEA RN 18/2014 covers only TG 429/442A/442B for skin sensitisation. TG 442C not confirmed in available CONCEA RNs. Verify remaining RNs.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-442c-in-chemico-skin-sensitisation_9789264229709-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg442d-keratinosens',
    'KeratinoSens™ Assay',
    'Ensaio KeratinoSens™',
    'Luciferase reporter gene assay in HaCaT keratinocytes measuring ARE activation. Addresses the second key event (keratinocyte activation) in the AOP for skin sensitisation.',
    'Ensaio com gene repórter de luciferase em queratinócitos HaCaT medindo ativação de ARE. Aborda o segundo evento-chave (ativação de queratinócitos) no AOP para sensibilização cutânea.',
    'KeratinoSens keratinocyte ARE activation luciferase skin sensitisation in vitro OECD 442D alternative',
    'replacement', 'skin_sensitisation', 'cosmetics',
    'TG 442D', 'ECVAM_DBALM', 'validated', 'international',
    'CONCEA RN 18/2014 covers only TG 429/442A/442B. TG 442D not confirmed in available CONCEA RNs.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-442d-in-vitro-skin-sensitisation_9789264229822-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg442e-hclat',
    'Human Cell Line Activation Test (h-CLAT)',
    'Teste de Ativação de Linhagem Celular Humana (h-CLAT)',
    'Flow cytometry assay measuring upregulation of CD86 and CD54 on THP-1 monocytic cells. Addresses the third key event (dendritic cell activation) in the AOP for skin sensitisation.',
    'Ensaio de citometria de fluxo medindo regulação positiva de CD86 e CD54 em células monocíticas THP-1. Aborda o terceiro evento-chave (ativação de células dendríticas) no AOP para sensibilização cutânea.',
    'h-CLAT THP-1 CD86 CD54 dendritic cell activation skin sensitisation flow cytometry OECD 442E alternative',
    'replacement', 'skin_sensitisation', 'chemical_safety',
    'TG 442E', 'NICEATM', 'validated', 'international',
    'CONCEA RN 18/2014 covers only TG 429/442A/442B. TG 442E not confirmed in available CONCEA RNs.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-442e-in-vitro-skin-sensitisation_9789264264359-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg429-llna',
    'Local Lymph Node Assay (LLNA)',
    'Ensaio do Linfonodo Local (LLNA)',
    'Murine assay measuring lymphocyte proliferation in auricular lymph nodes after topical application of test substance. Reduces animal numbers and severity compared to Guinea Pig Maximization Test and Buehler test.',
    'Ensaio murino que mede a proliferação de linfócitos nos linfonodos auriculares após aplicação tópica da substância teste. Reduz número de animais e gravidade em comparação ao Teste de Maximização em Cobaia e ao teste de Buehler.',
    'LLNA local lymph node assay murine skin sensitisation lymphocyte proliferation guinea pig replacement OECD 429 alternative',
    'reduction', 'skin_sensitisation', 'chemical_safety',
    'TG 429', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, V-a. Uses mice — category = reduction, not replacement.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-429-skin-sensitisation_9789264071100-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg442a-llna-da',
    'LLNA: DA — Non-Radioactive Local Lymph Node Assay (ATP)',
    'LLNA:DA — Ensaio do Linfonodo Local Não Radioativo (ATP)',
    'Non-radioactive variant of the LLNA using ATP bioluminescence to measure lymphocyte proliferation instead of radiolabeled thymidine. Same murine model as TG 429, eliminates radioactive waste handling.',
    'Variante não radioativa do LLNA que usa bioluminescência de ATP para medir proliferação de linfócitos em vez de timidina radioativa. Mesmo modelo murino do TG 429, elimina o manejo de resíduos radioativos.',
    'LLNA DA non-radioactive local lymph node assay ATP bioluminescence skin sensitisation murine OECD 442A alternative',
    'reduction', 'skin_sensitisation', 'chemical_safety',
    'TG 442A', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, V-b. Non-radioactive variant of TG 429. Uses mice — category = reduction.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-442a-skin-sensitization-local-lymph-node-assay-da_9789264090972-en.html',
    '["dermal"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg442b-llna-brdu',
    'LLNA: BrdU-ELISA — Non-Radioactive Local Lymph Node Assay',
    'LLNA:BrdU-ELISA — Ensaio do Linfonodo Local Não Radioativo',
    'Non-radioactive variant of the LLNA using BrdU incorporation measured by ELISA to quantify lymphocyte proliferation. Same murine model, eliminates radioactive material.',
    'Variante não radioativa do LLNA usando incorporação de BrdU medida por ELISA para quantificar proliferação de linfócitos. Mesmo modelo murino, elimina material radioativo.',
    'LLNA BrdU ELISA non-radioactive local lymph node assay skin sensitisation murine OECD 442B alternative',
    'reduction', 'skin_sensitisation', 'chemical_safety',
    'TG 442B', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, V-b. Non-radioactive variant of TG 429. Uses mice — category = reduction.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-442b-skin-sensitization_9789264090996-en.html',
    '["dermal"]'
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: phototoxicity
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg432-3t3nru',
    '3T3 NRU Phototoxicity Test',
    'Teste de Fototoxicidade 3T3 NRU',
    'BALB/c 3T3 fibroblasts exposed to a substance in the presence or absence of a non-cytotoxic dose of simulated sunlight. Phototoxic potential assessed by neutral red uptake.',
    'Fibroblastos BALB/c 3T3 são expostos a uma substância na presença ou ausência de dose não citotóxica de luz solar simulada. Potencial fototóxico avaliado por captação de vermelho neutro.',
    '3T3 NRU phototoxicity fibroblast neutral red uptake simulated sunlight in vitro OECD 432 alternative photoirritation',
    'replacement', 'phototoxicity', 'cosmetics',
    'TG 432', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, III-a.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-432-in-vitro-3t3-nru-phototoxicity-test_9789264071162-en.html',
    '["dermal"]'
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: genotoxicity (routes_applicable = NULL — route-agnostic)
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg471-ames',
    'Bacterial Reverse Mutation Test (Ames Test)',
    'Teste de Mutação Reversa em Bactérias (Teste de Ames)',
    'Uses amino acid-requiring strains of Salmonella typhimurium and E. coli to detect point mutations. The standard first-tier genotoxicity assay. No animals involved.',
    'Utiliza cepas auxotróficas de Salmonella typhimurium e E. coli para detectar mutações pontuais. O ensaio de genotoxicidade padrão de primeira linha. Não envolve animais.',
    'Ames test bacterial reverse mutation Salmonella typhimurium E. coli genotoxicity mutagenicity in vitro OECD 471 alternative',
    'replacement', 'genotoxicity', 'general',
    'TG 471', 'ECVAM_DBALM', 'validated', 'both',
    'Jurisdiction ''both'' via RN 37/2018 (OECD TG equivalence). Verify recognition in subsequent CONCEA RNs.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-471-bacterial-reverse-mutation-test_9789264071087-en.html',
    NULL
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg476-hprt',
    'In Vitro Mammalian Cell Gene Mutation Test (HPRT/xprt)',
    'Teste de Mutação Gênica em Células Mamíferas In Vitro (HPRT/xprt)',
    'Detects gene mutations at the HPRT locus (or xprt transgene) in mammalian cells (V79, CHO, TK6, L5178Y). Second-tier genotoxicity assay for mammalian cell mutagenicity.',
    'Detecta mutações gênicas no locus HPRT (ou transgene xprt) em células mamíferas (V79, CHO, TK6, L5178Y). Ensaio de genotoxicidade de segunda linha para mutagenicidade em células mamíferas.',
    'HPRT xprt gene mutation mammalian cell CHO V79 L5178Y in vitro genotoxicity mutagenicity OECD 476 alternative',
    'replacement', 'genotoxicity', 'pharma',
    'TG 476', 'ECVAM_DBALM', 'validated', 'both',
    'Jurisdiction ''both'' via RN 37/2018. Verify in subsequent CONCEA RNs.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-476-in-vitro-mammalian-cell-gene-mutation-tests-using-the-hprt-and-xprt-genes_9789264264649-en.html',
    NULL
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg487-micronucleus',
    'In Vitro Mammalian Cell Micronucleus Test (MNvit)',
    'Teste de Micronúcleo em Células Mamíferas In Vitro (MNvit)',
    'Detects micronuclei in the cytoplasm of interphase cells, indicating chromosome breakage or spindle dysfunction. Covers both clastogenic and aneugenic activity. Uses CHO, V79, L5178Y or human lymphocytes.',
    'Detecta micronúcleos no citoplasma de células em interfase, indicando quebra cromossômica ou disfunção do fuso. Cobre atividade clastogênica e aneugênica. Usa CHO, V79, L5178Y ou linfócitos humanos.',
    'micronucleus test MNvit clastogenicity aneugenicity chromosome aberration in vitro mammalian cell OECD 487 genotoxicity alternative',
    'replacement', 'genotoxicity', 'general',
    'TG 487', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, VII-a.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-487-in-vitro-mammalian-cell-micronucleus-test_9789264264861-en.html',
    NULL
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: pyrogenicity (routes_applicable = NULL — detects contamination,
-- not tied to administration route of the tested substance)
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'mat-monocyte-activation',
    'Monocyte Activation Test (MAT)',
    'Teste de Ativação de Monócitos (MAT)',
    'Whole blood or PBMC-based assay detecting pyrogenic contamination by measuring pro-inflammatory cytokine release (IL-1β, IL-6, TNF-α). Detects both endotoxin and non-endotoxin pyrogens. Replaces the rabbit pyrogen test.',
    'Ensaio baseado em sangue total ou PBMC que detecta contaminação pirogênica pela medição da liberação de citocinas pró-inflamatórias (IL-1β, IL-6, TNF-α). Detecta pirógenos endotóxicos e não endotóxicos. Substitui o teste de pirógeno em coelhos.',
    'monocyte activation test MAT pyrogen cytokine IL-1beta IL-6 TNF blood PBMC rabbit replacement pyrogenicity pharmaceutical',
    'replacement', 'pyrogenicity', 'pharma',
    NULL, 'FARMACOPEIA_BR', 'validated', 'both',
    'Recognized in Farmacopeia Brasileira (5th ed.) and Ph. Eur. 2.6.30. No OECD TG; jurisdiction ''both'' sourced from Farmacopeia BR directly. Confirm exact chapter reference before activating.',
    '[VERIFY: Farmacopeia Brasileira 5th ed. chapter reference]',
    'https://www.edqm.eu/en/news/european-pharmacopoeia-monocyte-activation-test',
    NULL
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: skin_absorption
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg428-skin-absorption-vitro',
    'In Vitro Skin Absorption Test',
    'Teste de Absorção Cutânea In Vitro',
    'Measures the rate and extent of percutaneous absorption of substances through excised human or animal skin mounted in static or flow-through diffusion cells. Reduces in vivo dermal absorption studies.',
    'Mede a taxa e extensão da absorção percutânea de substâncias através de pele humana ou animal excisada montada em células de difusão estáticas ou de fluxo contínuo. Reduz estudos de absorção dérmica in vivo.',
    'skin absorption percutaneous in vitro diffusion cell excised skin dermis epidermis OECD 428 alternative dermal penetration',
    'reduction', 'skin_absorption', 'chemical_safety',
    'TG 428', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, IV-a. Uses excised skin — category = reduction, not replacement.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-428-skin-absorption-in-vitro-method_9789264071087-en.html',
    '["dermal"]'
);

-- ---------------------------------------------------------------------------
-- ENDPOINT: acute_toxicity
-- GD 129: jurisdiction = 'both' per CONCEA RN 18/2014 Art. 2 VI-d ("OECD TG 129")
-- TG 420/423/425: in vivo refinement/reduction methods
-- ---------------------------------------------------------------------------

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'niceatm-cytotox-basal-barranco',
    'Basal Cytotoxicity for Acute Toxicity Starting Dose Estimation',
    'Citotoxicidade Basal para Estimativa de Dose Inicial de Toxicidade Aguda',
    'Cell-based assay (3T3 or NHK NRU) measuring basal cytotoxicity to estimate a starting dose for in vivo acute oral toxicity studies, reducing the number of animals used. Based on OECD GD 129 (NICEATM-ECVAM validation). Does not replace the in vivo test — reduces animal numbers in dose-finding.',
    'Ensaio celular (3T3 ou NHK NRU) que mede citotoxicidade basal para estimar dose inicial em estudos de toxicidade aguda oral in vivo, reduzindo o número de animais. Baseado no OECD GD 129 (validação NICEATM-ECVAM). Não substitui o teste in vivo — reduz número de animais na busca de dose.',
    'basal cytotoxicity acute toxicity starting dose estimation neutral red uptake NRU 3T3 NHK NICEATM ECVAM in vitro reduction oral LD50 alternative GD 129',
    'reduction', 'acute_toxicity', 'general',
    'GD 129', 'NICEATM', 'accepted', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, VI-d (referred to as "OECD TG 129"). '
    'GD 129 is a Guidance Document, not a Test Guideline — CONCEA uses "TG 129" informally. '
    'Accepted for starting dose selection only; does not replace in vivo acute toxicity test.',
    'https://doi.org/10.1787/9789264268593-en',
    'https://www.oecd.org/en/publications/test-no-129-using-cytotoxicity-tests_9789264268593-en.html',
    '["oral"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg420-fixed-dose',
    'Acute Oral Toxicity — Fixed Dose Procedure (FDP)',
    'Toxicidade Aguda Oral — Procedimento de Doses Fixas (FDP)',
    'In vivo rodent test using a fixed set of doses (5, 50, 300, 2000 mg/kg) to classify substances without determining LD50. Uses fewer animals than classical LD50 test and focuses on observable toxicity signs rather than lethality.',
    'Teste in vivo em roedores usando um conjunto fixo de doses (5, 50, 300, 2000 mg/kg) para classificar substâncias sem determinar a DL50. Usa menos animais que o teste clássico de DL50 e foca em sinais de toxicidade observáveis em vez de letalidade.',
    'fixed dose procedure FDP acute oral toxicity in vivo rodent LD50 alternative OECD 420 refinement reduction animal welfare GHS classification',
    'refinement', 'acute_toxicity', 'general',
    'TG 420', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, VI-a. In vivo method — refinement/reduction vs. classical LD50.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-420-acute-oral-toxicity-fixed-dose-procedure_9789264070943-en.html',
    '["oral"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg423-atc',
    'Acute Oral Toxicity — Acute Toxic Class (ATC) Method',
    'Toxicidade Aguda Oral — Método da Classe Tóxica Aguda (CTA)',
    'Sequential in vivo rodent test using three animals per step to classify substances into GHS hazard categories without determining LD50. Reduces animal use by 40–70% compared to classical LD50.',
    'Teste in vivo sequencial em roedores usando três animais por etapa para classificar substâncias em categorias de perigo do GHS sem determinar a DL50. Reduz o uso de animais em 40–70% em comparação à DL50 clássica.',
    'acute toxic class ATC method oral toxicity GHS classification sequential in vivo rodent OECD 423 refinement reduction LD50 alternative',
    'refinement', 'acute_toxicity', 'general',
    'TG 423', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, VI-b. In vivo method — refinement/reduction vs. classical LD50.',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-423-acute-oral-toxicity-acute-toxic-class-method_9789264071001-en.html',
    '["oral"]'
);

INSERT INTO methods (slug, name_en, name_pt, description_en, description_pt,
    text_for_embedding, category_3r, endpoint_category, application_area,
    oecd_tg_ref, source_db, validation_status, jurisdiction,
    jurisdiction_notes, primary_lit_url, regulatory_url, routes_applicable)
VALUES (
    'oecd-tg425-udp',
    'Acute Oral Toxicity — Up-and-Down Procedure (UDP)',
    'Toxicidade Aguda Oral — Procedimento "Up and Down" (UDP)',
    'Sequential in vivo rodent test adjusting doses based on the outcome of each animal tested. Uses 6–10 animals on average to estimate LD50 and confidence intervals. Basis for GD 129 starting dose estimation.',
    'Teste in vivo sequencial em roedores que ajusta doses com base no resultado de cada animal testado. Usa em média 6–10 animais para estimar DL50 e intervalos de confiança. Base para a estimativa de dose inicial do GD 129.',
    'up-and-down procedure UDP acute oral toxicity LD50 sequential in vivo rodent OECD 425 refinement reduction animal welfare',
    'refinement', 'acute_toxicity', 'general',
    'TG 425', 'ECVAM_DBALM', 'validated', 'both',
    'Recognized via CONCEA RN 18/2014, Art. 2, VI-c. In vivo method. '
    'Frequently used with GD 129 (cytotoxicity starting dose estimation).',
    '[VERIFY]',
    'https://www.oecd.org/en/publications/test-no-425-acute-oral-toxicity-up-and-down-procedure_9789264071049-en.html',
    '["oral"]'
);


-- ===========================================================================
-- KEYWORDS
-- ===========================================================================

-- skin_irritation
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin irritation', 'en' FROM methods WHERE slug = 'oecd-tg439-epiderm';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'dermal irritation', 'en' FROM methods WHERE slug = 'oecd-tg439-epiderm';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg439-epiderm';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação dérmica', 'pt' FROM methods WHERE slug = 'oecd-tg439-epiderm';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'teste de Draize pele', 'pt' FROM methods WHERE slug = 'oecd-tg439-epiderm';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin irritation', 'en' FROM methods WHERE slug = 'oecd-tg439-episkin';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg439-episkin';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação dérmica', 'pt' FROM methods WHERE slug = 'oecd-tg439-episkin';

-- skin_corrosion
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin corrosion', 'en' FROM methods WHERE slug = 'oecd-tg431-rhe-corrosion';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'corrosão cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg431-rhe-corrosion';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'corrosão dérmica', 'pt' FROM methods WHERE slug = 'oecd-tg431-rhe-corrosion';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin corrosion', 'en' FROM methods WHERE slug = 'oecd-tg430-ter-corrosion';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'transcutaneous resistance', 'en' FROM methods WHERE slug = 'oecd-tg430-ter-corrosion';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'corrosão cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg430-ter-corrosion';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'resistência elétrica transcutânea', 'pt' FROM methods WHERE slug = 'oecd-tg430-ter-corrosion';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin corrosion', 'en' FROM methods WHERE slug = 'oecd-tg435-membrane-barrier';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'membrane barrier', 'en' FROM methods WHERE slug = 'oecd-tg435-membrane-barrier';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'corrosão cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg435-membrane-barrier';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'barreira de membrana', 'pt' FROM methods WHERE slug = 'oecd-tg435-membrane-barrier';

-- ocular_irritation
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'eye irritation', 'en' FROM methods WHERE slug = 'oecd-tg437-bcop';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'ocular irritation', 'en' FROM methods WHERE slug = 'oecd-tg437-bcop';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'Draize eye test', 'en' FROM methods WHERE slug = 'oecd-tg437-bcop';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação ocular', 'pt' FROM methods WHERE slug = 'oecd-tg437-bcop';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'teste de Draize olho', 'pt' FROM methods WHERE slug = 'oecd-tg437-bcop';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'eye irritation', 'en' FROM methods WHERE slug = 'oecd-tg438-ice';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'ocular irritation', 'en' FROM methods WHERE slug = 'oecd-tg438-ice';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação ocular', 'pt' FROM methods WHERE slug = 'oecd-tg438-ice';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'olho de galinha', 'pt' FROM methods WHERE slug = 'oecd-tg438-ice';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'eye irritation', 'en' FROM methods WHERE slug = 'oecd-tg460-fluorescein-leakage';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'ocular irritation', 'en' FROM methods WHERE slug = 'oecd-tg460-fluorescein-leakage';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação ocular', 'pt' FROM methods WHERE slug = 'oecd-tg460-fluorescein-leakage';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'permeação de fluoresceína', 'pt' FROM methods WHERE slug = 'oecd-tg460-fluorescein-leakage';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'eye irritation', 'en' FROM methods WHERE slug = 'oecd-tg492-rce';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'ocular irritation', 'en' FROM methods WHERE slug = 'oecd-tg492-rce';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'irritação ocular', 'pt' FROM methods WHERE slug = 'oecd-tg492-rce';

-- skin_sensitisation
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitisation', 'en' FROM methods WHERE slug = 'oecd-tg442c-dpra';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitization', 'en' FROM methods WHERE slug = 'oecd-tg442c-dpra';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'allergenicity', 'en' FROM methods WHERE slug = 'oecd-tg442c-dpra';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'sensibilização cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg442c-dpra';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'alergenicidade', 'pt' FROM methods WHERE slug = 'oecd-tg442c-dpra';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitisation', 'en' FROM methods WHERE slug = 'oecd-tg442d-keratinosens';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitization', 'en' FROM methods WHERE slug = 'oecd-tg442d-keratinosens';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'sensibilização cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg442d-keratinosens';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitisation', 'en' FROM methods WHERE slug = 'oecd-tg442e-hclat';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitization', 'en' FROM methods WHERE slug = 'oecd-tg442e-hclat';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'sensibilização cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg442e-hclat';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitisation', 'en' FROM methods WHERE slug = 'oecd-tg429-llna';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'LLNA', 'en' FROM methods WHERE slug = 'oecd-tg429-llna';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'local lymph node assay', 'en' FROM methods WHERE slug = 'oecd-tg429-llna';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'allergenicity', 'en' FROM methods WHERE slug = 'oecd-tg429-llna';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'sensibilização cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg429-llna';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'ensaio do linfonodo local', 'pt' FROM methods WHERE slug = 'oecd-tg429-llna';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'alergenicidade', 'pt' FROM methods WHERE slug = 'oecd-tg429-llna';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitisation', 'en' FROM methods WHERE slug = 'oecd-tg442a-llna-da';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'LLNA non-radioactive', 'en' FROM methods WHERE slug = 'oecd-tg442a-llna-da';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'sensibilização cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg442a-llna-da';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'linfonodo não radioativo', 'pt' FROM methods WHERE slug = 'oecd-tg442a-llna-da';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin sensitisation', 'en' FROM methods WHERE slug = 'oecd-tg442b-llna-brdu';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'LLNA BrdU', 'en' FROM methods WHERE slug = 'oecd-tg442b-llna-brdu';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'sensibilização cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg442b-llna-brdu';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'linfonodo não radioativo', 'pt' FROM methods WHERE slug = 'oecd-tg442b-llna-brdu';

-- phototoxicity
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'phototoxicity', 'en' FROM methods WHERE slug = 'oecd-tg432-3t3nru';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'photoirritation', 'en' FROM methods WHERE slug = 'oecd-tg432-3t3nru';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'fototoxicidade', 'pt' FROM methods WHERE slug = 'oecd-tg432-3t3nru';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'fotoirritação', 'pt' FROM methods WHERE slug = 'oecd-tg432-3t3nru';

-- genotoxicity
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'genotoxicity', 'en' FROM methods WHERE slug = 'oecd-tg471-ames';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'mutagenicity', 'en' FROM methods WHERE slug = 'oecd-tg471-ames';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'genotoxicidade', 'pt' FROM methods WHERE slug = 'oecd-tg471-ames';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'mutagenicidade', 'pt' FROM methods WHERE slug = 'oecd-tg471-ames';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'potencial mutagênico', 'pt' FROM methods WHERE slug = 'oecd-tg471-ames';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'genotoxicity', 'en' FROM methods WHERE slug = 'oecd-tg476-hprt';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'mutagenicity mammalian', 'en' FROM methods WHERE slug = 'oecd-tg476-hprt';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'genotoxicidade', 'pt' FROM methods WHERE slug = 'oecd-tg476-hprt';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'mutação gênica', 'pt' FROM methods WHERE slug = 'oecd-tg476-hprt';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'genotoxicity', 'en' FROM methods WHERE slug = 'oecd-tg487-micronucleus';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'clastogenicity', 'en' FROM methods WHERE slug = 'oecd-tg487-micronucleus';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'chromosome aberration', 'en' FROM methods WHERE slug = 'oecd-tg487-micronucleus';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'genotoxicidade', 'pt' FROM methods WHERE slug = 'oecd-tg487-micronucleus';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'aberração cromossômica', 'pt' FROM methods WHERE slug = 'oecd-tg487-micronucleus';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'micronúcleo', 'pt' FROM methods WHERE slug = 'oecd-tg487-micronucleus';

-- pyrogenicity
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'pyrogenicity', 'en' FROM methods WHERE slug = 'mat-monocyte-activation';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'pyrogen test', 'en' FROM methods WHERE slug = 'mat-monocyte-activation';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'endotoxin', 'en' FROM methods WHERE slug = 'mat-monocyte-activation';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'pirogenicidade', 'pt' FROM methods WHERE slug = 'mat-monocyte-activation';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'teste de pirógeno', 'pt' FROM methods WHERE slug = 'mat-monocyte-activation';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'pirogênio', 'pt' FROM methods WHERE slug = 'mat-monocyte-activation';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'endotoxina', 'pt' FROM methods WHERE slug = 'mat-monocyte-activation';

-- skin_absorption
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'skin absorption', 'en' FROM methods WHERE slug = 'oecd-tg428-skin-absorption-vitro';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'percutaneous absorption', 'en' FROM methods WHERE slug = 'oecd-tg428-skin-absorption-vitro';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'dermal penetration', 'en' FROM methods WHERE slug = 'oecd-tg428-skin-absorption-vitro';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'absorção cutânea', 'pt' FROM methods WHERE slug = 'oecd-tg428-skin-absorption-vitro';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'absorção percutânea', 'pt' FROM methods WHERE slug = 'oecd-tg428-skin-absorption-vitro';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'penetração dérmica', 'pt' FROM methods WHERE slug = 'oecd-tg428-skin-absorption-vitro';

-- acute_toxicity
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'acute toxicity', 'en' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'LD50 estimation', 'en' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'starting dose', 'en' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'cytotoxicity', 'en' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'toxicidade aguda', 'pt' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'dose inicial toxicidade', 'pt' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'DL50', 'pt' FROM methods WHERE slug = 'niceatm-cytotox-basal-barranco';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'acute toxicity', 'en' FROM methods WHERE slug = 'oecd-tg420-fixed-dose';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'fixed dose procedure', 'en' FROM methods WHERE slug = 'oecd-tg420-fixed-dose';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'LD50 alternative', 'en' FROM methods WHERE slug = 'oecd-tg420-fixed-dose';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'toxicidade aguda', 'pt' FROM methods WHERE slug = 'oecd-tg420-fixed-dose';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'doses fixas', 'pt' FROM methods WHERE slug = 'oecd-tg420-fixed-dose';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'alternativa DL50', 'pt' FROM methods WHERE slug = 'oecd-tg420-fixed-dose';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'acute toxicity', 'en' FROM methods WHERE slug = 'oecd-tg423-atc';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'acute toxic class', 'en' FROM methods WHERE slug = 'oecd-tg423-atc';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'GHS classification', 'en' FROM methods WHERE slug = 'oecd-tg423-atc';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'toxicidade aguda', 'pt' FROM methods WHERE slug = 'oecd-tg423-atc';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'classe tóxica aguda', 'pt' FROM methods WHERE slug = 'oecd-tg423-atc';

INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'acute toxicity', 'en' FROM methods WHERE slug = 'oecd-tg425-udp';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'up and down procedure', 'en' FROM methods WHERE slug = 'oecd-tg425-udp';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'LD50', 'en' FROM methods WHERE slug = 'oecd-tg425-udp';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'toxicidade aguda', 'pt' FROM methods WHERE slug = 'oecd-tg425-udp';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'procedimento up and down', 'pt' FROM methods WHERE slug = 'oecd-tg425-udp';
INSERT INTO method_keywords (method_id, keyword, language) SELECT id, 'DL50', 'pt' FROM methods WHERE slug = 'oecd-tg425-udp';


-- ===========================================================================
-- VERIFICATION QUERIES (run after applying migration)
-- ===========================================================================
-- SELECT COUNT(*) FROM methods;                          -- expect 25
-- SELECT COUNT(*) FROM methods WHERE active = TRUE;      -- expect 0
-- SELECT COUNT(*) FROM methods WHERE embedding_json IS NOT NULL; -- expect 0
-- SELECT endpoint_category, COUNT(*) FROM methods GROUP BY 1 ORDER BY 1;
-- SELECT COUNT(*) FROM method_keywords;                  -- expect ~120
-- SELECT slug, routes_applicable FROM methods ORDER BY endpoint_category, slug;
