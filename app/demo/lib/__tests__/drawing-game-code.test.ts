import { describe, expect, it } from 'vitest';
import config from '../../../../content/drawing-game-publication/code-panel.json';
import maintenance from '../../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/maintenance.generated.json';
import maintenanceCatalog from '../../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/maintenance-snippets.generated.json';
import publication from '../../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/publication.generated.json';
import comparisonCatalog from '../../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/snippets.generated.json';
import goldenCatalog from '../../../../content/drawing-game-publication/snapshot/examples/drawing-game/snippets.generated.json';
import manifest from '../../../../content/drawing-game-publication/snapshot-manifest.json';
import {
  createDrawingGameCodeModel,
  drawingGameCodeModel,
  getDrawingGameSnippet,
} from '../drawing-game-code';

const canonicalById = new Map(
  [...goldenCatalog.snippets, ...comparisonCatalog.snippets, ...maintenanceCatalog.snippets].map(
    (snippet) => [snippet.id, snippet],
  ),
);

const modelInput = {
  manifest,
  publication,
  catalogs: {
    'golden-snippets': goldenCatalog,
    'comparison-snippets': comparisonCatalog,
    'maintenance-snippets': maintenanceCatalog,
  },
  maintenance,
  config,
};

describe('drawing-game fixed code comparison model', () => {
  it('uses the fixed Drawing snippets and verifies identical Real/Smocket application code', () => {
    const sample = drawingGameCodeModel.samples.drawing;
    const [real, smocket, handwritten] = sample.columns;

    expect(sample.columns.map((column) => column.title)).toEqual([
      'Real Socket.IO',
      'Smocket',
      'Handwritten mock',
    ]);
    expect(real.snippet.id).toBe('real.3-sender-excluded-stroke');
    expect(real.status).toBe('ORACLE');
    expect(smocket.snippet.id).toBe('smocket.3-sender-excluded-stroke');
    expect(smocket.status).toBe('MATCH');
    expect(real.snippet.code).toBe(smocket.snippet.code);
    expect(real.snippet.sourceSha256).toBe(smocket.snippet.sourceSha256);
    expect(sample.applicationComparison).toEqual({
      codeEqual: true,
      sourceHashEqual: true,
      changedLoc: 0,
    });
    expect(handwritten.snippet.id).toBe('handwritten.sender-exclusion.source.transport');
    expect(sample.handwritten).toMatchObject({
      stageId: 'sender-exclusion',
      totalLoc: 55,
      fullWorkflowLoc: 140,
      diffs: [
        {
          snippetId: 'handwritten.sender-exclusion.diff.transport',
          additions: 5,
          deletions: 3,
        },
      ],
    });
  });

  it('uses the fixed Chat snippets and links 56 LOC to targeted delivery only', () => {
    const sample = drawingGameCodeModel.samples.chat;
    const [real, smocket, handwritten] = sample.columns;

    expect(real.snippet.id).toBe('real.5-correct-guess');
    expect(real.status).toBe('ORACLE');
    expect(smocket.snippet.id).toBe('smocket.5-correct-guess');
    expect(smocket.status).toBe('MATCH');
    expect(real.snippet.code).toBe(smocket.snippet.code);
    expect(real.snippet.sourceSha256).toBe(smocket.snippet.sourceSha256);
    expect(handwritten.snippet.id).toBe('handwritten.targeted-delivery.source.transport');
    expect(sample.handwritten).toMatchObject({
      stageId: 'targeted-delivery',
      totalLoc: 56,
      fullWorkflowLoc: 140,
      diffs: [
        {
          snippetId: 'handwritten.acknowledgement.diff.transport',
          additions: 3,
          deletions: 3,
        },
        {
          snippetId: 'handwritten.targeted-delivery.diff.transport',
          additions: 6,
          deletions: 5,
        },
      ],
    });
  });

  it('derives Smocket integration totals from maintenance source blocks', () => {
    expect(drawingGameCodeModel.samples.drawing.smocketIntegration).toEqual({
      totalLoc: 18,
      bootstrapLoc: 6,
      clientSubstitutionLoc: 10,
      loaderRegistrationLoc: 2,
    });
  });

  it('derives the adjacent Handwritten stage LOC shown beside Smocket', () => {
    expect(drawingGameCodeModel.samples.drawing.handwritten.prerequisite).toEqual({
      stageId: 'room-broadcast',
      totalLoc: 53,
    });
    expect(drawingGameCodeModel.samples.chat.handwritten.prerequisite).toEqual({
      stageId: 'acknowledgement',
      totalLoc: 55,
    });
  });

  it('keeps every displayed code body byte-identical to its canonical snippet', () => {
    for (const sample of Object.values(drawingGameCodeModel.samples)) {
      for (const column of sample.columns) {
        expect(column.snippet.code).toBe(canonicalById.get(column.snippet.id)?.code);
        expect(column.snippet.sourceUrl).toContain(
          `/blob/${drawingGameCodeModel.publicationCommit}/${column.snippet.sourceFile}`,
        );
      }
    }
  });

  it('derives Handwritten highlighted lines only from the configured diff additions', () => {
    for (const sample of Object.values(drawingGameCodeModel.samples)) {
      const sourceColumn = sample.columns[2];
      const addedLines = new Set(
        sample.handwritten.diffs.flatMap(({ snippetId }) =>
          getDrawingGameSnippet(snippetId)
            .code.split('\n')
            .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
            .map((line) => line.slice(1)),
        ),
      );
      const highlighted = sourceColumn.lines.filter((line) => line.highlighted);
      expect(highlighted.length).toBeGreaterThan(0);
      expect(highlighted.every((line) => addedLines.has(line.text))).toBe(true);
    }
  });

  it('fails when a configured fixed snippet id does not exist', () => {
    const changedConfig = structuredClone(config);
    changedConfig.samples.drawing.realSnippetId = 'missing-snippet';

    expect(() => createDrawingGameCodeModel({ ...modelInput, config: changedConfig })).toThrow(
      /does not exist: missing-snippet/,
    );
  });
});
