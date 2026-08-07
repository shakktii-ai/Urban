import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { UserCheck, Shield, Plus } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Operator'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'Operator' });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="RBAC User Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Manage administrative portal users and role permissions (Super Admin, Admin, Operator).</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role (RBAC)</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60 text-xs">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 font-semibold text-white">{u.name}</td>
                    <td className="p-4 font-mono text-gray-300">{u.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                        <Shield className="w-3 h-3 text-blue-400" />
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <UserCheck className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Add New Admin User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="Suresh Patil"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="suresh@municipal.gov.in"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Password:</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Role:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Save User</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
