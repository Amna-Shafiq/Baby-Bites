import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";

// Load .env for local builds
if (existsSync(".env")) {
  const lines = readFileSync(".env", "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) process.env[key.trim()] = val;
    }
  }
}

const SITE_URL = (process.env.SITE_URL || "https://babybites.net").replace(/\/$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const STATIC_ROUTES = [
  { path: "/",        priority: "1.0", changefreq: "weekly"  },
  { path: "/explore", priority: "0.9", changefreq: "weekly"  },
  { path: "/foods",   priority: "0.9", changefreq: "weekly"  },
  { path: "/meals",   priority: "0.9", changefreq: "weekly"  },
  { path: "/about",   priority: "0.5", changefreq: "monthly" },
];

function buildXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

async function generateSitemap() {
  const staticUrls = STATIC_ROUTES.map((r) => ({
    loc: `${SITE_URL}${r.path}`,
    priority: r.priority,
    changefreq: r.changefreq,
  }));

  let foods = [];
  let meals = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const [foodsRes, mealsRes] = await Promise.all([
        supabase.from("foods").select("name"),
        supabase.from("meals").select("id").eq("is_public", true),
      ]);
      foods = foodsRes.data || [];
      meals = mealsRes.data || [];
    } catch (err) {
      console.warn("⚠ Could not fetch dynamic data:", err.message);
    }
  } else {
    console.warn("⚠ Supabase env vars missing — sitemap will contain static routes only");
  }

  const urls = [
    ...staticUrls,
    ...foods.map((f) => ({
      loc: `${SITE_URL}/foods/${f.name.toLowerCase().replace(/\s+/g, "-")}`,
      priority: "0.7",
      changefreq: "monthly",
    })),
    ...meals.map((m) => ({
      loc: `${SITE_URL}/meal/${m.id}`,
      priority: "0.7",
      changefreq: "monthly",
    })),
  ];

  // Ensure dist/ exists (in case script is run standalone)
  if (!existsSync("dist")) mkdirSync("dist");

  writeFileSync("dist/sitemap.xml", buildXml(urls), "utf-8");
  console.log(`✓ Sitemap written — ${urls.length} URLs (${foods.length} foods, ${meals.length} meals)`);
}

generateSitemap().catch((err) => {
  console.error("Sitemap generation failed:", err.message);
  // Don't exit(1) — let the deploy succeed even if sitemap fails
});
