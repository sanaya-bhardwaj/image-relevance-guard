const { evaluateCandidate } = require('../src/services/guardService');

describe('Mismatch guard', () => {
  test('rejects wolf candidate for fox post', () => {
    const postText = 'Red foxes are cunning animals found in forests.';
    const candidate = { subject: 'gray wolf', category: 'animal', confidence: 0.98, similarity: 0.79 };
    const verdict = evaluateCandidate(postText, candidate);
    expect(verdict.approved).toBe(false);
    expect(verdict.reason).toMatch(/mismatch/i);
  });

  test('approves fox candidate for fox post above threshold', () => {
    const postText = 'Red foxes are cunning animals found in forests.';
    const candidate = { subject: 'red fox', category: 'animal', confidence: 0.98, similarity: 0.74 };
    const verdict = evaluateCandidate(postText, candidate);
    expect(verdict.approved).toBe(true);
  });

  test('rejects candidate below similarity threshold', () => {
    const postText = 'Vintage cars from the 1960s.';
    const candidate = { subject: 'red deer', category: 'animal', confidence: 0.98, similarity: 0.3 };
    const verdict = evaluateCandidate(postText, candidate);
    expect(verdict.approved).toBe(false);
    expect(verdict.reason).toMatch(/threshold/i);
  });

  test('rejects low-confidence candidate even if similar', () => {
    const postText = 'Red foxes in the wild.';
    const candidate = { subject: 'red fox', category: 'animal', confidence: 0.4, similarity: 0.8 };
    const verdict = evaluateCandidate(postText, candidate);
    expect(verdict.approved).toBe(false);
  });
});