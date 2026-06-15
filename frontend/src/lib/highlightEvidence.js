function findCaseInsensitiveIndex(haystack, needle) {
  if (!needle) return -1
  return haystack.toLowerCase().indexOf(needle.toLowerCase())
}

function evidenceCandidates(phrase) {
  const trimmed = phrase.trim()
  if (!trimmed) return []

  const withoutEllipsis = trimmed
    .replace(/\s*[…\.]{1,3}.*$/u, '')
    .replace(/\s*\.\.\..*$/, '')
    .trim()

  const candidates = [trimmed]
  if (withoutEllipsis && withoutEllipsis !== trimmed) {
    candidates.push(withoutEllipsis)
  }
  if (withoutEllipsis.length >= 15) {
    const partial = withoutEllipsis.slice(0, 24).trim()
    if (partial.length >= 10 && !candidates.includes(partial)) {
      candidates.push(partial)
    }
  }
  return candidates
}

export function findEvidenceRange(text, phrase) {
  if (!text || !phrase?.trim()) return null

  for (const candidate of evidenceCandidates(phrase)) {
    const start = findCaseInsensitiveIndex(text, candidate)
    if (start !== -1) {
      return { start, end: start + candidate.length }
    }
  }
  return null
}

export function mergeHighlightSpans(spans) {
  if (!spans.length) return []

  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const merged = [{ ...sorted[0] }]

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }

  return merged
}

export function buildHighlightSpans(text, evidence = {}) {
  if (!text) return []

  const phrases = Object.values(evidence).filter(
    (value) => typeof value === 'string' && value.trim(),
  )

  const spans = []
  for (const phrase of phrases) {
    const range = findEvidenceRange(text, phrase)
    if (range) spans.push(range)
  }

  return mergeHighlightSpans(spans)
}

export function splitTextWithHighlights(text, spans) {
  if (!text) return []
  if (!spans.length) return [{ highlighted: false, text }]

  const parts = []
  let cursor = 0

  for (const { start, end } of spans) {
    if (cursor < start) {
      parts.push({ highlighted: false, text: text.slice(cursor, start) })
    }
    parts.push({ highlighted: true, text: text.slice(start, end) })
    cursor = end
  }

  if (cursor < text.length) {
    parts.push({ highlighted: false, text: text.slice(cursor) })
  }

  return parts
}
