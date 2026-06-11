import { apiFetch } from './api'

export async function analyzeProtocol({ protocolText, lang }) {
  return apiFetch('/analyze', {
    method: 'POST',
    body: JSON.stringify({ protocol_text: protocolText, lang }),
  })
}
