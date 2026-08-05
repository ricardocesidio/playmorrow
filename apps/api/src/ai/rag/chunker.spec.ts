import { TextChunker } from './chunker';

describe('TextChunker', () => {
  let chunker: TextChunker;

  beforeEach(() => {
    chunker = new TextChunker({ maxTokens: 100, overlap: 0.2 });
  });

  it('should be defined', () => {
    expect(chunker).toBeDefined();
  });

  it('should chunk text by paragraphs', () => {
    const text = [
      'Paragraph one with some content.',
      'Paragraph two with different content.',
      'Paragraph three with even more content.',
    ].join('\n\n');

    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].text).toContain('Paragraph one');
    expect(chunks[0].index).toBe(0);
  });

  it('should respect max tokens', () => {
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`);
    const longText = words.join(' ');

    const chunks = chunker.chunk(longText);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(100);
    }
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should include overlap between chunks', () => {
    const highOverlapChunker = new TextChunker({ maxTokens: 15, overlap: 0.6 });
    const words = Array.from({ length: 40 }, (_, i) => `word${i}`);
    const text = words.join(' ');

    const chunks = highOverlapChunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);

    let foundOverlap = false;
    for (let i = 1; i < chunks.length; i++) {
      const prevWords = new Set(chunks[i - 1].text.split(/\s+/));
      const currWords = chunks[i].text.split(/\s+/);
      const hasOverlap = currWords.some((w) => prevWords.has(w));
      if (hasOverlap) {
        foundOverlap = true;
        break;
      }
    }
    expect(foundOverlap).toBe(true);
  });

  it('should handle short text', () => {
    const shortText = 'Short text.';
    const chunks = chunker.chunk(shortText);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Short text.');
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it('should handle empty text', () => {
    expect(chunker.chunk('')).toEqual([]);
    expect(chunker.chunk('   \n\n   ')).toEqual([]);
  });

  it('should chunk with metadata', () => {
    const text = 'Paragraph A content.\n\nParagraph B content.';
    const metadata = { sourceType: 'devlog', sourceId: 'devlog-42' };
    const chunks = chunker.chunk(text, metadata);

    for (const chunk of chunks) {
      expect(chunk.metadata).toEqual(metadata);
    }
  });

  it('should assign sequential indices', () => {
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const chunks = chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
    }
  });

  it('should compute approximate token counts', () => {
    const text = 'This is a test sentence with ten words in it.';
    const chunks = chunker.chunk(text);
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
    expect(chunks[0].tokenCount).toBeLessThanOrEqual(text.length);
  });
});
