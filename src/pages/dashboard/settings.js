import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAssignEnabled: true,
    autoCategoryDetection: true,
    defaultVendorTimeoutMinutes: 30,
    systemNotificationEmail: 'admin@municipal.gov.in'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="System & Auto-Assign Settings">
      <div className="max-w-2xl bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Automation & Rules Config</h3>
            <p className="text-xs text-gray-400">Configure auto-vendor assignment and WhatsApp bot rules.</p>
          </div>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700">
            <div>
              <span className="font-semibold text-white block text-sm">Automated Vendor Assignment</span>
              <span className="text-gray-400 text-xs">Automatically match category & ward/area to assign available vendor.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoAssignEnabled}
              onChange={(e) => setSettings({ ...settings, autoAssignEnabled: e.target.checked })}
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700">
            <div>
              <span className="font-semibold text-white block text-sm">NLP Category Detection</span>
              <span className="text-gray-400 text-xs">Detect category automatically from citizen complaint text keywords.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoCategoryDetection}
              onChange={(e) => setSettings({ ...settings, autoCategoryDetection: e.target.checked })}
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">Vendor Response Timeout (Minutes):</label>
            <input
              type="number"
              value={settings.defaultVendorTimeoutMinutes}
              onChange={(e) => setSettings({ ...settings, defaultVendorTimeoutMinutes: parseInt(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">System Notification Email:</label>
            <input
              type="email"
              value={settings.systemNotificationEmail}
              onChange={(e) => setSettings({ ...settings, systemNotificationEmail: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
