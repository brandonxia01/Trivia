export const prompt = (basePrompt?: string) => `
Generate a single Bible trivia question as valid JSON that matches this TypeScript interface:

export interface Question {
  id: number;
  question: string;
  answer: string;
  verse_references: string[];
  difficulty: number;
}

Requirements:
- The question must be factual and based on the Bible.
- 'answer' must be exact and correct.
- 'verse_references' must list the relevant Bible verses (e.g., ["John 3:16"]).
- 'difficulty' must be a number from 1 (very easy) to 10 (extremely hard), reflecting obscurity and complexity.
- Do not include explanations, markdown, or extra text. Return only JSON.
- Do not include Bible verses in the question text unless absolutely necessary for clarity.

${
  basePrompt
    ? `Use this idea as a starting point: "${basePrompt}". Generate a question in JSON using the rules above.`
    : `Generate a completely new Bible trivia question in JSON using the rules above.`
}
`;
