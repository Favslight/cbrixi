"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { motion } from "framer-motion";

interface UserProfile {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
  });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';
      const res = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData(data);
        localStorage.setItem("userData", JSON.stringify(data));
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("userToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';
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
        setProfile(data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      } else {
        setError(data.message || "Update failed");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';
      await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      window.location.href = "/";
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-32 px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
              {profile?.firstname?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {profile?.firstname} {profile?.lastname}
              </h1>
              <p className="text-white/40">@{profile?.username}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-medium border border-white/10"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all font-medium border border-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">First Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Last Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Username</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
              <input
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
              />
            </div>

            {isEditing && (
              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </main>
  );
}
