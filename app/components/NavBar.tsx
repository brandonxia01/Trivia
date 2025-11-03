"use client";

import { useState } from "react";

export default function HeaderNav() {
  const [username, setUsername] = useState<string | null>(null);

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
        <a href="/questions/suggested_edits" className="hover:text-blue-600">
          Suggested Edits
        </a>
      </div>

      {/* Right: auth buttons could go here */}
    </nav>
  );
}
