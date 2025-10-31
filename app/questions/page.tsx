// File: app/questions/page.tsx
'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'; // install @heroicons/react if needed

// Define the type for a single question
interface Question {
  id: string;
  question: string;
  answer: string;
  creator: string;
}
/*
 1. Pick question data format
 2. Make database
 3. 
*/

export default function QuestionsPage() {
  // Example initial data; in real use, you might fetch this from an API
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', question: 'What is Next.js?', answer: 'A React framework', creator: 'Alice' },
    { id: '2', question: 'What is TypeScript?', answer: 'A typed superset of JS', creator: 'Bob' },
  ]);

  // Handle deletion of a question
  const handleDelete = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Questions</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Question</th>
              <th className="px-4 py-2 text-left">Answer</th>
              <th className="px-4 py-2 text-left">Creator</th>
              <th className="px-4 py-2 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{q.question}</td>
                <td className="px-4 py-2">{q.answer}</td>
                <td className="px-4 py-2">{q.creator}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Delete question"
                  >
                    <XMarkIcon className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No questions available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
