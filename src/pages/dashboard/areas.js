import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { MapPin, Plus } from 'lucide-react';

export default function AreasPage() {
  const [wards, setWards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [wardName, setWardName] = useState('');
  const [areasText, setAreasText] = useState('');

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setWards(data.wards);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          wardName,
          areas: areasText.split(',').map(a => a.trim())
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setWardName('');
        setAreasText('');
        fetchWards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="Municipal Wards & Areas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Manage municipal ward boundaries and associated area localities.</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Ward
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wards.map((w) => (
            <div key={w._id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white text-base">{w.wardName}</h4>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Covered Localities / Areas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {w.areas?.map((a, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-md">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Ward Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Add New Ward & Localities</h3>
              <form onSubmit={handleCreateWard} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Ward Name:</label>
                  <input
                    type="text"
                    required
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="Ward 1"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Areas (Comma-separated):</label>
                  <textarea
                    required
                    rows="3"
                    value={areasText}
                    onChange={(e) => setAreasText(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="ABC Colony, XYZ Road, Bus Stand"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Save Ward</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
