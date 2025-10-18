import * as blobs from "@netlify/blobs";

export async function handler() {
  try {
    const result = await blobs.get({
      key: "data",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    if (!result || !result.value) {
      return { statusCode: 200, body: "[]" };
    }

    const json = JSON.parse(result.value);
    return { statusCode: 200, body: JSON.stringify(json) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
