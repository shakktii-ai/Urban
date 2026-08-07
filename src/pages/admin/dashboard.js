import React, { useState, useEffect } from 'react';
import TicketStatusBadge from '../../components/TicketStatusBadge';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Users,
  Grid,
  Activity,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  PlusCircle,
  BarChart3,
  Star,
  MapPin,
  Phone,
  RefreshCw
} from 'lucide-react';

const STATUS_PIPELINE = [
  'Created',
  'Broadcasted',
  'Accepted',
  'Assigned',
  'Started',
  'Completed',
  'Closed'
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // MIS Data States
  const [analytics, setAnalytics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Category Modal State
  const [newCatModal, setNewCatModal] = useState({ show: false, name: '', description: '' });

  // Vendor Register Modal State
  const [newVendorModal, setNewVendorModal] = useState({
    show: false,
    name: '',
    phone: '',
    categories: '',
    pincodes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ticketsRes, vendorsRes, categoriesRes, reportsRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch(`/api/admin/tickets?search=${searchTerm}&status=${statusFilter}&category=${categoryFilter}`),
        fetch('/api/admin/vendors'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/reports')
      ]);

      const [analyticsData, ticketsData, vendorsData, categoriesData, reportsData] = await Promise.all([
        analyticsRes.json(),
        ticketsRes.json(),
        vendorsRes.json(),
        categoriesRes.json(),
        reportsRes.json()
      ]);

      if (analyticsData.success) setAnalytics(analyticsData.analytics);
      if (ticketsData.success) setTickets(ticketsData.tickets);
      if (vendorsData.success) setVendors(vendorsData.vendors);
      if (categoriesData.success) setCategories(categoriesData.categories);
      if (reportsData.success) setReports(reportsData.report);
    } catch (error) {
      console.error('Error loading Admin MIS Data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const updateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const triggerBroadcast = async (ticketId) => {
    try {
      const res = await fetch(`/api/vendor/broadcast/${ticketId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Broadcast triggered successfully!');
        fetchData();
      } else {
        alert(data.error || 'Failed to trigger broadcast');
      }
    } catch (e) {
      alert('Broadcast request error');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatModal.name) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatModal.name,
          description: newCatModal.description
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewCatModal({ show: false, name: '', description: '' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterVendor = async () => {
    if (!newVendorModal.name || !newVendorModal.phone) return;
    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVendorModal.name,
          phone: newVendorModal.phone,
          categories: newVendorModal.categories.split(',').map((s) => s.trim()),
          pincodes: newVendorModal.pincodes.split(',').map((s) => s.trim())
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewVendorModal({ show: false, name: '', phone: '', categories: '', pincodes: '' });
        fetchData();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Government MIS Dashboard</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Monitoring & Management of Citizen Service Requests, Vendors, & Lifecycle Analytics.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Ticket List ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'vendors'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Vendor Directory ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Service Categories</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'status'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Request Status Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>MIS Reports</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Total Requests</span>
                <TicketIcon className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{analytics.totalTickets}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Active Vendors</span>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">
                {analytics.activeVendors} <span className="text-xs font-normal text-slate-400">/ {analytics.totalVendors} total</span>
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Completed Jobs</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">
                {(analytics.statusCounts['Completed'] || 0) + (analytics.statusCounts['Closed'] || 0)}
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Pending / In Progress</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">
                {(analytics.statusCounts['Created'] || 0) + (analytics.statusCounts['Broadcasted'] || 0) + (analytics.statusCounts['Assigned'] || 0) + (analytics.statusCounts['Started'] || 0)}
              </p>
            </div>
          </div>

          {/* Status Breakdown Grid */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Status Distribution</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {STATUS_PIPELINE.map((st) => (
                <div key={st} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{st}</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {analytics.statusCounts[st] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TICKET LIST */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-2 w-full">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket ID, phone, details, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </form>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {STATUS_PIPELINE.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="glass-card rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Citizen Phone</th>
                  <th className="p-4">Location / Address</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned Vendor</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400">
                      No service tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-white">{t.ticketId}</td>
                      <td className="p-4 font-semibold text-blue-400">{t.serviceCategory}</td>
                      <td className="p-4">{t.citizenPhone}</td>
                      <td className="p-4 max-w-xs truncate">{t.address} ({t.pincode})</td>
                      <td className="p-4">
                        <TicketStatusBadge status={t.status} />
                      </td>
                      <td className="p-4">{t.assignedVendor?.name || 'Unassigned'}</td>
                      <td className="p-4 text-right space-x-2">
                        {t.status === 'Created' && (
                          <button
                            onClick={() => triggerBroadcast(t.ticketId)}
                            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold"
                          >
                            Broadcast
                          </button>
                        )}
                        <select
                          value={t.status}
                          onChange={(e) => updateStatus(t.ticketId, e.target.value)}
                          className="px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-[11px] text-slate-300"
                        >
                          {STATUS_PIPELINE.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Registered Vendors</h2>
            <button
              onClick={() => setNewVendorModal({ show: true, name: '', phone: '', categories: '', pincodes: '' })}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Vendor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v._id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">{v.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{v.phone}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-xs font-bold">{v.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-400 font-semibold">Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {v.categories.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-400 font-semibold">Pincodes:</p>
                  <p className="text-slate-300">{v.pincodes.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SERVICE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Government Service Categories</h2>
            <button
              onClick={() => setNewCatModal({ show: true, name: '', description: '' })}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat._id} className="glass-card p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{cat.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">{cat.description || 'Standard government civic category.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REQUEST STATUS PIPELINE */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Request Status Lifecycle Pipeline</h2>

          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {STATUS_PIPELINE.map((st, idx) => (
                <div key={st} className="flex items-center space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500 text-blue-400 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-white mt-2">{st}</span>
                  </div>
                  {idx < STATUS_PIPELINE.length - 1 && (
                    <div className="hidden sm:block w-8 h-0.5 bg-slate-800"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS */}
      {activeTab === 'reports' && reports && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Government MIS Executive Reports</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">Overall Completion Rate</span>
              <p className="text-3xl font-extrabold text-emerald-400">{reports.completionRate}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Tickets Handled</span>
              <p className="text-3xl font-extrabold text-white">{reports.totalTickets}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pending Requests</span>
              <p className="text-3xl font-extrabold text-amber-400">{reports.openTickets}</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Category Performance Summary</h3>
            <div className="space-y-3">
              {reports.categoryBreakdown?.map((cat) => (
                <div key={cat._id} className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{cat._id}</p>
                    <p className="text-slate-400">{cat.completed} of {cat.total} completed</p>
                  </div>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {cat.total > 0 ? `${((cat.completed / cat.total) * 100).toFixed(0)}% Done` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CATEGORY */}
      {newCatModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border-slate-700">
            <h3 className="text-lg font-bold text-white">Add Service Category</h3>
            <input
              type="text"
              placeholder="Category Name (e.g. Street Lighting)"
              value={newCatModal.name}
              onChange={(e) => setNewCatModal({ ...newCatModal, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
            <textarea
              placeholder="Description"
              value={newCatModal.description}
              onChange={(e) => setNewCatModal({ ...newCatModal, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setNewCatModal({ show: false, name: '', description: '' })}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER VENDOR */}
      {newVendorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border-slate-700">
            <h3 className="text-lg font-bold text-white">Register New Vendor</h3>
            <input
              type="text"
              placeholder="Vendor Full Name"
              value={newVendorModal.name}
              onChange={(e) => setNewVendorModal({ ...newVendorModal, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
            <input
              type="text"
              placeholder="WhatsApp Phone Number (e.g. 919876543210)"
              value={newVendorModal.phone}
              onChange={(e) => setNewVendorModal({ ...newVendorModal, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
            <input
              type="text"
              placeholder="Categories (comma separated: Electricity, Water Supply)"
              value={newVendorModal.categories}
              onChange={(e) => setNewVendorModal({ ...newVendorModal, categories: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
            <input
              type="text"
              placeholder="Pincodes (comma separated: 110001, 110002)"
              value={newVendorModal.pincodes}
              onChange={(e) => setNewVendorModal({ ...newVendorModal, pincodes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setNewVendorModal({ show: false, name: '', phone: '', categories: '', pincodes: '' })}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterVendor}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Register Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
