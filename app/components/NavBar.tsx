"use client";

import { useState, useEffect, useRef } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function HeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Site title / logo */}
          <a href="/" className="flex items-center space-x-3">
            <img src="/favicon.png" alt="Bible Trivia Logo" className="h-14 w-14" />
            <span className="text-2xl font-extrabold text-gray-900 hover:text-blue-600 transition-colors duration-200">
              Bible Trivia
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
              Play
            </a>
            <a
              href="/questions"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
              Questions
            </a>
            <a
              href="/questions/create"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
              Create
            </a>
            <a
              href="/questions/suggested_edits"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
              Suggested Edits
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none">
              {menuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed top-16 right-4 w-52 rounded-2xl border border-white/20 bg-gradient-to-br from-white/80 to-white/100 backdrop-blur-xl
                     shadow-xl ring-1 ring-white/30 flex flex-col space-y-2 p-4 animate-slideDown z-50">
          <a
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-900 hover:text-blue-600 font-semibold transition-colors duration-200 text-right">
            Play
          </a>
          <a
            href="/questions"
            onClick={() => setMenuOpen(false)}
            className="text-gray-900 hover:text-blue-600 font-semibold transition-colors duration-200 text-right">
            Questions
          </a>
          <a
            href="/questions/create"
            onClick={() => setMenuOpen(false)}
            className="text-gray-900 hover:text-blue-600 font-semibold transition-colors duration-200 text-right">
            Create
          </a>
          <a
            href="/questions/suggested_edits"
            onClick={() => setMenuOpen(false)}
            className="text-gray-900 hover:text-blue-600 font-semibold transition-colors duration-200 text-right">
            Suggested Edits
          </a>
        </div>
      )}
    </nav>
  );
}
