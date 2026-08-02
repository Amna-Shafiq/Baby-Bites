# Baby Bites — Development Workflow

## Day-to-day flow

1. Pull latest main before starting work
   ```bash
   git pull origin main
   ```
2. Make changes, test locally with `npm run dev`
3. Commit and push — do this after **every** meaningful change, not just at end of day
   ```bash
   git add <files>
   git commit -m "Short description of what changed and why"
   git push origin main
   ```
4. Netlify auto-deploys on every push to `main` (takes ~1–2 min)

---

## Branch strategy

| Branch pattern   | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `main`           | Production — auto-deployed to babybites.net |
| `feature/<name>` | New features in progress                    |

Push feature branches to GitHub and open a PR when ready to merge into main.

---

## Adding foods to the database

1. Write `INSERT` SQL for the new food(s)
2. Run it in the Supabase SQL editor
3. Regenerate the sitemap:
   ```bash
   node scripts/generate-sitemap.js
   ```
4. Commit both the sitemap and any related code changes:
   ```bash
   git add public/sitemap.xml
   git commit -m "Add [food name] to DB and regenerate sitemap"
   git push origin main
   ```

---

## Adding a new image source

If a new third-party domain serves images (or fonts/videos) in the app, add it to `netlify.toml` under `Content-Security-Policy`:

- Images → `img-src`
- Fonts → `font-src`
- Videos → `media-src`
- API calls → `connect-src`

Then commit `netlify.toml` and push — the new header takes effect on the next Netlify deploy.

---

## Running the security audit

OWASP Top 10 was assessed and addressed. Recheck these after major changes:

- **A01 (Access Control):** Supabase RLS policies on all tables; `ProtectedRoute` uses `getUser()`.
- **A02 (Crypto):** Passwords min 8 chars; HSTS enabled; no sensitive data in localStorage.
- **A03 (Injection):** No `dangerouslySetInnerHTML`; Supabase client uses parameterised queries.
- **A05 (Misconfig):** CSP in `netlify.toml`; run `npm audit` periodically.
- **A06 (Vulnerable deps):** Run `npm audit fix` and commit the result.

```bash
npm audit
npm audit fix
```

---

## Translations (i18n)

All user-visible strings on the landing page live in `src/locales/translations.js` under the `en` and `ur` objects. When adding new copy to Home or Explore:

1. Add the key to both `en` and `ur` sections
2. Use `const { t } = useLanguage()` and `{t("yourKey")}` in JSX
3. Urdu text is RTL — the `LanguageContext` sets `dir="rtl"` on the root element automatically

---

## Environment variables

Stored in `.env` (gitignored). Never commit `.env`.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

On Netlify, set these under **Site settings → Environment variables**.

---

## Useful Supabase queries

```sql
-- Count all foods
SELECT COUNT(*) FROM foods;

-- List all distinct image domains in foods table
SELECT DISTINCT regexp_replace(image_url, '^(https?://[^/]+).*', '\1') AS domain
FROM foods WHERE image_url IS NOT NULL;

-- Find foods with no image
SELECT name FROM foods WHERE image_url IS NULL OR image_url = '';
```

---

## Deployment checklist

Before merging a feature branch to main:

- [ ] `npm run build` completes without errors
- [ ] No new CSP violations in the browser console
- [ ] New Supabase tables have RLS enabled and appropriate policies
- [ ] `public/sitemap.xml` regenerated if foods or meals were added
- [ ] `.env` is not committed
- [ ] `npm audit` shows no high/critical vulnerabilities

# WORKFLOW.md — Milestone Reminder Signup: Vague vs. Precise Prompting

## Round 1: Vague Prompt

Prompt: "Add a signup form where users enter their email and pick which baby
age milestones (0-6mo, 6-12mo, 12-24mo) they want reminders for, so we can
remind them to complete their profile. Save it to the database."

Branch: feature/reminder-vague

## Round 2: Precise Prompt

Branch: feature/reminder-precise
(Included: file references, data model context, explicit constraints,
example behaviors, and a mandatory test-and-run verification step.)

## Correctness

Round 1 placed the form on the About page instead of the Profile page —
with no location constraint given, the AI guessed. It also treated the user
as having a single implicit baby, ignoring that Baby Bites supports multiple
babies per account; it never scoped reminders per-baby. Most seriously, it
skipped a no-baby guard: a user with zero baby profiles could still submit
and see "you're on the list," a false success state for reminders that have
nothing to attach to.

Round 2, given explicit file references and data model context, correctly built the per-baby milestone reminder form on the Profile page, with working email validation, required age-range selection, and passing tests. One gap remained: it did not remove the incorrect form round 1 had placed on the About page. This wasn't a flaw in the new code — it was a scope-boundary miss. The precise prompt described what to build, not what stale artifacts to remove, and the AI has no way to infer that cleanup was needed without being told explicitly.

## Accessibility

Round 1 had no error-state accessibility at all
Round 2 was prompted explicitly for aria-describedby and aria-live, and
it actually delivered .

## Edge Cases

Round 1 caught: [none ]
Round 1 missed: email format validation entirely (any string was accepted),
empty age-range selection (form submitted with zero milestones chosen),
duplicate signups, and Supabase failure — it returned a static success
message regardless of whether the database write succeeded.

Round 2 was explicitly prompted for each of these everthing was perfect.

## Review Effort

Round 1 required a full rebuild, not a fix — the page placement and missing
data model meant patching it would have taken longer than restarting. Round 2
required tests passed first run?

## AI Mistake Caught

The clearest mistake: round 1 displayed "you're on the list" even when the
user had not added any baby profile, producing a false confirmation for a
reminder with no valid target. This wasn't a visual bug — it was a logic
error that could ship silently.

Round 2 left the incorrect About-page form from round 1 in place. The AI correctly executed the scoped instruction but did not reason about the broader repo state — removing superseded code requires an explicit instruction, it isn't inferred from building the replacement.
