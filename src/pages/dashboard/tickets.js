import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import TicketStatusBadge from '../../components/common/TicketStatusBadge';
import TimelineView from '../../components/common/TimelineView';
import { Search, Filter, Eye, UserPlus, X } from 'lucide-react';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignModalTicket, setAssignModalTicket] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  useEffect(() => {
    fetchTickets();
    fetchVendors();
  }, [statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams({
        status: statusFilter,
        search: search
      }).toString();
      const res = await fetch(`/api/tickets?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVendors(data.vendors);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleManualAssign = async () => {
    if (!assignModalTicket || !selectedVendorId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tickets/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ticketId: assignModalTicket._id,
          vendorId: selectedVendorId
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssignModalTicket(null);
        setSelectedVendorId('');
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="Complaint Tickets Catalog">
      <div className="space-y-6">
        {/* Filters & Search Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ticket #, Phone, Name, Area..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DECLINED">DECLINED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button
              onClick={fetchTickets}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Ticket Number</th>
                  <th className="p-4">Citizen</th>
                  <th className="p-4">Category & Details</th>
                  <th className="p-4">Ward / Area</th>
                  <th className="p-4">Assigned Vendor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60 text-xs">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-400">{t.ticketNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{t.citizen.name}</div>
                      <div className="text-gray-400 text-[11px]">{t.citizen.phone}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-white">{t.complaint.category}</div>
                      <div className="text-gray-400 text-[11px] truncate">{t.complaint.text}</div>
                    </td>
                    <td className="p-4 text-gray-300">{t.wardName} - {t.areaName}</td>
                    <td className="p-4">
                      {t.assignedVendor ? (
                        <div>
                          <div className="font-medium text-white">{t.assignedVendor.name}</div>
                          <div className="text-gray-400 text-[11px]">{t.assignedVendor.mobile}</div>
                        </div>
                      ) : (
                        <span className="text-amber-400 text-[11px] font-medium italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <TicketStatusBadge status={t.status} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-blue-400"
                        title="View Timeline & Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setAssignModalTicket(t)}
                        className="p-1.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white"
                        title="Manual Vendor Override"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">No tickets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline Drawer / Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
            <div className="w-full max-w-md bg-gray-800 border-l border-gray-700 h-full overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedTicket.ticketNumber}</h3>
                  <p className="text-xs text-gray-400">Complaint Details & Timeline Audit</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 font-semibold block">Citizen:</span>
                  <span className="text-white font-medium">{selectedTicket.citizen.name} ({selectedTicket.citizen.phone})</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block">Location:</span>
                  <span className="text-white font-medium">{selectedTicket.wardName} - {selectedTicket.areaName}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block">Complaint Description:</span>
                  <p className="text-gray-200 mt-1 bg-gray-800 p-2.5 rounded border border-gray-700">{selectedTicket.complaint.text}</p>
                </div>
                {selectedTicket.complaint.mediaUrl && (
                  <div>
                    <span className="text-gray-400 font-semibold block mb-1">Attached Media:</span>
                    <img src={selectedTicket.complaint.mediaUrl} alt="Complaint media" className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Embedded Audit Timeline</h4>
                <TimelineView timeline={selectedTicket.timeline} />
              </div>
            </div>
          </div>
        )}

        {/* Manual Vendor Override Modal */}
        {assignModalTicket && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <h3 className="font-bold text-white text-base">Assign Vendor to {assignModalTicket.ticketNumber}</h3>
                <button onClick={() => setAssignModalTicket(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Select Vendor:</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.mobile}) - {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setAssignModalTicket(null)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Confirm & Dispatch BagAChat API 1.1
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
