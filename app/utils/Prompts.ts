

export const prompt = (basePrompt?: string) => `
Generate a Bible trivia question as a JSON object that exactly matches the following TypeScript interface:

export interface Question {
  id: number;
  question: string;
  answer: string;
  verse_references: string[];
  difficulty: number;
}

Guidelines:
- Make the question clear, factual, and rooted in the Bible (not opinion-based).
- 'answer' must be the exact, correct answer.
- 'verse_references' should list relevant verses (e.g., ["John 3:16"]).
- 'difficulty' must be a number between 1–10, where:
    1 = very easy (e.g., well-known facts like "Who built the ark?")
    10 = extremely hard (e.g., rare details, obscure names, or cross-references)
- Return only valid JSON, no explanation or markdown.

${
  basePrompt
    ? `Base prompt: "${basePrompt}". Polish or expand on this idea to produce a well-formed Bible trivia question.`
    : `If no base prompt is provided, create a completely random, interesting Bible trivia question.`
}
`;
