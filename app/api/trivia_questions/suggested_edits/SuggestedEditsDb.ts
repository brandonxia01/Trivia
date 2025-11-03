import { queryDb } from "../../DbHelpers";

export interface MultipleChoiceAnswer {
  options: string[];
  correct: string;
}

export interface SuggestedEdit {
  id: number;
  question_id: number;
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
}

export function mapSuggestedEdit(row: any): SuggestedEdit {
  return {
    id: row.id ?? 0,
    question_id: row.question_id ?? 0,
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
  };
}

export async function listSuggestedEdits(): Promise<SuggestedEdit[]> {
  const response = await queryDb(`SELECT * FROM suggested_edits ORDER BY id ASC`);
  return response.map((row: any) => mapSuggestedEdit(row));
}

export async function insertSuggestedEdit(edit: Omit<SuggestedEdit, "id">): Promise<SuggestedEdit> {
  const query = `
    INSERT INTO suggested_edits 
      (question_id, question, answer, multiple_choice_answers, verse_references, difficulty, attempts, correct_attempts, upvotes, downvotes, verified)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *;
  `;

  const values = [
    edit.question_id,
    edit.question,
    edit.answer,
    JSON.stringify(edit.multiple_choice_answers),
    JSON.stringify(edit.verse_references),
    edit.difficulty,
    edit.attempts ?? 0,
    edit.correct_attempts ?? 0,
    edit.upvotes ?? 0,
    edit.downvotes ?? 0,
    edit.verified ?? false,
  ];

  const result = await queryDb(query, values);
  return mapSuggestedEdit(result[0]);
}

/**
 * Delete a suggested edit by ID
 */
export async function deleteSuggestedEdit(id: number): Promise<void> {
  await queryDb(`DELETE FROM suggested_edits WHERE id = $1`, [id]);
}

/**
 * Update a question in trivia_questions table
 */
export async function updateQuestion(
  id: number,
  data: Partial<{
    question: string;
    answer: string;
    multiple_choice_answers: MultipleChoiceAnswer[];
    verse_references: string[];
    difficulty: number;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  let i = 1;
  if (data.question !== undefined) {
    fields.push(`question = $${i++}`);
    values.push(data.question);
  }
  if (data.answer !== undefined) {
    fields.push(`answer = $${i++}`);
    values.push(data.answer);
  }
  if (data.multiple_choice_answers !== undefined) {
    fields.push(`multiple_choice_answers = $${i++}`);
    values.push(JSON.stringify(data.multiple_choice_answers));
  }
  if (data.verse_references !== undefined) {
    fields.push(`verse_references = $${i++}`);
    values.push(JSON.stringify(data.verse_references));
  }
  if (data.difficulty !== undefined) {
    fields.push(`difficulty = $${i++}`);
    values.push(data.difficulty);
  }

  if (!fields.length) return;

  const query = `UPDATE trivia_questions SET ${fields.join(", ")} WHERE id = $${i}`;
  values.push(id);

  await queryDb(query, values);
}
