export default function HeaderNav() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Site title / logo */}
          <a
            href="/"
            className="text-2xl font-extrabold text-gray-900 hover:text-blue-600 transition-colors duration-200">
            Bible Trivia
          </a>

          {/* Center / Right: Nav links */}
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

          {/* Mobile menu button */}
          <div className="md:hidden">{/* You can later add a hamburger menu icon here */}</div>
        </div>
      </div>
    </nav>
  );
}
