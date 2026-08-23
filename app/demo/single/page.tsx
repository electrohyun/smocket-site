import DemoBrand from '../components/DemoBrand';
import Stage from '../components/Stage';

export default async function SingleTabDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initial = params.view === 'observer' ? 'observer' : 'drawer';
  const replay = 'replay' in params;
  const initialDelay = Number(params.delay) || 0;

  return (
    <>
      <DemoBrand />
      <Stage initial={initial} replay={replay} initialDelay={initialDelay} />
    </>
  );
}
