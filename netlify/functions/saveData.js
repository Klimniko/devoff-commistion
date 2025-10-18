import * as blobs from "@netlify/blobs";

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "[]");

    await blobs.set({
      key: "data",
      value: JSON.stringify(body),
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
