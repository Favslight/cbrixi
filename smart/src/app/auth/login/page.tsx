"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "user" | "admin";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

    try {
      // 1. Try User Login
      const userRes = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const userData = await userRes.json();

      if (userRes.ok && userData.token) {
        localStorage.setItem("userToken", userData.token);
        // After login, we might want to fetch profile to get the name for the initial
        try {
            const profileRes = await fetch(`${API_URL}/user/profile`, {
                headers: { "Authorization": `Bearer ${userData.token}` }
            });
            if (profileRes.ok) {
                const profile = await profileRes.json();
                localStorage.setItem("userData", JSON.stringify(profile));
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
        
        // Redirect to landing page and reload to update Navbar
        window.location.href = "/"; 
        return;
      }

      // 2. Try Admin Login if user login fails
      const adminRes = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const adminData = await adminRes.json();

      if (adminRes.ok && adminData.token) {
        localStorage.setItem("adminToken", adminData.token);
        localStorage.setItem("adminName", adminData.admin?.email ?? "Admin");
        router.push("/admin");
        return;
      }

      // If both fail
      setError(userData.message || adminData.message || "Invalid credentials.");

    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-7 w-full max-w-md mx-auto p-8 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/50"
    >
      {/* Header */}
      <div className="text-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome Back to CBRIXI
          </h1>
          <p className="text-white/60 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">Sign up →</Link>
          </p>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
            Email Address
          </label>
          <input
            type="email" id="email" name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">Password</label>
          <input
            type="password" id="password" name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
            required
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center group cursor-pointer">
            <div className="relative flex items-center justify-center w-5 h-5 border border-white/20 rounded bg-white/5 group-hover:border-blue-400 transition-colors">
              <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleInputChange} className="peer sr-only" />
              <svg className="w-3 h-3 text-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Remember me</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</Link>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 glow-blue hover:shadow-lg hover:shadow-blue-500/30 transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Signing in…</>
          ) : "Login Account"}
        </motion.button>
      </form>

      {/* Social login */}
      <>
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-[#07070a] text-white/40">OR</span></div>
        </div>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white/90 transition-all group">
            <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <button className="w-full flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white/90 transition-all group">
            <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>
        </div>
      </>
    </motion.div>
  );
}
