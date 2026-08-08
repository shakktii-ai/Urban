import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Calendar,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  FileCode
} from 'lucide-react';

export default function WhatsAppDeliveryStatusPage() {
  const [loading, setLoading] = useState(true);
  const [checkingPending, setCheckingPending] = useState(false);
  const [checkingSingle, setCheckingSingle] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    successRate: '100.0%'
  });
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchDeliveryData = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);
      if (typeFilter) query.append('messageType', typeFilter);

      const res = await fetch(`/api/messages/delivery-status?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch delivery status data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  // Initial load and 30-second auto-refresh
  useEffect(() => {
    fetchDeliveryData();
    const interval = setInterval(() => {
      fetchDeliveryData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDeliveryData]);

  // Trigger BagAChat API 2 check for messages older than 1 minute
  const handleCheckPendingApi2 = async () => {
    setCheckingPending(true);
    try {
      const res = await fetch('/api/messages/check-status', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`API 2 Status Check Complete!\nChecked: ${data.checkedCount} pending messages.\nUpdated: ${data.updatedCount} message statuses.`);
        fetchDeliveryData();
      } else {
        alert(`API 2 Check Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error triggering BagAChat API 2 status check');
    } finally {
      setCheckingPending(false);
    }
  };

  // Check single message API 2 status
  const handleCheckSingleMessage = async (messageId) => {
    setCheckingSingle(messageId);
    try {
      const res = await fetch('/api/messages/delivery-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
      const data = await res.json();
      if (data.success) {
        fetchDeliveryData();
        if (data.record) setSelectedMessage(data.record);
      } else {
        alert(`Single Check Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error checking message status');
    } finally {
      setCheckingSingle(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">PENDING</span>;
      case 'SENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">SENT</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">DELIVERED</span>;
      case 'READ':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400">READ</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">UNKNOWN</span>;
    }
  };

  return (
    <AppLayout title="WhatsApp Delivery Status (BagAChat API 2)">
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">WhatsApp Delivery Status</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated tracking of WhatsApp Template (API 1.1) & Session (API 1.2) delivery statuses via BagAChat API 2.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={handleCheckPendingApi2}
              disabled={checkingPending}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checkingPending ? 'animate-spin' : ''}`} />
              <span>{checkingPending ? 'Checking API 2...' : 'Check API 2 (>1 min)'}</span>
            </button>
            <button
              onClick={fetchDeliveryData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-card p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Messages</span>
            <p className="text-2xl font-extrabold text-white">{stats.total}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1 border-amber-500/20">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending</span>
            <p className="text-2xl font-extrabold text-amber-400">{stats.pending}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1 border-emerald-500/20">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Delivered</span>
            <p className="text-2xl font-extrabold text-emerald-400">{stats.delivered}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1 border-purple-500/20">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Read</span>
            <p className="text-2xl font-extrabold text-purple-400">{stats.read}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1 border-rose-500/20">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Failed</span>
            <p className="text-2xl font-extrabold text-rose-400">{stats.failed}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-1 border-blue-500/20">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Success Rate</span>
            <p className="text-2xl font-extrabold text-blue-400">{stats.successRate}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Ticket, Phone, Vendor, or Message ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="READ">READ</option>
              <option value="FAILED">FAILED</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="TEMPLATE">Template (API 1.1)</option>
              <option value="SESSION">Session (API 1.2)</option>
            </select>
          </div>
        </div>

        {/* Messages Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Ticket No</th>
                  <th className="p-4">Recipient / Vendor</th>
                  <th className="p-4">Mobile Number</th>
                  <th className="p-4">Message Type</th>
                  <th className="p-4">API Used</th>
                  <th className="p-4">Message ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Remarks / Reason</th>
                  <th className="p-4">Sent Time</th>
                  <th className="p-4">Checked Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-8 text-center text-slate-400">
                      No delivery status records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-white whitespace-nowrap">
                        {m.ticketNumber || 'N/A'}
                      </td>
                      <td className="p-4 font-medium text-slate-200">
                        {m.vendorName || m.citizenName || 'System User'}
                      </td>
                      <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                        {m.phone}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.messageType === 'TEMPLATE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {m.messageType || 'TEMPLATE'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {m.apiUsed || 'API 1.1'}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400 max-w-[120px] truncate" title={m.messageId}>
                        {m.messageId}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {getStatusBadge(m.status)}
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-400">
                        {m.reason || 'Normal delivery process'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {m.checkedAt ? new Date(m.checkedAt).toLocaleString() : 'Not Checked Yet'}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleCheckSingleMessage(m.messageId)}
                          disabled={checkingSingle === m.messageId}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[11px] font-semibold border border-blue-500/30 transition-all"
                          title="Trigger API 2 Check Now"
                        >
                          {checkingSingle === m.messageId ? 'Checking...' : 'Check API 2'}
                        </button>

                        <button
                          onClick={() => setSelectedMessage(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all inline-flex items-center"
                          title="View Details JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS MODAL */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <div className="glass-card max-w-3xl w-full p-6 rounded-2xl space-y-5 border-slate-700 my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30 text-blue-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Delivery Status Details</h3>
                    <p className="text-xs text-slate-400 font-mono">Message ID: {selectedMessage.messageId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Status Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Ticket No</span>
                  <span className="text-xs font-bold text-white">{selectedMessage.ticketNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Message Type</span>
                  <span className="text-xs font-semibold text-blue-400">{selectedMessage.messageType} ({selectedMessage.apiUsed})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Recipient</span>
                  <span className="text-xs font-semibold text-slate-200">{selectedMessage.vendorName || selectedMessage.phone}</span>
                </div>
              </div>

              {/* Status Timeline History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Status Timeline History</h4>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 max-h-36 overflow-y-auto">
                  {selectedMessage.statusHistory && selectedMessage.statusHistory.length > 0 ? (
                    selectedMessage.statusHistory.map((h, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs border-b border-slate-900 pb-1.5 last:border-0">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(h.status)}
                          <span className="text-slate-300">{h.remarks}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No status history recorded.</p>
                  )}
                </div>
              </div>

              {/* BagAChat Request JSON */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Request Payload (JSON)</h4>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedMessage.requestPayload || {}, null, 2)}
                </pre>
              </div>

              {/* BagAChat API 2 Response JSON */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">BagAChat API 2 Response (JSON)</h4>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-400 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedMessage.rawResponse || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
