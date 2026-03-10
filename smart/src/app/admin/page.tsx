'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Stat { label: string; value: string; sub: string; icon: string; color: string; }

const ADMIN_TOKEN = 'cbrixi-super-admin-token-2026';

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState(0);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    setAdminName(localStorage.getItem('adminName') ?? 'Admin');
    const token = localStorage.getItem('adminToken') ?? '';
    fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setProductCount(d.products?.length ?? 0))
      .catch(() => {});
  }, []);

  const stats: Stat[] = [
    { label: 'Total Products', value: String(productCount), sub: 'In the catalogue', icon: '📦', color: 'from-blue-500/20 to-blue-900/10 border-blue-500/20' },
    { label: 'Total Revenue', value: '$24,650', sub: 'Placeholder figure', icon: '💰', color: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/20' },
    { label: 'Happy Customers', value: '10,000+', sub: 'Across all regions', icon: '😊', color: 'from-purple-500/20 to-purple-900/10 border-purple-500/20' },
    { label: 'Active Sessions', value: '1', sub: 'You are logged in', icon: '🔒', color: 'from-orange-500/20 to-orange-900/10 border-orange-500/20' },
  ];

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <p className="text-white/40 text-sm uppercase tracking-widest mb-1">Welcome back,</p>
        <h1 className="text-4xl font-bold text-white">
          {adminName} <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-white/50 mt-1 text-sm">Here's what's happening at CBRIXI today.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className={`rounded-2xl p-6 border bg-gradient-to-br ${stat.color} relative overflow-hidden`}
          >
            <div className="text-3xl mb-3">{stat.icon}</div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-white font-medium text-sm">{stat.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
        <h2 className="text-white font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <Link href="/admin/products/new">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold cursor-pointer shadow-lg shadow-blue-500/20">
              <span className="text-2xl">＋</span>
              <div><p className="font-semibold">Add New Product</p><p className="text-white/70 text-xs font-normal">Create a product listing</p></div>
            </motion.div>
          </Link>
          <Link href="/admin/products">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl glass-card text-white font-semibold cursor-pointer border border-white/10 hover:border-blue-500/40 transition-colors">
              <span className="text-2xl">📋</span>
              <div><p className="font-semibold">Manage Products</p><p className="text-white/50 text-xs font-normal">View & delete listings</p></div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
