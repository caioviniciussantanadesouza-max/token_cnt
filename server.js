import express from "express";
import ee from "@google/earthengine";

const app = express();
const PORT = process.env.PORT || 8080;

// ====== CONFIG ======
const ASSET = "projects/mapbiomas-public/assets/brazil/lulc/v1";
const COLLECTION_ID = 10.0;
const VERSION = "v1";

// Você precisa rodar com credenciais do GEE (service account).
// Em Cloud Run/Render, normalmente você injeta via env var apontando pro JSON.
const PRIVATE_KEY_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON; 
// alternativa: process.env.GOOGLE_APPLICATION_CREDENTIALS = "/path/key.json"

function initEE() {
  return new Promise((resolve, reject) => {
    try {
      if (PRIVATE_KEY_JSON) {
        const key = JSON.parse(PRIVATE_KEY_JSON);
        ee.data.authenticateViaPrivateKey(
          key,
          () => ee.initialize(null, null, resolve, reject),
          reject
        );
      } else {
        // Usa GOOGLE_APPLICATION_CREDENTIALS (arquivo) se estiver configurado
        ee.initialize(null, null, resolve, reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function mapbiomasImage(year) {
  return ee.ImageCollection(ASSET)
    .filter(ee.Filter.eq("collection_id", COLLECTION_ID))
    .filter(ee.Filter.eq("version", VERSION))
    .filter(ee.Filter.eq("year", year))
    .first()
    .select("classification");
}

function buildMasks(img) {
  // classes do seu script
  const trees = img.remap([3,4,5,6,49],[1,1,1,1,1]).rename("m");
  const water = img.remap([33],[2]).rename("m");
  const deforestation = img.remap([15,18,22,25],[3,3,3,3]).rename("m");
  const urban = img.remap([24],[4]).rename("m");
  return { trees, water, deforestation, urban };
}

function maskByType(masks, type) {
  switch (type) {
    case "trees": return masks.trees.eq(1);
    case "water": return masks.water.eq(2);
    case "deforestation": return masks.deforestation.eq(3);
    case "urban": return masks.urban.eq(4);
    default: return null;
  }
}

// Converte FeatureCollection -> GeoJSON
async function fcToGeoJSON(fc) {
  const json = await fc.getInfo(); // ok p/ 5k pontos
  return json;
}

app.get("/health", (_, res) => res.json({ ok: true }));

// Ex: /points?year=2024&type=water&num=5000&scale=1000
app.get("/points", async (req, res) => {
  try {
    const year = Number(req.query.year ?? 2024);
    const type = String(req.query.type ?? "trees");
    const num = Math.min(20000, Math.max(200, Number(req.query.num ?? 5000)));
    const scale = Math.min(5000, Math.max(30, Number(req.query.scale ?? 1000)));

    const img = mapbiomasImage(year);
    const masks = buildMasks(img);

    const m = maskByType(masks, type);
    if (!m) return res.status(400).json({ error: "type inválido (trees|water|deforestation|urban)" });

    const points = m.selfMask()
      .addBands(ee.Image.pixelLonLat())
      .sample({
        region: img.geometry(),
        scale,
        numPixels: num,
        geometries: true
      });

    const geojson = await fcToGeoJSON(points);
    res.json(geojson);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

(async () => {
  await initEE();
  app.listen(PORT, () => console.log("API on", PORT));
})();
