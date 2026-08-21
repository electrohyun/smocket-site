import codePanelConfig from '../../../content/drawing-game-publication/code-panel.json';
import publication from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/publication.generated.json';
import comparisonSnippets from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/snippets.generated.json';
import maintenanceSnippets from '../../../content/drawing-game-publication/snapshot/case-studies/drawing-game/maintenance-snippets.generated.json';
import goldenSnippets from '../../../content/drawing-game-publication/snapshot/examples/drawing-game/snippets.generated.json';
import snapshotManifest from '../../../content/drawing-game-publication/snapshot-manifest.json';

export type CodeSampleId = 'drawing' | 'chat';
export type CodeCardId = 'shared' | 'smocket' | 'handwritten';

export interface DrawingGameSnippet {
  id: string;
  label: string;
  catalogId: string;
  language: string;
  code: string;
  purpose: string;
  role: string;
  sourceFile: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface DrawingGameCodeCard {
  id: CodeCardId;
  title: string;
  meta: string;
  description: string;
  snippets: DrawingGameSnippet[];
}

export interface DrawingGameCodeSample {
  id: CodeSampleId;
  title: string;
  description: string;
  cards: DrawingGameCodeCard[];
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
  config: unknown;
}

interface RawSnippet {
  id: string;
  language: string;
  code: string;
  purpose: string;
  role?: string;
  sourceFile?: string;
  previousSourceFile?: string;
  currentSourceFile?: string;
}

const CARD_IDS: CodeCardId[] = ['shared', 'smocket', 'handwritten'];
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

function parseSnippet(value: unknown, path: string): RawSnippet {
  const snippet = object(value, path);
  const language = string(snippet.language, `${path}.language`);
  const raw: RawSnippet = {
    id: string(snippet.id, `${path}.id`),
    language,
    code: string(snippet.code, `${path}.code`),
    purpose: string(snippet.purpose, `${path}.purpose`),
    role: typeof snippet.role === 'string' ? snippet.role : undefined,
    sourceFile: typeof snippet.sourceFile === 'string' ? snippet.sourceFile : undefined,
    previousSourceFile:
      typeof snippet.previousSourceFile === 'string' ? snippet.previousSourceFile : undefined,
    currentSourceFile:
      typeof snippet.currentSourceFile === 'string' ? snippet.currentSourceFile : undefined,
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
        id: raw.id,
        label: raw.id,
        catalogId,
        language: raw.language,
        code: raw.code,
        purpose: raw.purpose,
        role: raw.role ?? 'snippet',
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

  const config = object(input.config, 'config');
  if (config.schemaVersion !== 1) fail('config.schemaVersion must be 1');
  const rawSamples = object(config.samples, 'config.samples');
  const samples = {} as Record<CodeSampleId, DrawingGameCodeSample>;

  for (const sampleId of SAMPLE_IDS) {
    const samplePath = `config.samples.${sampleId}`;
    const rawSample = object(rawSamples[sampleId], samplePath);
    const rawCards = array(rawSample.cards, `${samplePath}.cards`);
    const cards = rawCards.map((rawCard, cardIndex): DrawingGameCodeCard => {
      const cardPath = `${samplePath}.cards[${cardIndex}]`;
      const card = object(rawCard, cardPath);
      const cardId = string(card.id, `${cardPath}.id`) as CodeCardId;
      if (cardId !== CARD_IDS[cardIndex]) {
        fail(`${samplePath}.cards must be shared, smocket, handwritten`);
      }

      const seenSelections = new Set<string>();
      const selections = array(card.snippets, `${cardPath}.snippets`).map(
        (rawSelection, selectionIndex): DrawingGameSnippet => {
          const selectionPath = `${cardPath}.snippets[${selectionIndex}]`;
          const selection = object(rawSelection, selectionPath);
          const id = string(selection.id, `${selectionPath}.id`);
          if (seenSelections.has(id)) fail(`duplicate selected snippet id in ${cardPath}: ${id}`);
          seenSelections.add(id);
          const snippet = snippetIndex.get(id);
          if (!snippet) fail(`${selectionPath}.id does not exist: ${id}`);
          return {
            ...snippet,
            label: string(selection.label, `${selectionPath}.label`),
            role: string(selection.role, `${selectionPath}.role`),
          };
        },
      );
      if (selections.length === 0) fail(`${cardPath}.snippets must not be empty`);

      return {
        id: cardId,
        title: string(card.title, `${cardPath}.title`),
        meta: string(card.meta, `${cardPath}.meta`),
        description: string(card.description, `${cardPath}.description`),
        snippets: selections,
      };
    });

    samples[sampleId] = {
      id: sampleId,
      title: string(rawSample.title, `${samplePath}.title`),
      description: string(rawSample.description, `${samplePath}.description`),
      cards,
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
  config: codePanelConfig,
};

export const drawingGameCodeModel = createDrawingGameCodeModel(vendoredInput);

export function getDrawingGameSnippet(id: string): DrawingGameSnippet {
  const snippet = drawingGameCodeModel.snippets.get(id);
  if (!snippet) fail(`snippet id does not exist: ${id}`);
  return snippet;
}
