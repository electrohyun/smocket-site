import codePanelConfig from '../../../content/drawing-game-publication/code-panel.json';
import maintenance from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/maintenance.generated.json';
import maintenanceSnippets from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/maintenance-snippets.generated.json';
import publication from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/publication.generated.json';
import comparisonSnippets from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/snippets.generated.json';
import goldenSnippets from '../../../content/drawing-game-publication/snapshot/examples/drawing-game/snippets.generated.json';
import snapshotManifest from '../../../content/drawing-game-publication/snapshot-manifest.json';

export type CodeSampleId = 'drawing' | 'chat';
export type CodeColumnId = 'real' | 'smocket' | 'handwritten';
export type CodeColumnStatus = 'ORACLE' | 'MATCH' | 'CAPABILITY STAGE';

export interface DrawingGameCodeLine {
  lineNumber: number;
  text: string;
  highlighted: boolean;
}

export interface DrawingGameSnippet {
  id: string;
  catalogId: string;
  language: string;
  code: string;
  purpose: string;
  sourceFile: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceSha256: string;
  status?: string;
  targetId?: string;
  stageId?: string;
  loc?: number;
  additions?: number;
  deletions?: number;
  sourceStartLine: number;
  countedLineNumbers: number[];
}

export interface DrawingGameCodeColumn {
  id: CodeColumnId;
  title: string;
  status: CodeColumnStatus;
  summary: string;
  snippet: DrawingGameSnippet;
  lines: DrawingGameCodeLine[];
}

export interface SmocketIntegrationMetrics {
  totalLoc: number;
  bootstrapLoc: number;
  substitutionAndRegistrationLoc: number;
}

export interface HandwrittenDiffMetric {
  snippetId: string;
  stageId: string;
  additions: number;
  deletions: number;
}

export interface HandwrittenStageMetrics {
  stageId: string;
  totalLoc: number;
  fullWorkflowLoc: number;
  supportDescription: string;
  diffs: HandwrittenDiffMetric[];
}

export interface DrawingGameCodeSample {
  id: CodeSampleId;
  title: string;
  description: string;
  columns: [DrawingGameCodeColumn, DrawingGameCodeColumn, DrawingGameCodeColumn];
  applicationComparison: {
    codeEqual: true;
    sourceHashEqual: true;
    changedLoc: 0;
  };
  smocketIntegration: SmocketIntegrationMetrics;
  handwritten: HandwrittenStageMetrics;
}

export interface DrawingGameCodeModel {
  publicationCommit: string;
  sourceRevision: string;
  samples: Record<CodeSampleId, DrawingGameCodeSample>;
  snippets: ReadonlyMap<string, DrawingGameSnippet>;
}

interface ModelInput {
  manifest: unknown;
  publication: unknown;
  catalogs: Record<string, unknown>;
  maintenance: unknown;
  config: unknown;
}

interface RawSnippet {
  id: string;
  language: string;
  code: string;
  purpose: string;
  sourceFile?: string;
  previousSourceFile?: string;
  currentSourceFile?: string;
  sourceSha256: string;
  status?: string;
  targetId?: string;
  stageId?: string;
  loc?: number;
  additions?: number;
  deletions?: number;
  sourceStartLine: number;
  countedLineNumbers: number[];
}

const SAMPLE_IDS: CodeSampleId[] = ['drawing', 'chat'];

function fail(message: string): never {
  throw new Error(`Invalid drawing-game code model: ${message}`);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${path} must be a non-empty string`);
  }
  return value;
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${path} must be a number`);
  return value;
}

function optionalNumber(value: unknown, path: string): number | undefined {
  return value === undefined ? undefined : number(value, path);
}

