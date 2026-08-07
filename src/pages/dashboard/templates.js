import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { RefreshCw, FileCode, CheckCircle } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/templates/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchTemplates();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppLayout title="BagAChat WhatsApp Templates (API 5 Sync)">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Approved Meta WhatsApp Message Templates synced via BagAChat API 5.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync BagAChat Templates (API 5)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-white text-sm font-mono">{t.templateName}</h4>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <CheckCircle className="w-3 h-3" /> {t.status}
                </span>
              </div>
              <p className="text-xs text-gray-300 bg-gray-900 p-3 rounded-lg border border-gray-700 font-mono whitespace-pre-wrap">{t.bodyText || 'Default Template Content'}</p>
              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-gray-700/60">
                <span>Category: {t.category}</span>
                <span>Language: {t.language}</span>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full p-8 text-center bg-gray-800 rounded-xl border border-gray-700 text-gray-400 text-xs">
              No approved templates synced yet. Click the sync button above to fetch templates via BagAChat API 5.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
