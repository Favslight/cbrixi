"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../../../components/Navbar";
import ReferralsDashboard from "./ReferralsDashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";
const CONFIRM_DELETE_TEXT = "DELETE";
const USER_SESSION_KEYS = [
  "userToken",
  "userData",
  "cart",
  "cartItems",
  "orders",
  "notifications",
  "receipts",
  "favoriteProducts",
];

interface UserProfile {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
  });
  const [success, setSuccess] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const clearUserSession = () => {
    USER_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  };

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const res = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        const user = data.user ?? data;
        setProfile(user);
        setFormData(user);
        localStorage.setItem("userData", JSON.stringify(user));
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch {
      setError("Connection error");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile().catch(() => undefined);
  }, [fetchProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        const user = data.user ?? data;
        setProfile(user);
        localStorage.setItem("userData", JSON.stringify(user));
        setSuccess("Profile updated successfully.");
        setIsEditing(false);
      } else {
        setError(data.message || "Update failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("userToken");
      await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      console.error("Logout error");
    } finally {
      clearUserSession();
      window.location.href = "/";
    }
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteConfirmation("");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim() !== CONFIRM_DELETE_TEXT || deleteLoading) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      clearUserSession();
      window.location.href = "/auth/login";
      return;
    }

    setDeleteLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/user/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          clearUserSession();
          window.location.href = "/auth/login";
          return;
        }
        throw new Error(data?.message || "Unable to delete account");
      }

      clearUserSession();
      window.location.href = "/";
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-28 px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
              {profile?.firstname?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {profile?.firstname} {profile?.lastname}
              </h1>
              <p className="text-white/40">@{profile?.username}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/orders"
                className="px-5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 transition-all font-medium border border-blue-500/20"
              >
                View Orders
              </Link>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-medium border border-white/10"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all font-medium border border-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="First Name" disabled={!isEditing} value={formData.firstname} onChange={(firstname) => setFormData({ ...formData, firstname })} />
            <ProfileField label="Last Name" disabled={!isEditing} value={formData.lastname} onChange={(lastname) => setFormData({ ...formData, lastname })} />
            <ProfileField label="Username" disabled={!isEditing} value={formData.username} onChange={(username) => setFormData({ ...formData, username })} />
            <ProfileField label="Email Address" type="email" disabled={!isEditing} value={formData.email} onChange={(email) => setFormData({ ...formData, email })} />

            {isEditing && (
              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70"
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>

          {/* Referrals Section */}
          <ReferralsDashboard />

          <section className="mt-10 border-t border-red-500/20 pt-8">
            <div className="flex flex-col gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-red-200">Delete account</h2>
                <p className="mt-1 text-sm leading-6 text-white/60">
                  Permanently delete your account and related account data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setDeleteModalOpen(true);
                }}
                className="rounded-xl border border-red-400/30 bg-red-500/20 px-5 py-3 text-sm font-bold text-red-200 transition-all hover:bg-red-500/30"
              >
                Delete account
              </button>
            </div>
          </section>

        </motion.div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#101522] p-6 shadow-2xl shadow-black/40">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-2xl text-red-200">
              !
            </div>
            <h2 className="text-2xl font-bold text-white">Delete account</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              This will permanently delete your account and related account data. This action cannot be undone.
            </p>
            <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-white/45">
              Type DELETE to continue
            </label>
            <input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              disabled={deleteLoading}
              placeholder="DELETE"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-red-500/40 disabled:opacity-60"
            />
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmation.trim() !== CONFIRM_DELETE_TEXT}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
      />
    </div>
  );
}
