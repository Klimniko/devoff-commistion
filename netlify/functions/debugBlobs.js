import * as blobs from "@netlify/blobs";

export async function handler() {
  try {
    const list = await blobs.list({
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    const result = await blobs.get({
      key: "data",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          env: process.env.NETLIFY_BLOBS_ENV || "(not set)",
          blobKeys: list.blobs?.map((b) => b.key) || [],
          data: result?.value ? JSON.parse(result.value) : null,
        },
        null,
        2
      ),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
