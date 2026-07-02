"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../../../components/Navbar";
import ReferralsDashboard from "./ReferralsDashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

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
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      window.location.href = "/";
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

        </motion.div>
      </div>
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
