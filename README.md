# image-relevance-guard

AI image understanding & content matching engine with a mismatch guard.
Matches blog posts to the right image based on meaning, not filenames —
and refuses a match instead of guessing when nothing is confident enough.

## Problem
Given a library of images and a set of blog posts, automatically tag
each image with what it actually depicts, then suggest the best-matching
image per post — while explicitly rejecting close-but-wrong matches
(e.g. a wolf photo for a fox article) instead of silently picking the
best of a bad set.

## Data model (draft)
- `images` — id, file path/url, raw vision response, created_at
- `image_tags` — image_id, subject, category, attributes[], caption, confidence
- `image_vectors` — image_id, embedding, model_used
- `posts` — id, title, body, created_at
- `post_vectors` — post_id, embedding, model_used
- `suggestions` — post_id, image_id, similarity_score, guard_verdict, reason, status (pending/approved/rejected)
- `ai_call_costs` — call_type (vision/embedding), image_id/post_id, tokens, cost, created_at

## API surface (draft)
- `POST /images/batch-tag` — kick off batch vision job on corpus
- `GET /images/:id` — tags + status for one image
- `POST /posts` — create a post
- `GET /posts/:id/images` — ranked suggestions + guard verdicts
- `POST /suggestions/:id/approve`
- `POST /suggestions/:id/reject`
- `GET /eval/precision` — run eval set, return top-1 precision

## Non-goal
No frontend UI — API + a plain results table is sufficient. No multi-tenant
auth; this is a single-operator internal tool.

## Status
Phase 1 — design in progress. 

## Guard rules (draft)

A candidate image is REJECTED for a post if any of:
1. **Category mismatch** — image `category` doesn't match the post's expected category
   (e.g. post about foxes, image tagged `category: "animal"` but `subject: "wolf"`)
2. **Similarity below threshold** — cosine similarity between post embedding and
   image caption embedding < threshold (starting guess: 0.75, to be tuned in Phase 4
   against the labeled eval set)
3. **Low confidence** — image's vision `confidence` < 0.6 (already flagged at
   ingestion; flagged images are excluded from suggestions until manually reviewed)

If the top candidate fails any rule, and no other candidate clears the bar,
response is:
{ "match": null, "reason": "No confident match: similarity below threshold and/or subject mismatch" }

Guard verdict always includes a human-readable `reason` string, not just a boolean.