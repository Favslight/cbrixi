"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";
      const response = await fetch(`${API_URL}/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Unable to reset password. Please request a new link.");
        return;
      }

      setMessage(data.message || "Password reset successful.");
      setPassword("");
      setConfirmPassword("");
    } catch (resetError) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearFeedback = () => {
    setError("");
    setMessage("");
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
          Reset Password
        </h1>
        <p className="text-white/60 text-sm">
          Choose a new password with at least 8 characters.
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
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFeedback();
              }}
              placeholder="Enter your new password"
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M10.73 5.08A10.88 10.88 0 0112 5c5.52 0 9 5.5 9 7a7.5 7.5 0 01-2.06 2.8M6.61 6.61C4.39 8.02 3 10.69 3 12c0 1.5 3.48 7 9 7 1.5 0 2.84-.41 4-1.03" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.88 9.88A3 3 0 0012 15a2.98 2.98 0 002.12-.88M14.12 9.88A2.98 2.98 0 0012 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 12c0-1.5 3.48-7 9-7s9 5.5 9 7-3.48 7-9 7-9-5.5-9-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearFeedback();
            }}
            placeholder="Confirm your new password"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
            required
            minLength={8}
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
              Resetting...
            </>
          ) : "Reset Password"}
        </motion.button>
      </form>
    </motion.div>
  );
}
