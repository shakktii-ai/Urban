import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const LIFECYCLE_STEPS = [
  'Created',
  'Broadcasted',
  'Accepted',
  'Assigned',
  'Started',
  'Completed',
  'Closed'
];

export default function LifecycleTimeline({ currentStatus }) {
  const currentIndex = LIFECYCLE_STEPS.indexOf(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step} className="flex flex-col items-center z-10 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-600/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wider uppercase mt-2 text-center max-w-[60px] ${
                  isCurrent
                    ? 'text-blue-400 font-bold'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
