const { parseImageTags } = require('../src/schemas/imageTag.schema');

describe('Image tag schema validation', () => {
    test('accepts valid tag data', () => {
    const result = parseImageTags({
      subject: 'red fox',
      category: 'animal',
      attributes: ['orange fur', 'forest'],
      caption: 'A red fox in a forest',
      confidence: 0.995,
    });
    expect(result.valid).toBe(true);
    expect(result.flagged).toBe(false);
  });

  test('rejects missing required fields', () => {
    const result = parseImageTags({ subject: 'red fox' });
    expect(result.valid).toBe(false);
  });

  test('rejects confidence out of range', () => {
    const result = parseImageTags({
      subject: 'red fox', category: 'animal', attributes: ['fur'],
      caption: 'test', confidence: 1.5,
    });
    expect(result.valid).toBe(false);
  });

  test('flags low-confidence results instead of rejecting them', () => {
    const result = parseImageTags({
      subject: 'unclear animal', category: 'animal', attributes: ['blurry'],
      caption: 'An unclear image', confidence: 0.3,
    });
    expect(result.valid).toBe(true);
    expect(result.flagged).toBe(true);
  });
});