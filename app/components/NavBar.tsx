export default function HeaderNav() {
  return (
    <nav className="bg-gray-100 border-b border-gray-300 p-4 flex justify-between items-center">
      {/* Left: site title / logo */}
      <a href="/" className="text-xl font-bold hover:text-blue-600">
        Trivia App
      </a>

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
