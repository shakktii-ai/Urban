import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtext = '' }) {
  const colorMap = {
    blue: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-600/20 text-red-400 border-red-500/30'
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
      {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
    </div>
  );
}
