import { describe, expect, it } from 'vitest';
import maintenanceCatalog from '../../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/maintenance-snippets.generated.json';
import goldenCatalog from '../../../../content/drawing-game-publication/snapshot/examples/drawing-game/snippets.generated.json';
import {
  drawingGameCodeModel,
  getDrawingGameSnippet,
  type CodeSampleId,
} from '../drawing-game-code';

const EXPECTED_IDS: Record<CodeSampleId, string[]> = {
  drawing: [
    'drawing-server-handler',
    'drawing-client',
    'smocket.integration.smocket-bootstrap',
    'smocket.integration.smocket-client-substitution',
    'handwritten.room-broadcast.source.transport',
    'handwritten.room-broadcast.diff.transport',
    'handwritten.sender-exclusion.source.transport',
    'handwritten.sender-exclusion.diff.transport',
  ],
  chat: [
    'chat-guess-server-handler',
    'chat-guess-client',
    'acknowledgement',
    'targeted-correct',
    'smocket.integration.smocket-client-substitution',
    'smocket.integration.smocket-loader-registration',
    'handwritten.acknowledgement.source.transport',
    'handwritten.acknowledgement.diff.transport',
    'handwritten.targeted-delivery.source.transport',
    'handwritten.targeted-delivery.diff.transport',
  ],
};

const canonicalById = new Map(
  [...goldenCatalog.snippets, ...maintenanceCatalog.snippets].map((snippet) => [
    snippet.id,
    snippet,
  ]),
);

describe('drawing-game code model', () => {
  it('keeps the three cards scoped to shared code, Smocket wiring, and handwritten support', () => {
    for (const sample of Object.values(drawingGameCodeModel.samples)) {
      expect(sample.cards.map((card) => card.id)).toEqual(['shared', 'smocket', 'handwritten']);
      expect(sample.cards.map((card) => card.title)).toEqual([
        'Shared application handler',
        'Smocket wiring',
        'Handwritten mock support',
      ]);
    }
  });

  it.each(Object.entries(EXPECTED_IDS) as [CodeSampleId, string[]][])(
    'resolves every required %s snippet to byte-identical canonical code',
    (sampleId, expectedIds) => {
      const actual = drawingGameCodeModel.samples[sampleId].cards.flatMap((card) =>
        card.snippets.map((snippet) => snippet.id),
      );
      expect(actual).toEqual(expectedIds);

      for (const id of actual) {
        const snippet = getDrawingGameSnippet(id);
        expect(snippet.code).toBe(canonicalById.get(id)?.code);
        expect(snippet.sourceUrl).toContain(
          `/blob/${drawingGameCodeModel.publicationCommit}/${snippet.sourceFile}`,
        );
      }
    },
  );
});
