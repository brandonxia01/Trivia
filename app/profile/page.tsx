"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.username) {
            setUser({ username: data.username });
            router.replace(`/profile/${data.username}`);
          }
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [router]);

  if (loading) return <div className="p-6 text-center">Checking session...</div>;
  if (user) return null; // redirecting, nothing to render

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Welcome to Your Profile</h1>

      {/* Tabs */}
      <div className="flex justify-center mb-6 gap-2">
        <button
          className={`px-4 py-2 rounded-t-lg ${
            tab === "login" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setTab("login")}>
          Login
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg ${
            tab === "signup" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setTab("signup")}>
          Sign Up
        </button>
      </div>

      {/* Login / Sign Up Form */}
      <div className="bg-white p-6 rounded-b-lg shadow border border-gray-200">
        {tab === "login" ? <LoginForm /> : <SignUpForm />}
      </div>
    </div>
  );
}

// Simple login form component
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Login failed.");
        return;
      }

      router.replace(`/profile/${data.username}`);
    } catch (err: any) {
      setMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      setMessage("Please enter your email to receive your password.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to send password email.");
        return;
      }

      setMessage("Password has been emailed to you. Check your inbox!");
    } catch (err: any) {
      setMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      <div>
        <label className="block mb-1 font-medium">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">
        {loading ? "Logging in..." : "Login"}
      </button>

      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={loading}
        className="w-full mt-2 text-blue-600 hover:underline text-sm">
        Forgot Password?
      </button>

      {message && <p className="mt-2 text-center text-red-600">{message}</p>}
    </form>
  );
}

// Simple sign up form component
function SignUpForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Sign up failed.");
        return;
      }

      router.replace(`/profile/${data.username}`);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
        Sign Up
      </button>
      {message && <p className="text-red-600 mt-2 text-center">{message}</p>}
    </form>
  );
}
