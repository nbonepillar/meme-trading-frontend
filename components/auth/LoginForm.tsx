"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import metamaskIcon from "@/assets/metamask.webp";

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate QR code URL when component mounts
  useEffect(() => {
    generateQRCodeUrl();
  }, []);

  const generateQRCodeUrl = () => {
    // Generate a unique login token or URL
    const loginData = `${window.location.origin}/login?token=${Date.now()}&ref=qr`;
    
    // Use QR Server API to generate QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(loginData)}`;
    setQrCodeUrl(qrUrl);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // First step: show password field if email is entered but password field is not shown
    if (!showPassword && email.trim()) {
      setShowPassword(true);
      return;
    }

    // Second step: submit login request if both email and password are provided
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('[LoginForm] Response status:', response.status);
      console.log('[LoginForm] Response ok:', response.ok);
      console.log('[LoginForm] Response data:', data);

      if (response.ok && data.success) {
        // API route already extracts token and user
        const token = data.token;
        const user = data.user || { id: '1', email: email, username: email };
        
        console.log('[LoginForm] Extracted token:', token);
        console.log('[LoginForm] Extracted user:', user);
        
        if (token) {
          setAuth(token, user);
          router.push("/");
          window.location.reload();
        } else {
          setError("Invalid response format");
        }
      } else {
        console.log('[LoginForm] Login failed - response.ok:', response.ok, 'data.success:', data.success);
        setError(data.error || data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex bg-[#1A1B1F] transition-all duration-300 ease-in-out" 
      style={{
        width: '670px', 
        height: showPassword ? '590px' : '497px' // Expand height when password field is shown
      }}
    >
      {/* Left side - Login Form */}
      <div className="flex-1 p-6" style={{ borderRight: '1px solid rgb(39, 40, 46)' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Log In</h1>
          <p className="text-sm text-gray-500">
            Don&apos;t have an account yet?{" "}
            <a href="/signup" className="hover:underline" style={{ color: 'rgb(134, 217, 159)' }}>
              Sign up
            </a>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          {/* Password field - only show after email is entered and login button is clicked */}
          {showPassword && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-[#282A2E] border border-[#2a2a2a] rounded-lg px-3 py-3 text-white text-sm"
                value={password}
                placeholder="Enter Password"
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-black py-3 px-4 rounded-lg font-semibold disabled:opacity-50 mt-6 h-12 text-sm"
            style={{ backgroundColor: 'rgb(134, 217, 159)' }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a2a]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1A1B1F] text-gray-400">OR</span>
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-6">
          <div className="flex flex-col items-center gap-2">
            <button 
              type="button" 
              className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full h-14 w-14 transition-colors"
              onClick={() => console.log('Telegram login')}
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
              onClick={() => console.log('Phantom login')}
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
              onClick={() => console.log('MetaMask login')}
            >
              <img src={metamaskIcon.src} className="block object-contain shrink-0" width="24" height="24" alt="MetaMask" />
            </button>
            <p className="text-gray-400 text-sm">MetaMask</p>
          </div>
        </div>

        <div className="text-center">
          <a className="text-gray-400 hover:underline cursor-pointer text-sm flex items-center justify-center gap-2">
            Connect with extension wallet 
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.8924 1.3671a.7004.7004 0 0 0-.9902 0 .7003.7003 0 0 0 0 .9902l4.9424 4.9424H1.2294A.7005.7005 0 0 0 .5292 8c0 .3866.3135.7002.7001.7002h11.6153l-4.9424 4.9424a.7003.7003 0 0 0 .9902.9902l6.1377-6.1376a.7004.7004 0 0 0 0-.9903z"></path>
            </svg>
          </a>
        </div>
        <div className="text-center">
          <a className="text-gray-700 hover:underline cursor-pointer text-sm flex items-center justify-center gap-2 mt-2">
            Terms of Service | Privacy Policy
          </a>
        </div>
      </div>

      {/* Right side - QR Code */}
      <div className="w-[280px] flex flex-col justify-center items-center p-6">
        <div className="flex flex-col items-center">
          <div className="rounded-lg bg-white relative p-2" style={{width: '160px', height: '160px'}}>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl}
                alt="QR Code for Login"
                className="w-full h-full object-contain"
                onError={() => {
                  // Fallback if QR service fails
                  console.error('Failed to load QR code');
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-gray-400 text-sm leading-5">
              Please scan the QR code using the{" "}
              <a style={{ color: 'rgb(134, 217, 159)' }} href="/app">latest version of the app</a>{" "}
              to log in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}