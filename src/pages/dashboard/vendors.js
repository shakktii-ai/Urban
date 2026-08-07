import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Plus, Users, Phone, MapPin, Tag } from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    categories: 'Water Leakage',
    assignedWards: 'Ward 1',
    assignedAreas: 'ABC Colony'
  });

  useEffect(() => {
    fetchVendors();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({ name: '', mobile: '', categories: 'Water Leakage', assignedWards: 'Ward 1', assignedAreas: 'ABC Colony' });
        fetchVendors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="Vendor Directory & Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Registered municipal service providers (WhatsApp notifications active).</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Vendor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v._id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-base">{v.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                  {v.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono">{v.mobile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>{v.categories?.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{v.assignedWards?.join(', ')} ({v.assignedAreas?.join(', ')})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-400">
                <span>Active Jobs: <strong className="text-white">{v.activeTicketCount || 0}</strong></span>
                <span>Rating: <strong className="text-amber-400">★ {v.rating || 5.0}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Vendor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Add New Service Vendor</h3>
              <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Vendor Name:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="Ramesh Electricals"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Mobile Number (WhatsApp):</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="919022557901"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category:</label>
                  <input
                    type="text"
                    required
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="Electricity, Water Leakage"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Assigned Ward:</label>
                  <input
                    type="text"
                    required
                    value={formData.assignedWards}
                    onChange={(e) => setFormData({ ...formData, assignedWards: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="Ward 1"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Assigned Areas:</label>
                  <input
                    type="text"
                    required
                    value={formData.assignedAreas}
                    onChange={(e) => setFormData({ ...formData, assignedAreas: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="ABC Colony, Bus Stand"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Save Vendor</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
