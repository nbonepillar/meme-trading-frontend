"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import metamaskIcon from "@/assets/metamask.webp";

import VerifyEmailForm from "./VerifyEmailForm";

export default function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State for verification step
  const [showVerification, setShowVerification] = useState(false);
  const [uuid, setUuid] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('[SignupForm] API response:', data);

      if (response.ok && data.success && data.uuid) {
        // Store uuid and show verification form
        setUuid(data.uuid);
        setShowVerification(true);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignup = () => {
    setShowVerification(false);
    setUuid("");
    setError("");
  };

  // Show verification form if signup was successful
  if (showVerification && uuid) {
    return (
      <VerifyEmailForm 
        uuid={uuid} 
        email={email} 
        onBack={handleBackToSignup}
      />
    );
  }

  return (
    <div className="bg-[#1A1B1F] p-6" style={{width: '571px', height: '448px'}}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Sign Up</h1>
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="hover:underline" style={{ color: 'rgb(134, 217, 159)' }}>
            Log in
          </a>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Email</label>
          <input
            type="email"
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-3 py-3 text-white text-sm"
            value={email}
            placeholder="Enter Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Password</label>
          <input
            type="password"
            className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-3 py-3 text-white text-sm"
            value={password}
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full text-black py-3 px-4 rounded-lg font-semibold disabled:opacity-50 mt-6 h-12 text-sm"
          style={{ backgroundColor: 'rgb(134, 217, 159)' }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2a2a2a]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#1A1B1F] text-gray-400">OR Sign Up</span>
        </div>
      </div>

      <div className="flex justify-center gap-6 mb-6">
        <div className="flex flex-col items-center gap-2">
          <button 
            type="button" 
            className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full h-14 w-14 transition-colors"
            onClick={() => console.log('Telegram signup')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="#58a6de">
              <path d="m15.8588 2.5472-2.4005 11.3159.001-.0011c-.1797.8005-.6531.996-1.323.6208l-3.6577-2.6942-1.763 1.6982c-.1954.1965-.3595.3595-.7347.3595l.2613-3.7235 6.7761-6.123c.2937-.2612-.0658-.4085-.4577-.1473L4.1835 9.127.5749 8.0003c-.7838-.2445-.8005-.7837.163-1.159L14.8461 1.404c.6532-.2446 1.2248.1473 1.0127 1.1432"></path>
            </svg>
          </button>
          <p className="text-gray-400 text-sm">Telegram</p>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <button 
            type="button" 
            className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full h-14 w-14 transition-colors"
            onClick={() => console.log('Phantom signup')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="#9886e5">
              <path fillRule="evenodd" d="M3.1879 5.8755C6.6427 2.091 10.5414.3133 13.8364 1.7977s2.131 6.9456 1.0275 8.7596c-1.1035 1.8139-2.1646 2.5479-3.0768 2.4158-.8945-.1296-.923-.8714-.7993-1.381-.4683.759-1.8494 2.2574-3.3562 2.2574-1.3547 0-1.6986-1.5145-1.2222-2.2574-1.235 1.6762-2.8696 3.3886-4.9657 3.1008-2.4595-.3377-1.7106-5.0327 1.7442-8.8174m7.1673-1.0368c-.5467.0001-.9901.5031-.9902 1.1235s.4435 1.1234.9902 1.1235.99-.503.9901-1.1235c-.0001-.6205-.4434-1.1235-.9901-1.1235m2.7369 0c-.5468 0-.9901.503-.9901 1.1235s.4433 1.1235.9901 1.1235.99-.503.9901-1.1235-.4434-1.1234-.9901-1.1235" clipRule="evenodd"></path>
            </svg>
          </button>
          <p className="text-gray-400 text-sm">Phantom</p>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <button 
            type="button" 
            className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full h-14 w-14 transition-colors"
            onClick={() => console.log('MetaMask signup')}
          >
            <img src={metamaskIcon.src} className="block object-contain shrink-0" width="24" height="24" alt="MetaMask" />
          </button>
          <p className="text-gray-400 text-sm">MetaMask</p>
        </div>
      </div>

      <div className="text-center">
        <a className="text-gray-700 hover:underline cursor-pointer text-sm flex items-center justify-center gap-2">
          Terms of Service | Privacy Policy
        </a>
      </div>
    </div>
  );
}