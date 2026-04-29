import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";

// Load .env for local builds (on Netlify/Vercel these are injected automatically)
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

const SITE_URL = (process.env.SITE_URL || "https://babybitee.netlify.app").replace(/\/$/, "");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const STATIC_ROUTES = [
  { path: "/",        priority: "1.0", changefreq: "weekly"  },
  { path: "/explore", priority: "0.9", changefreq: "weekly"  },
  { path: "/foods",   priority: "0.9", changefreq: "weekly"  },
  { path: "/meals",   priority: "0.9", changefreq: "weekly"  },
  { path: "/about",   priority: "0.5", changefreq: "monthly" },
];

async function generateSitemap() {
  const [{ data: foods }, { data: meals }] = await Promise.all([
    supabase.from("foods").select("id"),
    supabase.from("meals").select("id").eq("is_public", true),
  ]);

  const urls = [
    ...STATIC_ROUTES.map((r) => ({
      loc: `${SITE_URL}${r.path}`,
      priority: r.priority,
      changefreq: r.changefreq,
    })),
    ...(foods || []).map((f) => ({
      loc: `${SITE_URL}/foods/${f.id}`,
      priority: "0.7",
      changefreq: "monthly",
    })),
    ...(meals || []).map((m) => ({
      loc: `${SITE_URL}/meal/${m.id}`,
      priority: "0.7",
      changefreq: "monthly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  writeFileSync("dist/sitemap.xml", xml);
  console.log(`✓ Sitemap generated — ${urls.length} URLs (${(foods || []).length} foods, ${(meals || []).length} meals)`);
}

generateSitemap().catch((err) => {
  console.error("Sitemap generation failed:", err.message);
  process.exit(1);
});
