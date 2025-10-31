import { NextRequest, NextResponse } from "next/server";
import { insertQuestion, listQuestions, Question, updateQuestion } from "./QuestionsDb";

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

    // You can do basic validation here if you want
    if (!body.question || !body.answer || !body.difficulty) {
      return NextResponse.json({ error: "Missing required fields: question, answer, or difficulty." }, { status: 400 });
    }

    const multipleChoiceAnswers = body.multiple_choice_answers ?? [];

    // Validation: if multiple choice answers exist, the correct answer must be one of them
    if (multipleChoiceAnswers.length > 0) {
      const allOptions: string[] = multipleChoiceAnswers.flatMap((item: any) => item.options ?? []);

      if (!allOptions.includes(body.answer)) {
        return NextResponse.json({ error: "Answer must be one of the multiple-choice options." }, { status: 400 });
      }
    }

    const newQuestion: Question = {
      id: 0, // placeholder, DB will assign real ID
      question: body.question,
      answer: body.answer,
      multiple_choice_answers: body.multiple_choice_answers ?? [],
      verse_references: body.verse_references ?? [],
      difficulty: body.difficulty,
      attempts: 0,
      correct_attempts: 0,
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

    // Fetch existing question (optional: you could implement a getQuestionById helper)
    // For now, we assume the client sends all fields to update

    const multipleChoiceAnswers = body.multiple_choice_answers ?? [];

    // Validation: if multiple choice answers exist, the correct answer must be one of them
    if (multipleChoiceAnswers.length > 0) {
      const allOptions: string[] = multipleChoiceAnswers.flatMap((item: any) => item.options ?? []);

      if (!allOptions.includes(body.answer)) {
        return NextResponse.json({ error: "Answer must be one of the multiple-choice options." }, { status: 400 });
      }
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
    };

    const result = await updateQuestion(updatedQuestion);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error(`Unable to update question: ${err}`);
    return NextResponse.json({ error: "Unable to update question." }, { status: 500 });
  }
}
