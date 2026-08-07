import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { MessageSquare, ArrowUpRight, ArrowDownLeft, CheckCheck } from 'lucide-react';

export default function WhatsAppPage() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="WhatsApp Messages Live Feed">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Complete audit log of Inbound & Outbound WhatsApp messages via BagAChat APIs.</p>
          <button onClick={fetchMessages} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-blue-400">Refresh</button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Direction</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Message / Template Content</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60 text-xs">
                {messages.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                      {m.direction === 'Inbound' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-semibold text-[11px]">
                          <ArrowDownLeft className="w-3 h-3" /> Inbound
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800 font-semibold text-[11px]">
                          <ArrowUpRight className="w-3 h-3" /> Outbound
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-medium text-white">{m.phone}</td>
                    <td className="p-4 max-w-md">
                      <div className="text-gray-200">{m.message}</div>
                      {m.mediaUrl && (
                        <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline block mt-1">
                          View Attached Media
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-gray-300">
                        <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        {m.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{new Date(m.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">No WhatsApp messages recorded yet.</td>
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
