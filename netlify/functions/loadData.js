import { getBlob } from "@netlify/blobs";

export async function handler() {
  try {
    const blob = await getBlob({
      key: "data",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    if (!blob) return { statusCode: 200, body: "[]" };

    const json = await blob.json();
    return { statusCode: 200, body: JSON.stringify(json) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
