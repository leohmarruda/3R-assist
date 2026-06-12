import {
  APPLICATION_AREAS,
  ENDPOINT_CATEGORIES,
  ROUTES,
  SPECIES,
} from './parameterVocabulary'

export const MATCHING_FIELDS = [
  {
    key: 'endpoint_category',
    labelKey: 's2.fields.endpointCategory',
    type: 'select',
    options: ENDPOINT_CATEGORIES,
    enumPrefix: 'endpointCategory',
    required: true,
    allowEmpty: true,
  },
  {
    key: 'route',
    labelKey: 's2.fields.route',
    type: 'routes',
    options: ROUTES,
    enumPrefix: 'route',
    hintKey: 's2.hints.route',
  },
  {
    key: 'application_area',
    labelKey: 's2.fields.applicationArea',
    type: 'select',
    options: APPLICATION_AREAS,
    enumPrefix: 'applicationArea',
    required: true,
  },
  {
    key: 'procedure_text',
    labelKey: 's2.fields.procedureText',
    type: 'textarea',
    hintKey: 's2.hints.procedureText',
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
  },
  {
    key: 'n_animals',
    labelKey: 's2.fields.nAnimals',
    type: 'number',
    allowEmpty: true,
  },
  {
    key: 'regulatory',
    labelKey: 's2.fields.regulatory',
    type: 'boolean',
    allowEmpty: true,
  },
]

export const PARAMETER_FIELDS = [...MATCHING_FIELDS, ...DISPLAY_FIELDS]

function parseRoutes(value) {
  if (!value?.trim()) return null
  const routes = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return routes.length ? routes : null
}

export function normalizeParams(params) {
  return {
    endpoint_category: params?.endpoint_category ?? '',
    route: Array.isArray(params?.route) ? params.route.join(', ') : '',
    application_area: params?.application_area ?? 'general',
    procedure_text: params?.procedure_text ?? '',
    species: params?.species ?? '',
    n_animals: params?.n_animals ?? '',
    regulatory:
      params?.regulatory === true
        ? 'true'
        : params?.regulatory === false
          ? 'false'
          : '',
  }
}

export function serializeParams(form) {
  const nAnimals = form.n_animals === '' ? null : Number(form.n_animals)

  return {
    endpoint_category: form.endpoint_category || null,
    route: parseRoutes(form.route),
    application_area: form.application_area || 'general',
    procedure_text: form.procedure_text?.trim() || null,
    species: form.species || null,
    n_animals: Number.isFinite(nAnimals) ? nAnimals : null,
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
  if (!params?.endpoint_category?.trim()) keys.push('endpoint_category')
  if (!params?.application_area?.trim()) keys.push('application_area')
  return keys
}

export function normalizeFieldConfidence(fieldConfidence, params) {
  return Object.fromEntries(
    PARAMETER_FIELDS.map(({ key }) => {
      const level = fieldConfidence?.[key]
      if (level) return [key, level]

      const serialized = serializeParams(params)
      const value = serialized[key]
      const hasValue =
        key === 'route'
          ? Boolean(value?.length)
          : value !== null && value !== undefined && value !== ''

      return [key, hasValue ? 'medium' : 'low']
    }),
  )
}
