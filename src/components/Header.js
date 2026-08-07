import React from 'react';
import Link from 'next/link';
import { Shield, Smartphone, UserCheck, LayoutDashboard } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-400">
                  GovService Portal
                </span>
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-400">
                  Citizen Request Platform
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Admin MIS Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp Active</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
