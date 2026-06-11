export const PARAMETER_FIELDS = [
  { key: 'biological_model', labelKey: 's2.fields.biologicalModel' },
  { key: 'objective', labelKey: 's2.fields.objective' },
  { key: 'procedure', labelKey: 's2.fields.procedure' },
  { key: 'endpoint', labelKey: 's2.fields.endpoint' },
  { key: 'application_area', labelKey: 's2.fields.applicationArea' },
]

export function emptyParameterKeys(params) {
  return PARAMETER_FIELDS.filter(({ key }) => !params?.[key]?.trim()).map(
    ({ key }) => key,
  )
}

export function createEmptyParams() {
  return Object.fromEntries(PARAMETER_FIELDS.map(({ key }) => [key, '']))
}
