import { Pool } from "pg";

const dbPool = new Pool({
  host: process.env.PG_HOST,
  port: (process.env.PG_PORT || 25061) as number,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: {
    ca: process.env.DB_CERT,
  },
});

/**
 * Database query wrapper function
 */
export async function queryDb(query: string, values?: any[]): Promise<any[]> {
  console.log(`Database Query: "${query}" with values: ${JSON.stringify(values)}.`);

  const response = await dbPool.query({
    text: query,
    values: values || [],
  });

  console.log(`Returning ${response.rowCount} rows.`);
  return response.rows;
}
