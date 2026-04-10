import { PIPELINE_STAGES, pipelineStageIndex } from '@/lib/utils'
import type { PipelineStage } from '@/types'

interface Props {
  stage: PipelineStage | null
  eta: string | null
}

export default function PipelineTimeline({ stage, eta }: Props) {
  if (!stage || stage === 'listed') return null

  const currentIdx = pipelineStageIndex(stage)

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Import Progress</p>

      {/* Desktop: horizontal */}
      <div className="hidden sm:block">
        <div className="flex items-center">
          {PIPELINE_STAGES.map((s, i) => {
            const isComplete = i < currentIdx
            const isCurrent = i === currentIdx
            const isFuture = i > currentIdx

            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                {/* Dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isComplete ? 'bg-ocean'
                        : isCurrent ? 'bg-ocean ring-4 ring-ocean/20'
                        : 'bg-gray-200'
                    }`}
                  />
                  <span className={`text-[10px] mt-1.5 whitespace-nowrap ${
                    isCurrent ? 'font-bold text-ocean' : isComplete ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    {s.label}
                  </span>
                  {isCurrent && eta && (
                    <span className="text-[9px] text-ocean font-medium mt-0.5">
                      ETA {new Date(eta).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                {/* Line */}
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    i < currentIdx ? 'bg-ocean' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden space-y-0">
        {PIPELINE_STAGES.map((s, i) => {
          const isComplete = i < currentIdx
          const isCurrent = i === currentIdx
          if (i > currentIdx + 1) return null // Only show up to 1 future step on mobile

          return (
            <div key={s.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${
                  isComplete ? 'bg-ocean' : isCurrent ? 'bg-ocean ring-3 ring-ocean/20' : 'bg-gray-200'
                }`} />
                {i <= currentIdx && i < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-0.5 h-5 ${isComplete ? 'bg-ocean' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="pb-2">
                <span className={`text-xs ${
                  isCurrent ? 'font-bold text-ocean' : isComplete ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {s.label}
                  {isCurrent && eta && (
                    <span className="text-ocean font-medium ml-1">
                      — ETA {new Date(eta).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
