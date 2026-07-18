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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';
    fetch(`${API_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return { products: [] };
        return r.json();
      })
      .then((d) => setProductCount(Array.isArray(d.products) ? d.products.length : 0))
      .catch(() => setProductCount(0));
  }, []);

  const stats: Stat[] = [
    { label: 'Total Products', value: String(productCount), sub: 'In the catalogue', icon: '📦', color: 'from-blue-500/20 to-blue-900/10 border-blue-500/20' },
    { label: 'Total Revenue', value: '₦24,650', sub: 'Placeholder figure', icon: '💰', color: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/20' },
    { label: 'Happy Customers', value: '10,000+', sub: 'Across all regions', icon: '😊', color: 'from-purple-500/20 to-purple-900/10 border-purple-500/20' },
    { label: 'Active Sessions', value: '1', sub: 'You are logged in', icon: '🔒', color: 'from-orange-500/20 to-orange-900/10 border-orange-500/20' },
  ];

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <p className="text-white/40 text-sm uppercase tracking-widest mb-1">Welcome back,</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-white break-words">
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
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1 tabular-nums break-all sm:break-normal">{stat.value}</p>
            <p className="text-white font-medium text-sm">{stat.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
        <h2 className="text-white font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <Link href="/admin/products/new">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold cursor-pointer shadow-lg shadow-blue-500/20 min-w-0">
              <span className="text-2xl shrink-0">＋</span>
              <div className="min-w-0"><p className="font-semibold text-sm sm:text-base">Add New Product</p><p className="text-white/70 text-xs font-normal">Create a product listing</p></div>
            </motion.div>
          </Link>
          <Link href="/admin/products">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 rounded-2xl glass-card text-white font-semibold cursor-pointer border border-white/10 hover:border-blue-500/40 transition-colors min-w-0">
              <span className="text-2xl shrink-0">📋</span>
              <div className="min-w-0"><p className="font-semibold text-sm sm:text-base">Manage Products</p><p className="text-white/50 text-xs font-normal">View &amp; delete listings</p></div>
            </motion.div>
          </Link>
          <Link href="/admin/users">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 rounded-2xl glass-card text-white font-semibold cursor-pointer border border-white/10 hover:border-purple-500/40 transition-colors min-w-0">
              <span className="text-2xl shrink-0">👥</span>
              <div className="min-w-0"><p className="font-semibold text-sm sm:text-base">View Users</p><p className="text-white/50 text-xs font-normal">Orders &amp; instalment details</p></div>
            </motion.div>
          </Link>
          <Link href="/admin/payments">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 rounded-2xl glass-card text-white font-semibold cursor-pointer border border-white/10 hover:border-yellow-500/40 transition-colors min-w-0">
              <span className="text-2xl shrink-0">⏳</span>
              <div className="min-w-0"><p className="font-semibold text-sm sm:text-base">Pending Payments</p><p className="text-white/50 text-xs font-normal">Approve bank transfers</p></div>
            </motion.div>
          </Link>
          <Link href="/admin/receipts">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 rounded-2xl glass-card text-white font-semibold cursor-pointer border border-white/10 hover:border-emerald-500/40 transition-colors min-w-0">
              <span className="text-2xl shrink-0">🧾</span>
              <div className="min-w-0"><p className="font-semibold text-sm sm:text-base">Receipts</p><p className="text-white/50 text-xs font-normal">View, print, and resend PDFs</p></div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
