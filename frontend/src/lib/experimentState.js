import {
  extractEvidence,
  extractFieldConfidence,
  normalizeParams,
  normalizeParamsFromExperiment,
} from './protocol.js'

export function buildExperimentState(experiment) {
  const raw = experiment?.raw ?? {}
  return {
    params: normalizeParamsFromExperiment(experiment),
    studyType: raw.study_type ?? '',
    notes: raw.notes ?? experiment?.notes ?? null,
    evidence: extractEvidence(raw),
    fieldConfidence: extractFieldConfidence(raw),
  }
}

export function buildExperimentStates(experiments) {
  return (experiments ?? []).map(buildExperimentState)
}

export function resolveExperimentStates(analysis) {
  if (analysis?.experimentStates?.length) {
    return analysis.experimentStates.map((item) => ({
      ...item,
      params: normalizeParams(item.params),
    }))
  }

  if (analysis?.experiments?.length) {
    return buildExperimentStates(analysis.experiments)
  }

  return [
    {
      params: normalizeParams(analysis?.params ?? {}),
      studyType: analysis?.studyType ?? '',
      notes: analysis?.notes ?? null,
      evidence: analysis?.evidence ?? {},
      fieldConfidence: analysis?.fieldConfidence ?? {},
    },
  ]
}