function parseSnippet(value: unknown, path: string): RawSnippet {
  const snippet = object(value, path);
  const language = string(snippet.language, `${path}.language`);
  let sourceStartLine = 1;
  if (snippet.sourceRange !== undefined) {
    sourceStartLine = number(
      object(snippet.sourceRange, `${path}.sourceRange`).startLine,
      `${path}.sourceRange.startLine`,
    );
  }
  const countedLineNumbers =
    snippet.countedLineNumbers === undefined
      ? []
      : array(snippet.countedLineNumbers, `${path}.countedLineNumbers`).map((line, index) =>
          number(line, `${path}.countedLineNumbers[${index}]`),
        );

  const raw: RawSnippet = {
    id: string(snippet.id, `${path}.id`),
    language,
    code: string(snippet.code, `${path}.code`),
    purpose: string(snippet.purpose, `${path}.purpose`),
    sourceFile: typeof snippet.sourceFile === 'string' ? snippet.sourceFile : undefined,
    previousSourceFile:
      typeof snippet.previousSourceFile === 'string' ? snippet.previousSourceFile : undefined,
    currentSourceFile:
      typeof snippet.currentSourceFile === 'string' ? snippet.currentSourceFile : undefined,
    sourceSha256:
      typeof snippet.sourceSha256 === 'string' && snippet.sourceSha256.length > 0
        ? snippet.sourceSha256
        : '',
    status: typeof snippet.status === 'string' ? snippet.status : undefined,
    targetId: typeof snippet.targetId === 'string' ? snippet.targetId : undefined,
    stageId: typeof snippet.stageId === 'string' ? snippet.stageId : undefined,
    loc: optionalNumber(snippet.loc, `${path}.loc`),
    additions: optionalNumber(snippet.additions, `${path}.additions`),
    deletions: optionalNumber(snippet.deletions, `${path}.deletions`),
    sourceStartLine,
    countedLineNumbers,
  };

  if (language === 'diff') {
    string(raw.previousSourceFile, `${path}.previousSourceFile`);
    string(raw.currentSourceFile, `${path}.currentSourceFile`);
  } else {
    string(raw.sourceFile, `${path}.sourceFile`);
  }
  return raw;
}

function sourceDetails(snippet: RawSnippet) {
  if (snippet.language === 'diff') {
    return {
      sourceFile: snippet.currentSourceFile!,
      sourceLabel: `${snippet.previousSourceFile} → ${snippet.currentSourceFile}`,
    };
  }
  return { sourceFile: snippet.sourceFile!, sourceLabel: snippet.sourceFile! };
}

function snippetLines(
  snippet: DrawingGameSnippet,
  highlightedSourceLines = new Set<number>(),
): DrawingGameCodeLine[] {
  return snippet.code.split('\n').map((text, index) => {
    const lineNumber = snippet.sourceStartLine + index;
    return { lineNumber, text, highlighted: highlightedSourceLines.has(lineNumber) };
  });
}

function highlightedLinesFromDiffs(
  source: DrawingGameSnippet,
  diffs: DrawingGameSnippet[],
): Set<number> {
  const addedLines = new Set(
    diffs.flatMap((diff) =>
      diff.code
        .split('\n')
        .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
        .map((line) => line.slice(1)),
    ),
  );
  const counted = new Set(source.countedLineNumbers);
  const highlighted = new Set<number>();
  for (const [index, line] of source.code.split('\n').entries()) {
    const lineNumber = source.sourceStartLine + index;
    if (addedLines.has(line) && (counted.size === 0 || counted.has(lineNumber))) {
      highlighted.add(lineNumber);
    }
  }
  return highlighted;
}

function getSnippet(index: Map<string, DrawingGameSnippet>, id: string, path: string) {
  const snippet = index.get(id);
  if (!snippet) fail(`${path} does not exist: ${id}`);
  return snippet;
}

function readSmocketIntegration(maintenanceRecord: Record<string, unknown>) {
  const integration = object(
    maintenanceRecord.smocketIntegration,
    'maintenance.smocketIntegration',
  );
  const totalLoc = number(integration.totalLoc, 'maintenance.smocketIntegration.totalLoc');
  const blocks = array(integration.sourceBlocks, 'maintenance.smocketIntegration.sourceBlocks').map(
    (value, index) => {
      const path = `maintenance.smocketIntegration.sourceBlocks[${index}]`;
      const block = object(value, path);
      return { role: string(block.role, `${path}.role`), loc: number(block.loc, `${path}.loc`) };
    },
  );
  const bootstrapLoc = blocks.find(({ role }) => role === 'smocket-bootstrap')?.loc;
  if (bootstrapLoc === undefined) fail('maintenance Smocket bootstrap LOC is missing');
  const substitutionAndRegistrationLoc = blocks
    .filter(({ role }) => role !== 'smocket-bootstrap')
    .reduce((sum, block) => sum + block.loc, 0);
  if (bootstrapLoc + substitutionAndRegistrationLoc !== totalLoc) {
    fail('maintenance Smocket integration LOC does not equal its source-block total');
  }
  return { totalLoc, bootstrapLoc, substitutionAndRegistrationLoc };
}

