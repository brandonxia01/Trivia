import OpenAI from "openai";
import { queryDb } from "../../DbHelpers";
import { mapQuestion, Question } from "../QuestionsDb";

const openai = new OpenAI();

export async function POST(req: Request) {
  const { question } = await req.json();
  console.log("Getting called — " + question);
  if (!question) return new Response("Missing question text", { status: 400 });

  // Generate embedding for the input question
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  const embedding = embeddingResponse.data[0].embedding;

  // Convert to Postgres vector literal
  const vectorLiteral = `[${embedding.map((n) => n.toString()).join(",")}]`;

  // Query top 5 similar questions
  const rows = await queryDb(
    `SELECT id, question, answer, multiple_choice_answers, verse_references, difficulty,
            attempts, correct_attempts, upvotes, downvotes, verified,
            embedding <-> $1 AS distance
     FROM trivia_questions
     ORDER BY embedding <-> $1
     LIMIT 5`,
    [vectorLiteral]
  );

  // Filter out unrelated results and map to Question type
  const similar: Question[] = rows.filter((r: any) => r.distance < 0.99).map(mapQuestion);

  return new Response(JSON.stringify(similar), { status: 200 });
}
