# Evidence

## AI Processing

**Vision model produces structured output validated against a schema; invalid responses are never trusted.**
See `src/schemas/imageTag.schema.js` — every Gemini response is parsed via `safeParse()`. Test proof: `tests/schema.test.js`, all passing (see `npm test` output below).

**Low-confidence classifications are flagged instead of accepted.**
`parseImageTags()` flags any result with confidence < 0.6 rather than silently accepting it. Unit test: "flags low-confidence results instead of rejecting them" in `tests/schema.test.js` — PASS.

**Images are processed through a batch background job with retries.**
`scripts/run-batch.js` processes all images with exponential backoff retry (1s/2s/4s/8s) on 503/429 errors. Real-world proof: the corpus was tagged across multiple sessions after hitting live Gemini free-tier quota limits, resuming cleanly each time without reprocessing completed images (see BUILDLOG.md).

**Vision and embedding costs are tracked per call.**
`ai_call_costs` table populated for all 50 images. Verified via `scripts/check-costs.js`:

[ { call_type: 'vision', calls: '51', total_input: '61303', total_output: '4209', total_cost: '0.007819' } ]


## Matching System

**Image and post embeddings are stored; posts return ranked image suggestions.**
`GET /posts/:id/images` returns full ranked candidate list. Example (fox post):

fox9.jpg - red fox (similarity: 0.7415)
fox2.jpg - red fox (similarity: 0.7318)
fox1.jpg - red fox (similarity: 0.7305)


**Semantic matching works for equivalent concepts.**
Post "The Secret Life of Red Foxes" (no filename/keyword overlap with image files) correctly surfaced all top-5 results as fox images purely via caption/post embedding similarity.

## Safety Layer

**The mismatch guard rejects incorrect recommendations — the wolf-on-a-fox-post scenario provably fails.**
`scripts/test-guard.js` output:

Candidate: wolf5.jpg (gray wolf, similarity: 0.6011)
Guard verdict: { approved: false, reason: 'Animal category mismatch: expected fox, detected wolf' }

Also covered in `tests/guard.test.js` — PASS.

**Rejections include a human-readable explanation.**
See reason strings above — always populated, never a bare boolean.

**When no image clears the bar, the system answers "no confident match" with reasons.**
Post "Top 10 Vintage Cars of the 1960s" (no relevant corpus images) → `noMatchReason: "No confident match found. Similarity below threshold and/or detected subjects do not match article topic."`

## Backend

**Database models for images, tags, embeddings, posts, suggestions, approvals/rejections — with required indexes.**
See `db/schema.sql`. Indexes: `idx_image_tags_image_id`, `idx_images_status`, `idx_suggestions_post_id`.

**API endpoints validated; the review workflow (approve/reject/inspect why) exists.**
`POST /posts` validates `title`/`body` presence, returns 400 on missing fields. `POST /suggestions/:id/approve` and `/reject` tested live — approve confirmed via curl, status field flips from `pending` to `approved`.

**Automated tests cover schema validation, mismatch rejection, and matching accuracy.**
`npm test` → 3 suites, 9 tests, all passing:

PASS tests/guard.test.js
PASS tests/schema.test.js
PASS tests/matching.test.js
Tests: 9 passed, 9 total


**A small labeled evaluation dataset measures top-1 precision — the number is in your README.**
5-post labeled eval set (`db/eval-set.json`), one per corpus category. Top-1 precision: **100% (5/5)** at similarity threshold 0.60. See README "Evaluation" section for threshold-tuning reasoning.

**README with architecture explanation and diagram; submission-pack files from § 11 present.**
See README.md. Submission pack: `capstone.yaml`, `EVIDENCE.md` (this file), `BUILDLOG.md`, `.env.example` — all present in repo root.

