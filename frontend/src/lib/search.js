import { apiFetch } from './api'
import { serializeParams } from './protocol'

export async function searchAlternatives({ params, filters, lang }) {
  return apiFetch('/search', {
    method: 'POST',
    body: JSON.stringify({ params, filters, lang }),
  })
}

export async function searchAllExperiments(experimentStates, lang) {
  return Promise.all(
    experimentStates.map(async (experiment) => {
      const params = serializeParams(experiment.params)
      const result = await searchAlternatives({ params, lang })
      return {
        params,
        studyType: experiment.studyType,
        notes: experiment.notes,
        recommendations: result.results ?? [],
        filter_relaxation: result.filter_relaxation ?? null,
      }
    }),
  )
}

export function scorePercent(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0
  return Math.round(score * 100)
}

export function isLowConfidenceScore(score) {
  return score <= 0.65
}

export function methodDisplayName(method, lang) {
  if (!method) return ''
  return lang === 'pt' ? method.name_pt : method.name_en
}

export function methodDescription(method, lang) {
  if (!method) return ''
  return lang === 'pt' ? method.description_pt : method.description_en
}

export function formatOecdReference(ref) {
  if (!ref?.trim()) return null
  const trimmed = ref.trim()
  if (/^oecd/i.test(trimmed)) return trimmed
  return `OECD ${trimmed}`
}

export function primaryThreeR(category3r) {
  const values = Array.isArray(category3r) ? category3r : [category3r].filter(Boolean)
  for (const preferred of ['replacement', 'reduction', 'refinement']) {
    if (values.includes(preferred)) return preferred
  }
  return values[0] ?? 'replacement'
}

export function formatThreeRLabel(category3r, t) {
  const values = Array.isArray(category3r) ? category3r : [category3r].filter(Boolean)
  return values.map((value) => t(`s3.threeR.${value}`)).join(' · ')
}

export function primaryValidationContext(contexts = []) {
  if (!contexts.length) return null
  const priority = ['brazil', 'oecd', 'eu', 'us']
  for (const jurisdiction of priority) {
    const match = contexts.find((context) => context.jurisdiction === jurisdiction)
    if (match) return match
  }
  return contexts[0]
}

export function formatJurisdictionBadges(contexts = [], t) {
  const jurisdictions = [...new Set(contexts.map((context) => context.jurisdiction))]
  return jurisdictions.map((value) => t(`s3.jurisdiction.${value}`)).join(' · ')
}

export function regulatoryUrlFromContexts(contexts = []) {
  const primary = primaryValidationContext(contexts)
  return primary?.regulatory_url ?? null
}

export function formatMatchedParams(matchedParams, t) {
  const labels = {
    endpoint_category: t('s2.fields.endpointCategory'),
    route: t('s2.fields.route'),
    study_domain: t('s2.fields.studyDomain'),
  }
  return (matchedParams ?? []).map((key) => labels[key] ?? key)
}
