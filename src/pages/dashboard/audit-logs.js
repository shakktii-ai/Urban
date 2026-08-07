import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { ShieldAlert, User } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="System Audit Logs & Security Trail">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Chronological security and action audit trail for all system events.</p>
          <button onClick={fetchAuditLogs} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-blue-400">Refresh</button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Action</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Performed By</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60 text-xs">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-400">{l.action}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-300 text-[11px] font-semibold">
                        {l.module}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {l.performedBy}
                    </td>
                    <td className="p-4 text-gray-300 max-w-xs truncate">{JSON.stringify(l.details || {})}</td>
                    <td className="p-4 text-gray-400">{new Date(l.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">No audit log records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
