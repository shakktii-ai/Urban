import React from 'react';

const STATUS_STYLES = {
  Created: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
  Broadcasted: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  Accepted: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  Assigned: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  Started: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  Completed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  Closed: 'bg-slate-700/50 border-slate-600/50 text-slate-400'
};

export default function TicketStatusBadge({ status }) {
  const styleClass = STATUS_STYLES[status] || 'bg-blue-500/10 border-blue-500/30 text-blue-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      <span>{status}</span>
    </span>
  );
}
