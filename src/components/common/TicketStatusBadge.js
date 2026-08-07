import React from 'react';

export default function TicketStatusBadge({ status }) {
  const badgeStyles = {
    NEW: 'bg-blue-900/60 text-blue-300 border-blue-700',
    ASSIGNED: 'bg-purple-900/60 text-purple-300 border-purple-700',
    ACCEPTED: 'bg-indigo-900/60 text-indigo-300 border-indigo-700',
    IN_PROGRESS: 'bg-amber-900/60 text-amber-300 border-amber-700',
    COMPLETED: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
    CLOSED: 'bg-gray-800 text-gray-400 border-gray-700',
    DECLINED: 'bg-red-900/60 text-red-300 border-red-700',
    CANCELLED: 'bg-rose-900/60 text-rose-300 border-rose-700'
  };

  const style = badgeStyles[status] || 'bg-gray-800 text-gray-300 border-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status || 'UNKNOWN'}
    </span>
  );
}
