import { queryDb } from "../DbHelpers";

export interface MultipleChoiceAnswer {
  options: string[];
  correct: string;
}

export interface Question {
  id: number;
  question: string;
  answer: string;
  multiple_choice_answers: MultipleChoiceAnswer[];
  verse_references: string[];
  difficulty: number;
  attempts: number;
  correct_attempts: number;
  upvotes: number;
  downvotes: number;
  verified: boolean;
  embedding?: number[]; // <-- embedding field
}

export function mapQuestion(row: any): Question {
  return {
    id: row.id ?? 0,
    question: row.question ?? "",
    answer: row.answer ?? "",
    multiple_choice_answers: (row.multiple_choice_answers ?? []).map((item: any) => ({
      options: item.options ?? [],
      correct: item.correct ?? "",
    })),
    verse_references: row.verse_references ?? [],
    difficulty: row.difficulty ?? 1,
    attempts: row.attempts ?? 0,
    correct_attempts: row.correct_attempts ?? 0,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
    verified: row.verified ?? false,
    embedding: row.embedding ?? undefined, // <-- include embedding
  };
}

export async function listQuestions(): Promise<Question[]> {
  const response = await queryDb(`SELECT * FROM trivia_questions ORDER BY id ASC`);
  return response.map((row) => mapQuestion(row));
}

export async function insertQuestion(question: Question): Promise<Question> {
  const query = `
    INSERT INTO trivia_questions
      (question, answer, multiple_choice_answers, verse_references, difficulty, attempts, correct_attempts, upvotes, downvotes, verified, embedding)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;

  const values = [
    question.question,
    question.answer,
    JSON.stringify(question.multiple_choice_answers),
    JSON.stringify(question.verse_references),
    question.difficulty,
    question.attempts ?? 0,
    question.correct_attempts ?? 0,
    question.upvotes ?? 0,
    question.downvotes ?? 0,
    question.verified ?? false,
    question.embedding ? `[${question.embedding.join(",")}]` : null, // vector literal
  ];

  const response = await queryDb(query, values);
  return mapQuestion(response[0]);
}

export async function updateQuestion(question: Question): Promise<Question> {
  const query = `
    UPDATE trivia_questions
    SET 
      question = $1,
      answer = $2,
      multiple_choice_answers = $3,
      verse_references = $4,
      difficulty = $5,
      attempts = $6,
      correct_attempts = $7,
      upvotes = $8,
      downvotes = $9,
      verified = $10,
      embedding = $11
    WHERE id = $12
    RETURNING *;
  `;

  const values = [
    question.question,
    question.answer,
    JSON.stringify(question.multiple_choice_answers),
    JSON.stringify(question.verse_references),
    question.difficulty,
    question.attempts ?? 0,
    question.correct_attempts ?? 0,
    question.upvotes ?? 0,
    question.downvotes ?? 0,
    question.verified ?? false,
    question.embedding ? `[${question.embedding.join(",")}]` : null, // vector literal
    question.id,
  ];

  const response = await queryDb(query, values);
  return mapQuestion(response[0]);
}
