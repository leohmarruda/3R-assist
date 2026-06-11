import { useTranslation } from 'react-i18next'
import InsightCallout from './InsightCallout'

const threeRBadge = {
  replacement:
    'bg-replacement-bg text-replacement-text border-replacement-border',
  reduction: 'bg-reduction-bg text-reduction-text border-reduction-border',
  refinement: 'bg-refinement-bg text-refinement-text border-refinement-border',
}

export default function ReportSection({ section }) {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-container-lowest">
      <header className="border-b border-border-subtle px-container-padding py-4">
        <h2 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          {section.title}
        </h2>
      </header>

      <div className="space-y-section-gap p-container-padding">
        <div>
          <h3 className="mb-card-gap font-label-caps text-label-caps uppercase text-on-surface-variant">
            {t('s3.extractedParameters')}
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container font-small-label text-small-label uppercase text-on-surface-variant">
                  <th className="px-container-padding py-3 font-medium">
                    {t('s3.colParameter')}
                  </th>
                  <th className="px-container-padding py-3 font-medium">
                    {t('s3.colValue')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-body-base text-body-base">
                {section.parameters.map((row) => (
                  <tr
                    key={row.parameter}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-container-padding py-3 text-on-surface-variant">
                      {row.parameter}
                    </td>
                    <td className="px-container-padding py-3">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="mb-card-gap font-label-caps text-label-caps uppercase text-on-surface-variant">
            {t('s3.recommendedAlternatives')}
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container font-small-label text-small-label uppercase text-on-surface-variant">
                  <th className="px-card-gap py-3 font-medium">
                    {t('s3.colMethod')}
                  </th>
                  <th className="px-card-gap py-3 font-medium">
                    {t('s3.colValidation')}
                  </th>
                  <th className="px-card-gap py-3 font-medium">
                    {t('s3.colSpecies')}
                  </th>
                  <th className="px-card-gap py-3 font-medium">
                    {t('s3.colEndpoint')}
                  </th>
                  <th className="px-card-gap py-3 font-medium">
                    {t('s3.colSource')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-metadata text-metadata">
                {section.alternatives.map((alt) => (
                  <tr
                    key={alt.methodName}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-card-gap py-3">
                      <div className="flex flex-col gap-fine-gap">
                        <span
                          className={`inline-flex w-fit rounded border px-2 py-0.5 font-badge-button text-badge-button uppercase ${threeRBadge[alt.threeR]}`}
                        >
                          {t(`s3.threeR.${alt.threeR}`)}
                        </span>
                        <span className="font-card-title text-card-title text-primary">
                          {alt.methodName}
                        </span>
                      </div>
                    </td>
                    <td className="px-card-gap py-3">{alt.validationStatus}</td>
                    <td className="px-card-gap py-3">{alt.speciesReplaced}</td>
                    <td className="px-card-gap py-3">{alt.endpointType}</td>
                    <td className="px-card-gap py-3">
                      <span className="rounded border border-border-subtle bg-surface-container px-1.5 py-0.5">
                        {alt.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <InsightCallout>{section.insight}</InsightCallout>
      </div>
    </section>
  )
}
