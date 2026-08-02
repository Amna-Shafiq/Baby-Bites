# Baby Bites — Claude Code Instructions

## Project overview

Baby Bites is a React SPA (Vite) deployed on Netlify. Backend is Supabase (Postgres + Auth + Storage). No server-side rendering. PWA-enabled.

**Live site:** https://babybites.net  
**Repo:** https://github.com/Amna-Shafiq/Baby-Bites  
**Supabase project:** jherhqenlzffrghadhlw

---

## Commands

```bash
npm run dev        # local dev server (Vite)
npm run build      # vite build + generates dist/sitemap.xml AND public/sitemap.xml
npm run lint       # ESLint
npm run preview    # preview the dist/ build locally
node scripts/generate-sitemap.js   # regenerate sitemap standalone
```

---

## Environment variables

Stored in `.env` (not committed). Required:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

See `.env.example` for the template.

---

## Tech stack

| Layer     | Tool                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| Frontend  | React 19, React Router v7, Vite 6                                            |
| Styling   | Plain CSS (`src/index.css`, `src/styles/landing.css`)                        |
| Auth + DB | Supabase (anon key is intentionally public; RLS secures data)                |
| Images    | Cloudinary (meals), Supabase Storage (foods), Unsplash, Spoonacular, R2      |
| Forms     | Formspree (`xbdekwlb`)                                                       |
| Fonts     | Google Fonts, CDNFonts, FontShare (files served from `cdn.fontshare.com`)    |
| Hosting   | Netlify (publish dir: `dist/`)                                               |
| PWA       | vite-plugin-pwa (autoUpdate, no inline scripts)                              |
| i18n      | `src/contexts/LanguageContext.jsx` + `src/locales/translations.js` (EN + UR) |

---

## Routing (`src/App.jsx`)

| Path              | Component        | Auth       |
| ----------------- | ---------------- | ---------- |
| `/`               | `Home`           | Public     |
| `/explore`        | `Explore`        | Public     |
| `/foods`          | `AllFoods`       | Public     |
| `/foods/:id`      | `FoodDetail`     | Public     |
| `/meals`          | `Meals`          | Public     |
| `/meal/:id`       | `MealPage`       | Public     |
| `/my-meals`       | `MyMeals`        | Protected  |
| `/my-meals/:id`   | `CustomMealPage` | Protected  |
| `/pantry`         | `Pantry`         | Protected  |
| `/profile`        | `Profile`        | Protected  |
| `/articles/:slug` | `ArticlePage`    | Public     |
| `/about`          | `About`          | Public     |
| `/privacy`        | `PrivacyPolicy`  | Public     |
| `/login`          | `Login`          | Public     |
| `/admin`          | `Admin`          | Admin only |

**Auth guards:**

- `ProtectedRoute` — uses `supabase.auth.getUser()` (server-verified)
- `AdminRoute` — checks JWT email claim for admin address

---

## Supabase tables

| Table                    | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `babies`                 | Baby profiles (max 10 per user, enforced in `useActiveBaby`) |
| `foods`                  | Food library (~170 foods)                                    |
| `meals`                  | Public meal library                                          |
| `custom_meals`           | User-created meals                                           |
| `daily_meals`            | Meal log entries                                             |
| `feeding_log`            | Feed session log                                             |
| `favorites`              | Saved meals per user                                         |
| `meal_ratings`           | 1–5 star ratings                                             |
| `household_foods`        | Pantry items per user                                        |
| `articles`               | Safety/nutrition articles                                    |
| `reminder_subscriptions` | Email + milestone preferences (feature/reminder-vague)       |

RLS is enabled on all tables.

---

## Key conventions

- **No comments** unless the WHY is non-obvious.
- **No Co-Authored-By** in commit messages.
- **Commit and push after every change** to keep the GitHub contribution graph green.
- CSS classes `btn`, `btn-primary`, `input`, `card`, `panel`, `eyebrow`, `muted` are global utilities in `src/index.css`.
- `cloudinaryUrl(url, width)` in `src/lib/cloudinaryUrl.js` auto-transforms Cloudinary URLs to the correct width + `q_auto,f_auto`.
- `mealSlug(title)` in `src/lib/mealSlug.js` generates URL-safe slugs for meal routes.
- Images from Cloudinary, Supabase Storage, Unsplash, Spoonacular (bare + `img.`), R2, placehold.co, and flagcdn.com are all whitelisted in the CSP (`netlify.toml`). Add new image domains there when needed.
- Font files for FontShare come from `cdn.fontshare.com`, not `api.fontshare.com` — both are in `font-src`.

---

## Security headers (`netlify.toml`)

CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are all set. When adding a new external resource, add its domain to the matching CSP directive.

---

## Sitemap

Generated by `scripts/generate-sitemap.js`. Writes to both `dist/sitemap.xml` (for the live deploy) and `public/sitemap.xml` (tracked in git). Run `node scripts/generate-sitemap.js` after adding foods or meals and commit the updated `public/sitemap.xml`.

## Project Rules (learned from reminder-signup drill)

1. Always specify exact file paths and existing data model references
   (e.g. babies table, Profile page location) in prompts — without them,
   the AI guesses page placement and assumes a single-entity model even
   when the app supports multiples (e.g. multiple babies per account).

2. Explicitly prompt for empty/zero-state handling. The AI will not
   infer that a feature depending on existing data (e.g. reminders for
   a baby) needs a guard for when that data doesn't exist yet — it will
   default to showing success regardless.

3. When a feature replaces or supersedes previous work (even a prior draft/branch), explicitly instruct removal of the old implementation — the AI will build the new correctly-scoped version without touching or flagging stale code elsewhere in the repo.

4. Always end feature prompts with an instruction to write and run tests.
   Verification does not happen unless it's requested as an explicit step.