export function createDrawingGameCodeModel(input: ModelInput): DrawingGameCodeModel {
  const manifest = object(input.manifest, 'manifest');
  const publicationCommit = string(manifest.publicationCommit, 'manifest.publicationCommit');
  const publicationValue = object(input.publication, 'publication');
  if (publicationValue.publication !== 'drawing-game') {
    fail('publication.publication must be drawing-game');
  }
  const sourceRevision = string(publicationValue.sourceRevision, 'publication.sourceRevision');
  const publicationSnippets = object(publicationValue.snippets, 'publication.snippets');
  const catalogRefs = array(publicationSnippets.catalogs, 'publication.snippets.catalogs');

  const snippetIndex = new Map<string, DrawingGameSnippet>();
  for (const [catalogIndex, catalogReference] of catalogRefs.entries()) {
    const referencePath = `publication.snippets.catalogs[${catalogIndex}]`;
    const reference = object(catalogReference, referencePath);
    const catalogId = string(reference.artifactId, `${referencePath}.artifactId`);
    const catalog = object(input.catalogs[catalogId], `catalogs.${catalogId}`);
    const snippets = array(catalog.snippets, `catalogs.${catalogId}.snippets`);
    const declaredIds = array(reference.snippetIds, `${referencePath}.snippetIds`).map(
      (id, index) => string(id, `${referencePath}.snippetIds[${index}]`),
    );
    const actualIds: string[] = [];

    for (const [snippetIndexInCatalog, rawValue] of snippets.entries()) {
      const raw = parseSnippet(
        rawValue,
        `catalogs.${catalogId}.snippets[${snippetIndexInCatalog}]`,
      );
      if (snippetIndex.has(raw.id)) fail(`duplicate snippet id: ${raw.id}`);
      actualIds.push(raw.id);
      const source = sourceDetails(raw);
      snippetIndex.set(raw.id, {
        ...raw,
        catalogId,
        ...source,
        sourceUrl: `https://github.com/electrohyun/smocket/blob/${publicationCommit}/${source.sourceFile}`,
      });
    }

    if (
      actualIds.length !== declaredIds.length ||
      actualIds.some((id, index) => id !== declaredIds[index])
    ) {
      fail(`${referencePath}.snippetIds do not match ${catalogId}`);
    }
  }

  const maintenanceRecord = object(input.maintenance, 'maintenance');
  const stages = array(maintenanceRecord.stages, 'maintenance.stages').map((value, index) =>
    object(value, `maintenance.stages[${index}]`),
  );
  const fullWorkflow = stages.find((stage) => stage.id === 'full-workflow');
  if (!fullWorkflow) fail('maintenance full-workflow stage is missing');
  const fullWorkflowLoc = number(fullWorkflow.totalLoc, 'maintenance.full-workflow.totalLoc');
  const smocketIntegration = readSmocketIntegration(maintenanceRecord);

  const config = object(input.config, 'config');
  if (config.schemaVersion !== 2) fail('config.schemaVersion must be 2');
  const rawSamples = object(config.samples, 'config.samples');
  const samples = {} as Record<CodeSampleId, DrawingGameCodeSample>;

  for (const sampleId of SAMPLE_IDS) {
    const samplePath = `config.samples.${sampleId}`;
    const rawSample = object(rawSamples[sampleId], samplePath);
    const real = getSnippet(
      snippetIndex,
      string(rawSample.realSnippetId, `${samplePath}.realSnippetId`),
      `${samplePath}.realSnippetId`,
    );
    const smocket = getSnippet(
      snippetIndex,
      string(rawSample.smocketSnippetId, `${samplePath}.smocketSnippetId`),
      `${samplePath}.smocketSnippetId`,
    );
    if (real.status !== 'ORACLE' || real.targetId !== 'real') {
      fail(`${samplePath}.realSnippetId must reference a Real ORACLE snippet`);
    }
    if (smocket.status !== 'MATCH' || smocket.targetId !== 'smocket') {
      fail(`${samplePath}.smocketSnippetId must reference a Smocket MATCH snippet`);
    }
    if (!real.sourceSha256 || !smocket.sourceSha256) {
      fail(`${samplePath} Real and Smocket snippets must include source SHA-256`);
    }
    if (real.code !== smocket.code) {
      fail(`${samplePath} Real and Smocket handler code must be identical`);
    }
    if (real.sourceSha256 !== smocket.sourceSha256) {
      fail(`${samplePath} Real and Smocket source SHA-256 must be identical`);
    }

    const handwrittenConfig = object(rawSample.handwritten, `${samplePath}.handwritten`);
    const stageId = string(handwrittenConfig.stageId, `${samplePath}.handwritten.stageId`);
    const source = getSnippet(
      snippetIndex,
      string(handwrittenConfig.sourceSnippetId, `${samplePath}.handwritten.sourceSnippetId`),
      `${samplePath}.handwritten.sourceSnippetId`,
    );
    if (source.stageId !== stageId || source.language === 'diff') {
      fail(`${samplePath}.handwritten.sourceSnippetId must reference ${stageId} source`);
    }
    if (!source.sourceSha256) {
      fail(`${samplePath}.handwritten.sourceSnippetId must include source SHA-256`);
    }
    const stage = stages.find((candidate) => candidate.id === stageId);
    if (!stage) fail(`${samplePath}.handwritten.stageId does not exist: ${stageId}`);
    const totalLoc = number(stage.totalLoc, `maintenance.stages.${stageId}.totalLoc`);
    if (source.loc !== totalLoc) {
      fail(`${samplePath} handwritten source LOC does not match stage total`);
    }

    const diffs = array(
      handwrittenConfig.diffSnippetIds,
      `${samplePath}.handwritten.diffSnippetIds`,
    ).map((rawId, index) => {
      const path = `${samplePath}.handwritten.diffSnippetIds[${index}]`;
      const diff = getSnippet(snippetIndex, string(rawId, path), path);
      if (diff.language !== 'diff') fail(`${path} must reference a diff snippet`);
      return diff;
    });
    const diffMetrics = diffs.map((diff) => ({
      snippetId: diff.id,
      stageId: string(diff.stageId, `${diff.id}.stageId`),
      additions: number(diff.additions, `${diff.id}.additions`),
      deletions: number(diff.deletions, `${diff.id}.deletions`),
    }));
    const highlightedLines = highlightedLinesFromDiffs(source, diffs);

    samples[sampleId] = {
      id: sampleId,
      title: string(rawSample.title, `${samplePath}.title`),
      description: string(rawSample.description, `${samplePath}.description`),
      columns: [
        {
          id: 'real',
          title: 'Real Socket.IO',
          status: 'ORACLE',
          summary: 'Recorded behavior oracle for this workflow step.',
          snippet: real,
          lines: snippetLines(real),
        },
        {
          id: 'smocket',
          title: 'Smocket',
          status: 'MATCH',
          summary: 'The same Socket.IO-shaped handler matched the recorded oracle.',
          snippet: smocket,
          lines: snippetLines(smocket),
        },
        {
          id: 'handwritten',
          title: 'Handwritten mock',
          status: 'CAPABILITY STAGE',
          summary: 'Application-owned transport for this capability stage.',
          snippet: source,
          lines: snippetLines(source, highlightedLines),
        },
      ],
      applicationComparison: {
        codeEqual: true,
        sourceHashEqual: true,
        changedLoc: 0,
      },
      smocketIntegration,
      handwritten: {
        stageId,
        totalLoc,
        fullWorkflowLoc,
        supportDescription: string(
          handwrittenConfig.supportDescription,
          `${samplePath}.handwritten.supportDescription`,
        ),
        diffs: diffMetrics,
      },
    };
  }

  return { publicationCommit, sourceRevision, samples, snippets: snippetIndex };
}

const vendoredInput: ModelInput = {
  manifest: snapshotManifest,
  publication,
  catalogs: {
    'golden-snippets': goldenSnippets,
    'comparison-snippets': comparisonSnippets,
    'maintenance-snippets': maintenanceSnippets,
  },
  maintenance,
  config: codePanelConfig,
};

export const drawingGameCodeModel = createDrawingGameCodeModel(vendoredInput);

export function getDrawingGameSnippet(id: string): DrawingGameSnippet {
  const snippet = drawingGameCodeModel.snippets.get(id);
  if (!snippet) fail(`snippet id does not exist: ${id}`);
  return snippet;
}
