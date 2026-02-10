"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface VerifyEmailFormProps {
  uuid: string;
  email: string;
  onBack: () => void;
}

export default function VerifyEmailForm({ uuid, email, onBack }: VerifyEmailFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, code }),
      });

      const data = await response.json();
      console.log('[VerifyEmailForm] API response:', data);
      console.log('[VerifyEmailForm] Response status:', response.status);
      console.log('[VerifyEmailForm] Response ok:', response.ok);
      console.log('[VerifyEmailForm] Data success:', data.success);
      console.log('[VerifyEmailForm] Data token:', data.token);

      if (response.ok && data.success && data.token) {
        console.log('[VerifyEmailForm] Setting auth with token:', data.token);
        // Set auth with token and redirect to dashboard
        setAuth(data.token, { id: uuid, username: email, email });
        console.log('[VerifyEmailForm] Auth set, redirecting to home');
        router.push("/");
        window.location.reload();
      } else {
        console.log('[VerifyEmailForm] Verification failed - response.ok:', response.ok, 'data.success:', data.success, 'data.token:', data.token);
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="bg-[#1A1B1F] p-6" style={{width: '571px', height: '448px'}}>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.5 3.5a.5.5 0 0 0-.5-.5H2a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 8 14H2a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 2 2h6a1.5 1.5 0 0 1 1.5 1.5v2a.5.5 0 0 1-1 0v-2z"/>
            <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">Verify Email</h1>
        <p className="text-sm text-gray-500">
          We've sent a 6-digit verification code to{" "}
          <span className="text-white">{email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-300 mb-3">Verification Code</label>
          <input
            type="text"
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-4 py-4 text-white text-center text-2xl font-mono tracking-widest"
            value={code}
            placeholder="000000"
            onChange={handleCodeChange}
            maxLength={6}
            required
            autoComplete="one-time-code"
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full text-black py-3 px-4 rounded-lg font-semibold disabled:opacity-50 mt-6 h-12 text-sm"
          style={{ backgroundColor: 'rgb(134, 217, 159)' }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Didn't receive the code?{" "}
          <button 
            type="button"
            className="hover:underline" 
            style={{ color: 'rgb(134, 217, 159)' }}
            onClick={() => {
              // TODO: Implement resend code functionality
              console.log('Resend code');
            }}
          >
            Resend
          </button>
        </p>
      </div>

      <div className="mt-8 text-center">
        <a className="text-gray-700 hover:underline cursor-pointer text-sm flex items-center justify-center gap-2">
          Terms of Service | Privacy Policy
        </a>
      </div>
    </div>
  );
}