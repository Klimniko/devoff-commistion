import { getStore } from "@netlify/blobs";

export async function handler(event) {
  try {
    const store = getStore({
      name: "calculations",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
      createIfMissing: true,
    });

    const body = JSON.parse(event.body || "[]");
    await store.set("data", JSON.stringify(body));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
