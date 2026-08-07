import React from 'react';
import TicketStatusBadge from './TicketStatusBadge';
import { Clock, User } from 'lucide-react';

export default function TimelineView({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-xs text-gray-400 italic">No timeline records found.</p>;
  }

  return (
    <div className="relative border-l-2 border-gray-700 pl-4 space-y-6 ml-2 my-4">
      {timeline.map((item, index) => (
        <div key={index} className="relative group">
          <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-gray-900 group-hover:scale-125 transition-transform" />
          
          <div className="flex items-center gap-2 mb-1">
            <TicketStatusBadge status={item.status} />
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-lg p-3 mt-1">
            <p className="text-xs text-gray-200 font-medium">{item.remarks || 'Status updated'}</p>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              <User className="w-3 h-3 text-gray-500" />
              Updated by: <strong className="text-gray-300">{item.updatedBy}</strong>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
