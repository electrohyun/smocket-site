export type JourneyStop = {
  id: string;
  top: number;
};

export function deriveJourneyState(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
  stops: readonly JourneyStop[],
): { progress: number; currentId: string } {
  const scrollable = Math.max(0, documentHeight - viewportHeight);
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollY / scrollable)) : 0;
  const focusLine = scrollY + viewportHeight * 0.38;
  const current = stops.reduce<JourneyStop | undefined>(
    (selected, stop) => (stop.top <= focusLine ? stop : selected),
    undefined,
  );

  return {
    progress,
    currentId: current?.id ?? stops[0]?.id ?? '',
  };
}
