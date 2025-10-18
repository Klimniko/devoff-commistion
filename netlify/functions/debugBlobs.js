import { listStores, getStore } from "@netlify/blobs";

export async function handler() {
  try {
    const stores = await listStores();
    const store = getStore({
      name: "calculations",
      environment: process.env.NETLIFY_BLOBS_ENV || "main",
      createIfMissing: false,
    });

    let keys = [];
    try {
      const listed = await store.list();
      keys = listed.blobs.map(b => b.key);
    } catch (e) {
      keys = [`Error listing keys: ${e.message}`];
    }

    let data = null;
    try {
      const blob = await store.get("data");
      if (blob) data = await blob.json();
    } catch (e) {
      data = `Error reading data blob: ${e.message}`;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          env: process.env.NETLIFY_BLOBS_ENV || "(not set)",
          stores,
          calculationsKeys: keys,
          calculationsData: data,
        },
        null,
        2
      ),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
