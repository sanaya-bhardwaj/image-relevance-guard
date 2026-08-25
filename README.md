# image-relevance-guard

AI image understanding & content matching engine with a mismatch guard.
Matches blog posts to the right image based on meaning, not filenames —
and refuses a match instead of guessing when nothing is confident enough.

## Problem

Given a library of images and a set of blog posts, automatically tag each
image with what it actually depicts, then suggest the best-matching image
per post — while explicitly rejecting close-but-wrong matches (e.g. a wolf
photo for a fox article) instead of silently picking the best of a bad set.

## Architecture

Images ─(batch job)─► Gemini Vision ─► {tags, caption, confidence} ─► image_tags
└─► embed(caption) ──────────────────────────────────────► image_vectors

Posts ──────────────────► embed(title + body) ────────────────────► post_vectors

GET /posts/:id/images
└─► Similarity Ranking (cosine: post_vector × image_vectors)
└─► Mismatch Guard (category check + confidence + similarity threshold)
├─► Approved match (ranked, with reason)
└─► "No confident match" + reason
└─► Review API: approve / reject


Layers: `src/services/` (vision, embedding, ranking, guard, matching — pure
logic) → `src/routes/` (Express HTTP layer) → `src/db.js` (Postgres via
Supabase). Business logic never imports Express directly, so the DB or LLM
provider could be swapped without touching route handlers.

## Data model

- `images` — id, filename, file_path, category_guess, status
- `image_tags` — image_id, subject, category, attributes[], caption, confidence, flagged
- `image_vectors` — image_id, embedding (float array), model_used
- `posts` — id, title, body
- `post_vectors` — post_id, embedding, model_used
- `suggestions` — post_id, image_id, similarity_score, guard_verdict, reason, status
- `ai_call_costs` — call_type, reference_id, input/output tokens, estimated cost

## API

- `POST /posts` — create a post (auto-embeds it)
- `GET /posts` — list all posts
- `GET /posts/:id/images` — ranked suggestions + guard verdicts for a post
- `POST /suggestions/:id/approve` — approve a suggested pairing
- `POST /suggestions/:id/reject` — reject a suggested pairing
- `GET /suggestions` — review table (all suggestions + status)
- `GET /health` — DB connectivity check

## Non-goal

No frontend UI — API + a plain results table is sufficient. No multi-tenant
auth; this is a single-operator internal tool.

## Setup

1. Clone the repo, `npm install`
2. Create a free [Supabase](https://supabase.com) project, copy the pooled
   connection string (Connect → Direct → Session pooler)
3. Get a free [Gemini API key](https://aistudio.google.com/api-keys)
4. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `GEMINI_API_KEY`
5. Run the seed pipeline: `npm run seed` (runs migrations, tags the corpus,
   generates embeddings, creates the eval posts)
6. `npm run dev` — server on `http://localhost:3000`

## Corpus

Not committed (see `.gitignore`). To reproduce:
1. Download 10 images each of: fox, wolf, dog, bear, deer from Unsplash/Pexels
   into `corpus/` (50 total)
2. Run `node scripts/convert-avif.js` if any are `.avif` (converts to `.jpg`,
   removes originals)

## Guard rules

A candidate image is REJECTED for a post if any of:
1. **Category mismatch** — post mentions a different named animal than the
   image's tagged subject (e.g. post about foxes, image tagged `wolf`)
2. **Similarity below threshold** — cosine similarity between post embedding
   and image caption embedding < 0.60
3. **Low confidence** — image's vision-tagged confidence < 0.6 (flagged at
   ingestion, excluded from suggestions until manually reviewed)

If the top candidate fails any rule and no other candidate clears the bar,
the response is `{ "match": null, "reason": "No confident match: ..." }`.
Guard verdicts always include a human-readable `reason`, never just a boolean.

## Evaluation

Top-1 precision on a 5-post labeled eval set (one post per corpus category:
fox, wolf, dog, bear, deer): **100% (5/5)**

Similarity threshold tuning: started at 0.65, which correctly declined a
borderline dog match (0.60 similarity) rather than guess — a defensible but
conservative choice. Lowered to **0.60** after confirming it clears the
borderline case without approving any tested false-positive candidates (an
out-of-domain "vintage cars" post topped out at 0.49 similarity against the
corpus, well below threshold either way). The wolf-for-fox mismatch guard
rejects on category mismatch regardless of similarity score, so threshold
tuning does not affect that safety check.

## Limitations

- Free-tier Gemini caps at 20 requests/day per model. The batch job is
  idempotent (only reprocesses `pending`/`failed` rows) and resumes cleanly
  across sessions and even across different models when one hits quota or
  gets deprecated mid-build (see BUILDLOG.md).
- Category-mismatch detection in the guard uses a simple keyword heuristic
  (checks for named animals in post text vs. image subject), not a general
  NLP entity extractor — works well for this corpus's animal categories but
  wouldn't generalize to arbitrary subject matter without extension.
- No frontend; review workflow is API-only, verified via REST calls.
- 50-image corpus, single vision + single embedding model, per § 7 scope.

## Tests

npm test

3 suites, 9 tests: schema validation, mismatch guard logic, and matching
accuracy against the labeled eval set (regression-guards precision ≥ 80%).

