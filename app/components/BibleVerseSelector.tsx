"use client";

import { useState } from "react";

const bibleChapters: Record<string, number> = {
  Genesis: 50,
  Exodus: 40,
  Leviticus: 27,
  Numbers: 36,
  Deuteronomy: 34,
  Joshua: 24,
  Judges: 21,
  Ruth: 4,
  "1 Samuel": 31,
  "2 Samuel": 24,
  "1 Kings": 22,
  "2 Kings": 25,
  "1 Chronicles": 29,
  "2 Chronicles": 36,
  Ezra: 10,
  Nehemiah: 13,
  Esther: 10,
  Job: 42,
  Psalms: 150,
  Proverbs: 31,
  Ecclesiastes: 12,
  "Song of Solomon": 8,
  Isaiah: 66,
  Jeremiah: 52,
  Lamentations: 5,
  Ezekiel: 48,
  Daniel: 12,
  Hosea: 14,
  Joel: 3,
  Amos: 9,
  Obadiah: 1,
  Jonah: 4,
  Micah: 7,
  Nahum: 3,
  Habakkuk: 3,
  Zephaniah: 3,
  Haggai: 2,
  Zechariah: 14,
  Malachi: 4,
  Matthew: 28,
  Mark: 16,
  Luke: 24,
  John: 21,
  Acts: 28,
  Romans: 16,
  "1 Corinthians": 16,
  "2 Corinthians": 13,
  Galatians: 6,
  Ephesians: 6,
  Philippians: 4,
  Colossians: 4,
  "1 Thessalonians": 5,
  "2 Thessalonians": 3,
  "1 Timothy": 6,
  "2 Timothy": 4,
  Titus: 3,
  Philemon: 1,
  Hebrews: 13,
  James: 5,
  "1 Peter": 5,
  "2 Peter": 3,
  "1 John": 5,
  "2 John": 1,
  "3 John": 1,
  Jude: 1,
  Revelation: 22,
};

interface BibleVerseSelectorProps {
  onChange: (verses: string[]) => void;
  selectedVerses: string[];
}

export default function BibleVerseSelector({ onChange, selectedVerses }: BibleVerseSelectorProps) {
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState<number | "">("");
  const [verseStart, setVerseStart] = useState<number | "">("");
  const [verseEnd, setVerseEnd] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const validateChapter = (book: string, chapter: number): string | null => {
    const max = bibleChapters[book];
    if (!max) return `Unknown book: ${book}`;
    if (chapter < 1 || chapter > max) return `${book} only has ${max} chapters.`;
    return null;
  };

  const handleAddVerse = () => {
    if (!book || !chapter || !verseStart) return;

    const err = validateChapter(book, Number(chapter));
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    const verseRef =
      verseEnd && verseEnd !== verseStart
        ? `${book} ${chapter}:${verseStart}-${verseEnd}`
        : `${book} ${chapter}:${verseStart}`;

    if (!selectedVerses.includes(verseRef)) {
      onChange([...selectedVerses, verseRef]);
    }

    // reset inputs
    setBook("");
    setChapter("");
    setVerseStart("");
    setVerseEnd("");
  };

  const removeVerse = (ref: string) => {
    onChange(selectedVerses.filter((v) => v !== ref));
  };

  const maxChapter = book ? bibleChapters[book] : null;

  return (
    <div className="space-y-3">
      <label className="block font-medium text-gray-800">Bible Verse References</label>

      <div className="flex flex-col md:flex-row md:items-center gap-2">
        {/* Book Selector */}
        <select
          value={book}
          onChange={(e) => {
            setBook(e.target.value);
            setChapter("");
            setError(null);
          }}
          className="border border-gray-300 rounded-lg px-2 py-2 flex-1 focus:ring-2 focus:ring-blue-500">
          <option value="">Select Book</option>
          {Object.keys(bibleChapters).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Chapter */}
        <input
          type="number"
          min={1}
          max={maxChapter ?? undefined}
          value={chapter}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : "";
            if (book && val) {
              const err = validateChapter(book, val);
              setError(err);
            }
            setChapter(val);
          }}
          placeholder={maxChapter ? `1-${maxChapter}` : "Chapter"}
          className={`border rounded-lg px-3 py-2 w-24 focus:ring-2 ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
          }`}
        />

        {/* Verse Start */}
        <input
          type="number"
          min={1}
          value={verseStart}
          onChange={(e) => setVerseStart(e.target.value ? Number(e.target.value) : "")}
          placeholder="Start"
          className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-blue-500"
        />

        {/* Verse End (optional) */}
        <input
          type="number"
          min={1}
          value={verseEnd}
          onChange={(e) => setVerseEnd(e.target.value ? Number(e.target.value) : "")}
          placeholder="End (opt.)"
          className="border border-gray-300 rounded-lg px-3 py-2 w-28 focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={handleAddVerse}
          className={`rounded-lg px-4 py-2 text-white transition ${
            error ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={!!error}>
          Add
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}

      {/* Display selected verses */}
      {selectedVerses.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedVerses.map((v) => (
            <span
              key={v}
              onClick={() => removeVerse(v)}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition"
              title="Click to remove">
              {v} ✕
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
