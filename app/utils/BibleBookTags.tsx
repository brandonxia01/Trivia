"use client";

import React from "react";

// Define categories and the corresponding books
export const bibleBookTags: { label: string; books: string[] }[] = [
  {
    label: "OT",
    books: [
      "Genesis",
      "Exodus",
      "Leviticus",
      "Numbers",
      "Deuteronomy",
      "Joshua",
      "Judges",
      "Ruth",
      "1 Samuel",
      "2 Samuel",
      "1 Kings",
      "2 Kings",
      "1 Chronicles",
      "2 Chronicles",
      "Ezra",
      "Nehemiah",
      "Esther",
      "Job",
      "Psalms",
      "Proverbs",
      "Ecclesiastes",
      "Song of Solomon",
      "Isaiah",
      "Jeremiah",
      "Lamentations",
      "Ezekiel",
      "Daniel",
      "Hosea",
      "Joel",
      "Amos",
      "Obadiah",
      "Jonah",
      "Micah",
      "Nahum",
      "Habakkuk",
      "Zephaniah",
      "Haggai",
      "Zechariah",
      "Malachi",
    ],
  },
  {
    label: "NT",
    books: [
      "Matthew",
      "Mark",
      "Luke",
      "John",
      "Acts",
      "Romans",
      "1 Corinthians",
      "2 Corinthians",
      "Galatians",
      "Ephesians",
      "Philippians",
      "Colossians",
      "1 Thessalonians",
      "2 Thessalonians",
      "1 Timothy",
      "2 Timothy",
      "Titus",
      "Philemon",
      "Hebrews",
      "James",
      "1 Peter",
      "2 Peter",
      "1 John",
      "2 John",
      "3 John",
      "Jude",
      "Revelation",
    ],
  },
  {
    label: "Gospels",
    books: ["Matthew", "Mark", "Luke", "John"],
  },
  {
    label: "Acts",
    books: ["Acts"],
  },
  {
    label: "Epistles",
    books: [
      "Romans",
      "1 Corinthians",
      "2 Corinthians",
      "Galatians",
      "Ephesians",
      "Philippians",
      "Colossians",
      "1 Thessalonians",
      "2 Thessalonians",
      "1 Timothy",
      "2 Timothy",
      "Titus",
      "Philemon",
      "Hebrews",
      "James",
      "1 Peter",
      "2 Peter",
      "1 John",
      "2 John",
      "3 John",
      "Jude",
    ],
  },
  {
    label: "Histories",
    books: [
      "Joshua",
      "Judges",
      "Ruth",
      "1 Samuel",
      "2 Samuel",
      "1 Kings",
      "2 Kings",
      "1 Chronicles",
      "2 Chronicles",
      "Ezra",
      "Nehemiah",
      "Esther",
    ],
  },
  {
    label: "Poetries",
    books: ["Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"],
  },
  {
    label: "Prophets",
    books: [
      "Isaiah",
      "Jeremiah",
      "Lamentations",
      "Ezekiel",
      "Daniel",
      "Hosea",
      "Joel",
      "Amos",
      "Obadiah",
      "Jonah",
      "Micah",
      "Nahum",
      "Habakkuk",
      "Zephaniah",
      "Haggai",
      "Zechariah",
      "Malachi",
    ],
  },
];

export default function BibleBookTags() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Bible Book Tags</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bibleBookTags.map((tag) => (
          <div
            key={tag.label}
            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-center cursor-pointer hover:bg-blue-200 transition">
            {tag.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optional: export a helper function to map a tag label to its books
export const getBooksForTag = (tagLabel: string) => {
  const tag = bibleBookTags.find((t) => t.label === tagLabel);
  return tag ? tag.books : [];
};
