import { setBlob } from "@netlify/blobs";

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "[]");

    // Save JSON string to the blob store
    await setBlob({
      key: "data",
      body: JSON.stringify(body),
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
