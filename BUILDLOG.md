# Build Log

Honest record of where AI assistance helped, where it was wrong, and what I changed as a result — per the capstone's AI-usage transparency rule.

## Where AI helped
- Scaffolding the Express + Postgres + Zod project structure quickly (routes, schema, service layers).
- Writing the initial Gemini vision-call and embedding-call wrappers.
- Suggesting retry-with-backoff logic for transient 503 errors.
- Drafting the mismatch guard's category-comparison heuristic.

## Where AI was wrong, and what I changed
- **Model names were repeatedly stale.** AI suggested `gemini-2.0-flash`, then `gemini-2.5-flash`,
  then `gemini-flash-latest` — all hit 404s or quota walls at different points as Google's
  model lineup changed faster than the AI's training data. I resolved this myself by calling
  the `/models` endpoint directly to list what my API key actually supported, rather than
  continuing to guess model names.
- **`text-embedding-004` was also stale** — same pattern, same fix (listed live models,
  found `gemini-embedding-001` was current).
- **Free-tier quota limits were underestimated.** AI initially treated 503/429 errors as
  purely transient and retriable. In practice, Gemini's free tier caps at 20 requests/day
  per model — a daily quota, not a rate limit. Retrying with backoff didn't help once the
  daily cap was hit; the real fix was rotating between models with independent quota pools
  (`gemini-2.5-flash` → `gemini-2.5-pro` [also retired mid-build] → `gemini-3.1-flash-lite`)
  and resuming the idempotent batch job across sessions/models.
- **A corpus image (`wolf1.jpg`, later also `wolf7.jpg`) was mislabeled** — Gemini correctly
  identified it as a husky/dog-like animal, not a wolf, which meant the *source photo* was
  a bad pick from Unsplash, not a model error. I caught this by manually reviewing an
  unexpectedly low-confidence-adjacent tag, swapped the photos, and reprocessed.
- **Eval script had a logic bug I initially missed**: it checked whether the tagged
  `subject` string literally contained the word "dog", which failed for a correctly-tagged
  "beagle". This made the guard/matching logic look wrong when the bug was actually in the
  eval script's string-matching, not the system under test. Fixed by matching against the
  filename prefix (the actual ground-truth label) instead.
- **Initial similarity threshold (0.65) was untested against real data.** After running the
  eval set, one category (dog) failed only because its generic post text produced a weaker
  embedding match than the more visually-descriptive posts. I tested both a looser (0.55)
  and moderate (0.60) threshold before settling on 0.60, based on evidence (the out-of-domain
  "vintage cars" test case) that it wouldn't introduce false positives, rather than guessing.

## Decisions I made independently
- Chose Supabase over local Docker Postgres for simplicity and reuse across projects.
- Chose to keep `gemini-flash-lite`-family models as the default going forward, since they've
  shown the most consistent availability across this build.
- Chose the 0.60 similarity threshold as documented above.

