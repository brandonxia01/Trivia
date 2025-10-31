import { queryDb } from "../DbHelpers";

export interface Feedback {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  name: string;
  feedback: string;
  timestamp: number;
  status: "active" | "resolved";
  resolution: "";
}

function mapFeedback(row: any): Feedback {
  return {
    id: row.id ?? "",
    book: row.book ?? "",
    chapter: row.chapter ?? 0,
    verse: row.verse ?? 0,
    name: row.name ?? "",
    feedback: row.feedback ?? "",
    timestamp: row.timestamp ?? 0,
    status: row.status ?? "active",
    resolution: row.resolution ?? "",
  };
}

export async function listFeedback(status: string): Promise<Feedback[]> {
  const response = status
    ? await queryDb(`SELECT * FROM feedback WHERE status = $1 ORDER BY timestamp DESC`, [status])
    : await queryDb(`SELECT * FROM feedback ORDER BY timestamp DESC`);
  return response.map((row) => mapFeedback(row));
}

export async function resolveFeedback(id: string, resolution: string): Promise<Feedback> {
  const response = await queryDb(`UPDATE feedback SET status = 'resolved', resolution = $1 WHERE id = $2`, [
    resolution,
    id,
  ]);
  if (response.length > 0) {
    return response.map((a) => mapFeedback(a))[0];
  } else throw Error(`Unable to delete commentator, ${id} not found.`);
}