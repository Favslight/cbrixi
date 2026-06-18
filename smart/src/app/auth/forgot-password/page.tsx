"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";
      const response = await fetch(`${API_URL}/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Unable to send reset instructions. Please try again.");
        return;
      }

      setMessage(data.message || "If the email exists, password reset instructions have been sent.");
    } catch (forgotError) {
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
      <div className="flex justify-start">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <span aria-hidden="true">&lt;-</span>
          Back to Sign In
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Forgot Password
        </h1>
        <p className="text-white/60 text-sm">
          Enter your email and we will send password reset instructions.
        </p>
      </div>

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
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm text-center"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setMessage("");
            }}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 glow-blue hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Sending...
            </>
          ) : "Send Reset Link"}
        </motion.button>
      </form>
    </motion.div>
  );
}
