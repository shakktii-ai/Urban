import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [status, setStatus] = useState('ALL');
  const [downloading, setDownloading] = useState(false);

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/export?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `municipal_complaints_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout title="MIS Reports & CSV Export">
      <div className="space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm max-w-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Export Complaints CSV Report</h3>
              <p className="text-xs text-gray-400">Download filtered complaint tickets with complete timeline and vendor assignment history.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Filter by Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white"
              >
                <option value="ALL">All Complaints</option>
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DECLINED">DECLINED</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={downloading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
            {downloading ? 'Generating CSV...' : 'Download CSV Report'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
