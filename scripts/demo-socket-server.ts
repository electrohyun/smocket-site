import { startRealDemoServer } from '../app/demo/server/real';

const port = Number(process.env.DEMO_SOCKET_PORT ?? 4000);

async function main(): Promise<void> {
  const application = await startRealDemoServer({ port });
  console.log(`Real Socket.IO demo server listening at ${application.url}`);

  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    await application.close();
    process.exitCode = 0;
  };

  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
