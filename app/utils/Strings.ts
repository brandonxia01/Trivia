// Strings.ts
import stringSimilarity from "string-similarity";

/**
 * Checks if two strings are "similar enough" based on a threshold.
 * Normalizes the strings before comparing:
 * - lowercase
 * - removes punctuation
 * - removes common filler words like "the", "a", "an", "years"
 *
 * @param userInput - The string entered by the user
 * @param correctAnswer - The expected correct answer
 * @param threshold - Similarity threshold between 0 and 1 (default 0.8)
 * @returns true if the strings are similar enough
 */
export function isSimilarAnswer(userInput: string, correctAnswer: string, threshold: number = 0.7): boolean {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // remove punctuation
      .replace(/\b(years?|the|a|an|old)\b/g, "") // remove common filler words
      .trim();

  const normalizedUser = normalize(userInput);
  const normalizedCorrect = normalize(correctAnswer);

  const similarity = stringSimilarity.compareTwoStrings(normalizedUser, normalizedCorrect);
  return similarity >= threshold;
}
