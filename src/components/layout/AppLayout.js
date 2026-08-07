import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Ticket,
  Users,
  MapPin,
  MessageSquare,
  FileCode,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  LogOut,
  Moon,
  Sun,
  Bell
} from 'lucide-react';

export default function AppLayout({ children, title = 'Dashboard' }) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token && router.pathname !== '/login') {
      router.push('/login');
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  // Connect to Realtime Server-Sent Events (/api/realtime/events)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eventSource = new EventSource('/api/realtime/events');
      
      eventSource.addEventListener('NEW_COMPLAINT', (e) => {
        const data = JSON.parse(e.data);
        addNotification(`🚨 New Complaint Created: ${data.ticketNumber} (${data.category})`);
      });

      eventSource.addEventListener('VENDOR_ACCEPTED', (e) => {
        const data = JSON.parse(e.data);
        addNotification(`✅ Vendor ${data.vendorName} Accepted Ticket ${data.ticketNumber}`);
      });

      eventSource.addEventListener('VENDOR_DECLINED', (e) => {
        const data = JSON.parse(e.data);
        addNotification(`⚠️ Vendor ${data.vendorName} Declined Ticket ${data.ticketNumber}`);
      });

      eventSource.addEventListener('COMPLETED', (e) => {
        const data = JSON.parse(e.data);
        addNotification(`🎉 Ticket ${data.ticketNumber} Resolved by ${data.vendorName}`);
      });

      return () => eventSource.close();
    }
  }, []);

  const addNotification = (msg) => {
    setNotifications((prev) => [msg, ...prev.slice(0, 4)]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tickets Catalog', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Vendor Directory', href: '/dashboard/vendors', icon: Users },
    { name: 'Wards & Areas', href: '/dashboard/areas', icon: MapPin },
    { name: 'WhatsApp Feed', href: '/dashboard/whatsapp', icon: MessageSquare },
    { name: 'BagAChat Templates', href: '/dashboard/templates', icon: FileCode },
    { name: 'Reports & Export', href: '/dashboard/reports', icon: FileSpreadsheet },
    { name: 'System Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: ShieldAlert },
  ];

  return (
    <div className={darkMode ? 'dark bg-gray-900 text-gray-100 min-h-screen' : 'bg-gray-50 text-gray-900 min-h-screen'}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 dark:bg-gray-950 border-r border-gray-700 flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-700 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                MC
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight">Municipal Portal</h1>
                <p className="text-xs text-blue-400 font-medium">WhatsApp Automation</p>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs text-gray-400 font-medium">Log in as: <strong className="text-white">{user?.name || 'Admin'}</strong></span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900 text-blue-300 font-semibold">{user?.role || 'Super Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <header className="h-16 border-b border-gray-700 bg-gray-800/80 dark:bg-gray-900/80 backdrop-blur px-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{title}</h2>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
              </button>
            </div>
          </header>

          {/* Realtime Event Notifications Bar */}
          {notifications.length > 0 && (
            <div className="bg-blue-900/80 border-b border-blue-700 px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-200">
                <Bell className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                <span>{notifications[0]}</span>
              </div>
              <button onClick={() => setNotifications([])} className="text-xs text-blue-400 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
