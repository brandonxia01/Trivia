import { NextRequest, NextResponse } from "next/server";
import { insertQuestion, listQuestions, Question, updateQuestion } from "./QuestionsDb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(request: NextRequest) {
  try {
    const result = await listQuestions();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`Unable to get questions list: ${err}.`);
    return NextResponse.json({ error: `Unable to retrieve questions.` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.question || !body.answer || !body.difficulty) {
      return NextResponse.json({ error: "Missing required fields: question, answer, or difficulty." }, { status: 400 });
    }

    const multipleChoiceAnswers = body.multiple_choice_answers ?? [];

    if (multipleChoiceAnswers.length > 0) {
      const allOptions: string[] = multipleChoiceAnswers.flatMap((item: any) => item.options ?? []);
      if (!allOptions.includes(body.answer)) {
        return NextResponse.json({ error: "Answer must be one of the multiple-choice options." }, { status: 400 });
      }
    }

    // Generate embedding for semantic similarity
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: body.question,
    });
    const embedding = embeddingResponse.data[0].embedding;

    const newQuestion: Question = {
      id: 0,
      question: body.question,
      answer: body.answer,
      multiple_choice_answers: multipleChoiceAnswers,
      verse_references: body.verse_references ?? [],
      difficulty: body.difficulty,
      attempts: 0,
      correct_attempts: 0,
      upvotes: 0,
      downvotes: 0,
      verified: false,
      embedding, // <-- new field
    };

    const inserted = await insertQuestion(newQuestion);
    return NextResponse.json(inserted, { status: 201 });
  } catch (err: any) {
    console.error(`Unable to create question: ${err}`);
    return NextResponse.json({ error: "Unable to create question." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing required field: id." }, { status: 400 });
    }

    const multipleChoiceAnswers = body.multiple_choice_answers ?? [];
    if (multipleChoiceAnswers.length > 0) {
      const allOptions: string[] = multipleChoiceAnswers.flatMap((item: any) => item.options ?? []);
      if (!allOptions.includes(body.answer)) {
        return NextResponse.json({ error: "Answer must be one of the multiple-choice options." }, { status: 400 });
      }
    }

    // Generate a new embedding if the question text changed
    let embedding = body.embedding;
    if (body.question) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: body.question,
      });
      embedding = embeddingResponse.data[0].embedding;
    }

    const updatedQuestion: Question = {
      id: body.id,
      question: body.question ?? "",
      answer: body.answer ?? "",
      multiple_choice_answers: multipleChoiceAnswers,
      verse_references: body.verse_references ?? [],
      difficulty: body.difficulty ?? 1,
      attempts: body.attempts ?? 0,
      correct_attempts: body.correct_attempts ?? 0,
      upvotes: body.upvotes ?? 0,
      downvotes: body.downvotes ?? 0,
      verified: body.verified ?? false,
      embedding, // <-- update embedding
    };

    const result = await updateQuestion(updatedQuestion);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error(`Unable to update question: ${err}`);
    return NextResponse.json({ error: "Unable to update question." }, { status: 500 });
  }
}
