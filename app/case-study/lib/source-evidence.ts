import { readFileSync } from 'node:fs';

export const SOURCE_PATHS = [
  'examples/chat-room/app.js',
  'examples/chat-room/scenario.js',
  'examples/chat-room/assertions.js',
  'case-studies/chat-room/fixtures/socket-io/bootstrap.js',
  'case-studies/chat-room/fixtures/published-smocket/bootstrap.js',
  'case-studies/chat-room/fixtures/handwritten/bootstrap.js',
  'case-studies/chat-room/fixtures/handwritten/handwritten-socket-io.js',
] as const;

export type SourcePath = (typeof SOURCE_PATHS)[number];
export type CaseStudySources = Record<SourcePath, string>;

const sourceRoot = new URL('../../../content/case-study-sources/', import.meta.url);

export function loadCaseStudySources(): CaseStudySources {
  return Object.fromEntries(
    SOURCE_PATHS.map((path) => [path, readFileSync(new URL(path, sourceRoot), 'utf8')]),
  ) as CaseStudySources;
}

export interface ExcerptRange {
  path: SourcePath;
  startLine: number;
  endLine: number;
}

export function excerptSource(sources: CaseStudySources, range: ExcerptRange): string {
  return sources[range.path]
    .split('\n')
    .slice(range.startLine - 1, range.endLine)
    .join('\n');
}
