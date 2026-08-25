const { z } = require('zod');

const ImageTagSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

// Wrapper: never trust raw model output directly
function parseImageTags(rawJson) {
  const result = ImageTagSchema.safeParse(rawJson);
  if (!result.success) {
    return { valid: false, errors: result.error.flatten(), data: null };
  }
  // Low-confidence still "valid" shape-wise, but flagged for review
  const flagged = result.data.confidence < 0.99; // see README "Limitations" for threshold rationale
  return { valid: true, flagged, data: result.data };
}

module.exports = { ImageTagSchema, parseImageTags };
