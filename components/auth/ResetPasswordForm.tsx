"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

interface ResetPasswordFormProps {
  onClose?: () => void;
}

export default function ResetPasswordForm({ onClose }: ResetPasswordFormProps) {
  const user = useAuthStore((state) => state.user);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/resetpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          oldpassword: oldPassword,
          newpassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        setError(data.error || "Password reset failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1A1B1F] p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Change Password</h1>
        <p className="text-gray-400">Update your account password</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Current Password
          </label>
          <input
            id="oldPassword"
            type="password"
            value={oldPassword}
            placeholder="Enter current password"
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            placeholder="Enter new password"
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            placeholder="Confirm new password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 text-black font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'rgb(134, 217, 159)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(120, 200, 145)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(134, 217, 159)'}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#282A2E] hover:bg-[#3a3c40] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
