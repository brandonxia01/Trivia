import { NextRequest, NextResponse } from "next/server";
import {
  insertSuggestedEdit,
  listSuggestedEdits,
  deleteSuggestedEdit,
  updateQuestion,
  SuggestedEdit,
} from "./SuggestedEditsDb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      question_id,
      question,
      answer,
      multiple_choice_answers = [],
      verse_references = [],
      difficulty = 1,
      attempts = 0,
      correct_attempts = 0,
      upvotes = 0,
      downvotes = 0,
      verified = false,
    } = body;

    if (!question_id || !question || !answer) {
      return NextResponse.json(
        { error: "Missing required fields: question_id, question, and answer are required." },
        { status: 400 }
      );
    }

    const suggestedEdit: Omit<SuggestedEdit, "id"> = {
      question_id,
      question,
      answer,
      multiple_choice_answers,
      verse_references,
      difficulty,
      attempts,
      correct_attempts,
      upvotes,
      downvotes,
      verified,
    };

    const createdEdit = await insertSuggestedEdit(suggestedEdit);

    return NextResponse.json({ success: true, suggested_edit: createdEdit });
  } catch (err: any) {
    console.error("Failed to create suggested edit:", err);
    return NextResponse.json({ error: "Failed to create suggested edit." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const edits = await listSuggestedEdits();
    return NextResponse.json(edits);
  } catch (err: any) {
    console.error("Failed to fetch suggested edits:", err);
    return NextResponse.json({ error: "Failed to fetch suggested edits." }, { status: 500 });
  }
}

/**
 * DELETE a suggested edit by ID (reject)
 * PATCH a suggested edit (confirm and update the question)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    await deleteSuggestedEdit(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete suggested edit:", err);
    return NextResponse.json({ error: "Failed to delete suggested edit." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updateQuestionData } = body;

    if (!id || !updateQuestionData) {
      return NextResponse.json({ error: "Missing id or updateQuestionData" }, { status: 400 });
    }

    // 1️⃣ Update the original question
    await updateQuestion(updateQuestionData.question_id, updateQuestionData);

    // 2️⃣ Delete the suggested edit
    await deleteSuggestedEdit(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to confirm suggested edit:", err);
    return NextResponse.json({ error: "Failed to confirm suggested edit." }, { status: 500 });
  }
}
