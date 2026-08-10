import styles from './SocketCode.module.css';

const socketTokens: Record<string, string> = {
  a: 'A',
  socketA: 'A',
  aReceived: 'A',
  b: 'B',
  socketB: 'B',
  onB: 'B',
  c: 'C',
  socketC: 'C',
  onC: 'C',
};

const socketPattern = /\b(socketA|aReceived|socketB|socketC|onB|onC|a|b|c)\b/g;

export default function SocketCode({ code }: { code: string }) {
  return code.split(socketPattern).map((part, index) => {
    const socket = socketTokens[part];
    return socket ? (
      <span key={index} className={styles.socket} data-socket={socket}>
        {part}
      </span>
    ) : (
      part
    );
  });
}
