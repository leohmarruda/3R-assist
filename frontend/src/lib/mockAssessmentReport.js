export const MOCK_ASSESSMENT_REPORT = {
  title: 'Protocol Assessment Report: T. parthenium Essential Oil',
  meta: [
    { label: 'Date', value: '2026-03-29' },
    {
      label: 'Input Study',
      value: 'Bulgarian Plant Extract Toxicology (Wistar Rat)',
    },
    { label: 'Analysis Type', value: '3Rs Alternative Method Mapping' },
  ],
  sections: [
    {
      id: '3.5.1',
      title: 'Section 3.5.1: Acute Toxicity (LD50)',
      parameters: [
        { parameter: 'Category', value: 'Acute Tox' },
        { parameter: 'Species', value: 'Rat' },
        { parameter: 'Strain', value: 'Wistar' },
        { parameter: 'Sex', value: 'male' },
        { parameter: 'Animals (n)', value: '60' },
        { parameter: 'Route', value: 'p.o. / i.p.' },
        { parameter: 'Duration', value: 'up to 24 h observation' },
        { parameter: 'Organs / tissues', value: '—' },
        {
          parameter: 'Endpoints',
          value: 'LD50, mortality, clinical signs',
        },
        { parameter: 'Regulatory reference', value: 'Yes' },
        { parameter: 'Test article', value: 'T. parthenium essential oil' },
        {
          parameter: 'Procedure',
          value: 'Single-dose acute toxicity; Litchfield–Wilcoxon LD50',
        },
      ],
      alternatives: [
        {
          methodName: '3T3 Neutral Red Uptake (NRU)',
          validationStatus: 'Validated (OECD TG 129)',
          speciesReplaced: 'Wistar Rat / Mouse',
          endpointType: 'Basal Cytotoxicity / LD50 Prediction',
          source: 'EURL ECVAM',
          threeR: 'replacement',
        },
        {
          methodName: 'T.E.S.T. (QSAR Model)',
          validationStatus: 'Regulatory Accepted',
          speciesReplaced: 'In Silico (No Animals)',
          endpointType: 'LD50 / GHS Hazard Category',
          source: 'EPA Resource',
          threeR: 'replacement',
        },
      ],
      insight:
        'Since your sample is an Essential Oil, the NRU assay is highly recommended as a range-finder. It can reduce animal use by up to 40% by accurately predicting the starting dose, even if a full replacement is not yet accepted for complex botanicals.',
    },
    {
      id: '3.5.2',
      title: 'Section 3.5.2: Repeated Dose Toxicity (28-Day)',
      parameters: [
        { parameter: 'Category', value: 'Repeated Dose' },
        { parameter: 'Species', value: 'Rat' },
        { parameter: 'Strain', value: 'Wistar' },
        { parameter: 'Sex', value: 'male' },
        { parameter: 'Animals (n)', value: '20' },
        { parameter: 'Route', value: 'p.o. (gavage)' },
        { parameter: 'Duration', value: '28 days + sampling' },
        { parameter: 'Organs / tissues', value: 'blood (serum)' },
        {
          parameter: 'Endpoints',
          value: 'body weight, hematology, serum biochemistry',
        },
        { parameter: 'Regulatory reference', value: 'No' },
        {
          parameter: 'Test article',
          value: 'T. parthenium EO in vehicle',
        },
        {
          parameter: 'Procedure',
          value: '28-day repeated oral toxicity',
        },
      ],
      alternatives: [
        {
          methodName: 'HepaRG™ System',
          validationStatus: 'Scientific Validation',
          speciesReplaced: 'Rat (Liver toxicity)',
          endpointType: 'Hepatotoxicity / ALT & AST Markers',
          source: 'DB-ALM-158',
          threeR: 'reduction',
        },
        {
          methodName: 'OECD IATA Framework',
          validationStatus: 'Standard Guidance',
          speciesReplaced: 'Rodent (Systemic)',
          endpointType: 'Multi-endpoint Weight of Evidence',
          source: 'OECD IATA Case Studies',
          threeR: 'reduction',
        },
      ],
      insight:
        'Systemic repeated dose toxicity is complex. Instead of a single "test tube" replacement, use an Integrated Approach to Testing and Assessment (IATA). This combines the HepaRG cell model (for your liver markers) with in silico predictions to justify reducing the 28-day study to a 7-day "dose range finder."',
    },
    {
      id: '3.5.3',
      title: 'Section 3.5.3: Histological Evaluation',
      parameters: [
        { parameter: 'Category', value: 'Other (histology)' },
        { parameter: 'Species', value: 'Rat' },
        { parameter: 'Strain', value: 'Wistar' },
        { parameter: 'Sex', value: 'not stated' },
        { parameter: 'Animals (n)', value: 'subset' },
        { parameter: 'Route', value: '—' },
        { parameter: 'Duration', value: 'day 29' },
        {
          parameter: 'Organs / tissues',
          value: 'brain, heart, stomach, liver, spleen, kidney',
        },
        { parameter: 'Endpoints', value: 'H&E histopathology' },
        { parameter: 'Regulatory reference', value: 'No' },
        { parameter: 'Test article', value: '—' },
        {
          parameter: 'Procedure',
          value: 'Post-mortem organs for histology',
        },
      ],
      alternatives: [
        {
          methodName: 'Multi-Organ-on-a-Chip (MOC)',
          validationStatus: 'Innovative / R&D',
          speciesReplaced: 'Rodent (Organ crosstalk)',
          endpointType: 'Pathological changes / Tissue architecture',
          source: 'NC3Rs Resource Library',
          threeR: 'refinement',
        },
        {
          methodName: 'Bhas 42 CTA',
          validationStatus: 'Validated (OECD GD 231)',
          speciesReplaced: 'Rodent (Systemic)',
          endpointType: 'Cell Transformation / Morphological Change',
          source: 'DB-ALM-130',
          threeR: 'replacement',
        },
      ],
      insight:
        'For structural changes, look into Virtual Second Species computational models (NC3Rs). These can simulate organ-level damage based on chemical structure, potentially replacing the need for sectioning and staining animal tissues.',
    },
  ],
  summary:
    'For this protocol, a hybrid approach is suggested. Move the Acute Toxicity (3.5.1) to an in vitro NRU range-finder to minimize rat usage, and utilize the HepaRG cell line to supplement the 28-day serum biochemistry data (3.5.2).',
}
