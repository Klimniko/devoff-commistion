import { listBlobs, getBlob } from "@netlify/blobs";

export async function handler() {
  try {
    const blobs = await listBlobs({
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    const blob = await getBlob({
      key: "data",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
    });

    let data = null;
    if (blob) data = await blob.json();

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          env: process.env.NETLIFY_BLOBS_ENV || "(not set)",
          blobKeys: blobs.blobs?.map((b) => b.key) || [],
          calculationsData: data,
        },
        null,
        2
      ),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
