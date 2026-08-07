import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/common/StatCard';
import TicketStatusBadge from '../../components/common/TicketStatusBadge';
import { Ticket, Users, CheckCircle, Clock, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};

  return (
    <AppLayout title="Overview & Realtime Analytics">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Tickets" value={stats.totalTickets || 0} icon={Ticket} color="blue" subtext="Cumulative complaints" />
            <StatCard title="New Complaints" value={stats.newTickets || 0} icon={AlertTriangle} color="amber" subtext="Awaiting processing" />
            <StatCard title="Assigned / Active" value={(stats.assignedTickets || 0) + (stats.acceptedTickets || 0)} icon={Clock} color="purple" subtext="Vendor assigned" />
            <StatCard title="Completed" value={stats.completedTickets || 0} icon={CheckCircle} color="emerald" subtext="Resolved complaints" />
            <StatCard title="Active Vendors" value={stats.totalVendors || 0} icon={Users} color="blue" subtext={`${stats.availableVendors || 0} Available`} />
          </div>

          {/* Ticket Pipeline Summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Ticket Status Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg p-3 text-center">
                <span className="text-xs text-blue-300 font-semibold block">NEW</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.newTickets || 0}</span>
              </div>
              <div className="bg-purple-950/40 border border-purple-800/60 rounded-lg p-3 text-center">
                <span className="text-xs text-purple-300 font-semibold block">ASSIGNED</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.assignedTickets || 0}</span>
              </div>
              <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-lg p-3 text-center">
                <span className="text-xs text-indigo-300 font-semibold block">ACCEPTED</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.acceptedTickets || 0}</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-center">
                <span className="text-xs text-amber-300 font-semibold block">IN_PROGRESS</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.inProgressTickets || 0}</span>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 text-center">
                <span className="text-xs text-emerald-300 font-semibold block">COMPLETED</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.completedTickets || 0}</span>
              </div>
              <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 text-center">
                <span className="text-xs text-red-300 font-semibold block">DECLINED</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.declinedTickets || 0}</span>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                <span className="text-xs text-gray-400 font-semibold block">MESSAGES</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.totalMessages || 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Tickets Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Complaints</h3>
              <Link href="/dashboard/tickets" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold">
                View All Tickets <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Ticket Number</th>
                    <th className="p-4">Citizen</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Ward / Area</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60 text-xs">
                  {data?.recentTickets?.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-400">{t.ticketNumber}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{t.citizen.name}</div>
                        <div className="text-gray-400 text-[11px]">{t.citizen.phone}</div>
                      </td>
                      <td className="p-4 font-medium text-gray-300">{t.complaint.category}</td>
                      <td className="p-4 text-gray-300">{t.wardName} - {t.areaName}</td>
                      <td className="p-4">
                        <TicketStatusBadge status={t.status} />
                      </td>
                      <td className="p-4 text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!data?.recentTickets || data.recentTickets.length === 0) && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">No complaints registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
