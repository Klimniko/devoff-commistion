import { getStore } from "@netlify/blobs";

export async function handler() {
  try {
    const store = getStore({
      name: "calculations",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
      createIfMissing: true,
    });

    const blob = await store.get("data");
    if (!blob) return { statusCode: 200, body: "[]" };

    const json = await blob.json();
    return { statusCode: 200, body: JSON.stringify(json) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
