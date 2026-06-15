import {
  APPLICATION_AREAS,
  ENDPOINT_CATEGORIES,
  ROUTES,
  SPECIES,
} from './parameterVocabulary'

export const ANIMAL_COUNT_FIELDS = [
  { key: 'female', labelKey: 's2.fields.animalCounts.female' },
  { key: 'male', labelKey: 's2.fields.animalCounts.male' },
  { key: 'total', labelKey: 's2.fields.animalCounts.total' },
  { key: 'per_group', labelKey: 's2.fields.animalCounts.perGroup' },
]

export const ENDPOINT_FIELD = {
  key: 'endpoint_category',
  labelKey: 's2.fields.endpointCategory',
  type: 'select',
  options: ENDPOINT_CATEGORIES,
  enumPrefix: 'endpointCategory',
  required: true,
  allowEmpty: true,
}

export const MATCHING_FIELDS = [
  {
    key: 'route',
    labelKey: 's2.fields.route',
    type: 'routes',
    options: ROUTES,
    enumPrefix: 'route',
    hintKey: 's2.hints.route',
    evidenceKey: 'route',
    confidenceKey: 'route',
  },
  {
    key: 'application_area',
    labelKey: 's2.fields.applicationArea',
    type: 'select',
    options: APPLICATION_AREAS,
    enumPrefix: 'applicationArea',
    required: true,
    evidenceKey: 'application_area',
    confidenceKey: 'application_area',
  },
  {
    key: 'procedure_text',
    labelKey: 's2.fields.procedureText',
    type: 'textarea',
    hintKey: 's2.hints.procedureText',
    evidenceKey: 'procedure_text',
    confidenceKey: 'procedure_text',
  },
]

export const DISPLAY_FIELDS = [
  {
    key: 'species',
    labelKey: 's2.fields.species',
    type: 'select',
    options: SPECIES,
    enumPrefix: 'species',
    allowEmpty: true,
    evidenceKey: 'species',
    confidenceKey: 'species',
  },
  {
    key: 'regulatory',
    labelKey: 's2.fields.regulatory',
    type: 'boolean',
    allowEmpty: true,
    evidenceKey: 'regulatory',
    confidenceKey: 'regulatory',
  },
]

const EMPTY_ANIMAL_COUNTS = {
  female: '',
  male: '',
  total: '',
  per_group: '',
}

function parseRoutes(value) {
  if (!value?.trim()) return null
  const routes = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return routes.length ? routes : null
}

function parseCount(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeAnimalCounts(counts, fallbackTotal) {
  const source = counts ?? {}
  return {
    female: source.female ?? '',
    male: source.male ?? '',
    total: source.total ?? fallbackTotal ?? '',
    per_group: source.per_group ?? '',
  }
}

function serializeAnimalCounts(formCounts) {
  const counts = {
    female: parseCount(formCounts?.female),
    male: parseCount(formCounts?.male),
    total: parseCount(formCounts?.total),
    per_group: parseCount(formCounts?.per_group),
  }
  const hasValue = Object.values(counts).some((value) => value !== null)
  return hasValue ? counts : null
}

export function primaryAnimalCount(counts) {
  if (!counts) return null
  if (counts.total != null) return counts.total
  if (counts.male != null && counts.female != null) {
    return counts.male + counts.female
  }
  return counts.male ?? counts.female ?? counts.per_group ?? null
}

export function normalizeParamsFromExperiment(experiment) {
  const raw = experiment?.raw ?? {}
  const params = experiment?.params ?? {}

  return normalizeParams({
    endpoint_category: experiment?.endpoint_category ?? params.endpoint_category,
    route: raw.route ?? params.route,
    application_area: raw.application_area ?? params.application_area,
    procedure_text: raw.procedure_text ?? params.procedure_text,
    species: raw.species ?? params.species,
    animal_counts: raw.animal_counts,
    n_animals: params.n_animals,
    regulatory: raw.regulatory ?? params.regulatory,
  })
}

function formatRouteForForm(route) {
  if (Array.isArray(route)) return route.join(', ')
  if (typeof route === 'string' && route.trim()) return route.trim()
  return ''
}

export function normalizeParams(params) {
  return {
    endpoint_category: params?.endpoint_category ?? '',
    route: formatRouteForForm(params?.route),
    application_area: params?.application_area ?? 'general',
    procedure_text: params?.procedure_text ?? '',
    species: params?.species ?? '',
    animal_counts: normalizeAnimalCounts(
      params?.animal_counts,
      params?.n_animals ?? '',
    ),
    regulatory:
      params?.regulatory === true
        ? 'true'
        : params?.regulatory === false
          ? 'false'
          : '',
  }
}

export function serializeParams(form) {
  const animal_counts = serializeAnimalCounts(form.animal_counts)

  return {
    endpoint_category: form.endpoint_category || null,
    route: parseRoutes(form.route),
    application_area: form.application_area || 'general',
    procedure_text: form.procedure_text?.trim() || null,
    species: form.species || null,
    animal_counts,
    n_animals: primaryAnimalCount(animal_counts),
    regulatory:
      form.regulatory === 'true'
        ? true
        : form.regulatory === 'false'
          ? false
          : null,
  }
}

export function emptyParameterKeys(params) {
  const keys = []
  if (!params?.application_area?.trim()) keys.push('application_area')
  return keys
}

export function extractEvidence(raw = {}) {
  return {
    route: raw.route_evidence ?? null,
    application_area: raw.application_area_evidence ?? null,
    procedure_text: raw.procedure_text_evidence ?? null,
    species: raw.species_evidence ?? null,
    animal_counts: raw.animal_counts_evidence ?? null,
    regulatory: raw.regulatory_evidence ?? null,
  }
}

export function extractFieldConfidence(raw = {}) {
  return {
    route: raw.route_confidence ?? null,
    application_area: raw.application_area_confidence ?? null,
    procedure_text: raw.procedure_text_confidence ?? null,
    species: raw.species_confidence ?? null,
    animal_counts: raw.animal_counts_confidence ?? null,
    regulatory: raw.regulatory_confidence ?? null,
  }
}
