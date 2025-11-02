"use client";

import { useEffect, useState } from "react";

export default function HeaderNav() {
  const [username, setUsername] = useState<string | null>(null);

  // Fetch user session info
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me"); // We'll create this API to get current user
        if (!res.ok) {
          setUsername(null);
          return;
        }
        const data = await res.json();
        setUsername(data.username);
      } catch {
        setUsername(null);
      }
    }

    fetchSession();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsername(null);
    window.location.reload();
  };

  return (
    <nav className="bg-gray-100 border-b border-gray-300 p-4 flex justify-between items-center">
      {/* Left: site title / logo */}
      <div className="text-xl font-bold">Trivia App</div>

      {/* Center: nav tabs */}
      <div className="flex space-x-4">
        <a href="/" className="hover:text-blue-600">
          Play
        </a>
        <a href="/questions" className="hover:text-blue-600">
          Questions
        </a>
        <a href="/questions/create" className="hover:text-blue-600">
          Create New Question
        </a>
      </div>

      {/* Right: login / user */}
      <div>
        {username ? (
          <div className="flex items-center space-x-4">
            <a href={`/profile/${username}`} className="font-medium text-blue-600 hover:underline">
              {username}
            </a>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <a href="/profile" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
              Profile
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
