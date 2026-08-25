const SIMILARITY_THRESHOLD = 0.60; // tune this after seeing more data
const CONFIDENCE_THRESHOLD = 0.6;

// Naive category/subject extraction from post text — checks if the post's
// primary subject appears to differ from the candidate image's subject/category.
function checkCategoryMismatch(postText, candidate) {
  const postLower = postText.toLowerCase();
  const subjectLower = candidate.subject.toLowerCase();
  const categoryLower = candidate.category.toLowerCase();

  // crude heuristic: does the post mention the image's category at all?
  const categoryMentioned = postLower.includes(categoryLower);

  // does the post mention a DIFFERENT specific animal than this image's subject?
  const knownAnimals = ['fox', 'wolf', 'dog', 'bear', 'deer'];
  const postAnimal = knownAnimals.find(a => postLower.includes(a));
  const imageAnimal = knownAnimals.find(a => subjectLower.includes(a));

  if (postAnimal && imageAnimal && postAnimal !== imageAnimal) {
    return {
      mismatch: true,
      reason: `Animal category mismatch: expected ${postAnimal}, detected ${imageAnimal}`,
    };
  }

  return { mismatch: false };
}

function evaluateCandidate(postText, candidate) {
  const categoryCheck = checkCategoryMismatch(postText, candidate);
  if (categoryCheck.mismatch) {
    return { approved: false, reason: categoryCheck.reason };
  }

  if (candidate.confidence < CONFIDENCE_THRESHOLD) {
    return { approved: false, reason: `Low confidence tag (${candidate.confidence}), needs manual review` };
  }

  if (candidate.similarity < SIMILARITY_THRESHOLD) {
    return { approved: false, reason: `Similarity below threshold (${candidate.similarity.toFixed(3)} < ${SIMILARITY_THRESHOLD})` };
  }

  return { approved: true, reason: 'Passed all checks' };
}

module.exports = { evaluateCandidate, SIMILARITY_THRESHOLD, CONFIDENCE_THRESHOLD };