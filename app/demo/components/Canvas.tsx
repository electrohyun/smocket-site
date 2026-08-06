'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FLUSH_MS, SegmentBuffer, toPixels, toPoint, type Pt } from '../lib/stroke';
import styles from './Canvas.module.css';

/* The drawer's canvas.
 *
 * It paints its own strokes locally, which is not a shortcut: `socket.to(room)`
 * excludes the sender, so the segment it just sent never comes back to it. The
 * local paint and the emit are two paths on purpose, and that they are two is the
 * thing the delivery record next to it is proving.
 *
 * Points are coalesced and flushed on a timer rather than per pointer event; see
 * `lib/stroke.ts` for why the segment is the unit. */

interface Props {
  onSegment: (segment: ReturnType<SegmentBuffer['take']>) => void;
  /** Called when a stroke finishes, with the running total. Drives the bots. */
  onStrokeEnd: (total: number) => void;
  /** Once the round is decided, the surface stops taking new strokes. */
  disabled?: boolean;
}

export default function Canvas({ onSegment, onStrokeEnd, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef(new SegmentBuffer());
  const lastRef = useRef<Pt | null>(null);
  const strokesRef = useRef(0);

  // Every stroke's points, kept in normalised space so the picture can be redrawn
  // at whatever size the canvas becomes. The wire only ever carries a segment and
  // forgets it (stroke.ts); the drawer's own screen is the one place that has to
  // remember the whole line, because sizing the backing store wipes the pixels.
  const historyRef = useRef<Pt[][]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The backing store is sized in device pixels and the context scaled back, so
    // a line is a line rather than a blurred pair of rows.
    const context = canvas.getContext('2d');

    const style = () => {
      if (!context) return;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 2.5;
      context.strokeStyle = getComputedStyle(canvas).getPropertyValue('--ink').trim() || '#e9ebf4';
    };

    // Redraw every stroke from its points. Sizing the backing store clears it, so
    // without this the drawing is wiped every time the layout shifts — the feed
    // arriving, the window resizing — even though the strokes were never lost.
    const repaint = () => {
      if (!context) return;
      const rect = canvas.getBoundingClientRect();
      for (const stroke of historyRef.current) {
        context.beginPath();
        stroke.forEach((point, index) => {
          const [x, y] = toPixels(point, rect);
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      }
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      if (!context) return;
      context.scale(dpr, dpr);
      style();
      repaint();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // The flush timer carries `onSegment` in its dependencies rather than through
    // a ref: it restarts when the round arrives, once, and a restart costs at most
    // one flush interval.
    const timer = window.setInterval(() => {
      const segment = bufferRef.current.take();
      if (segment) onSegment(segment);
    }, FLUSH_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [onSegment]);

  const paint = useCallback((from: Pt, to: Pt) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const [x1, y1] = toPixels(from, rect);
    const [x2, y2] = toPixels(to, rect);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }, []);

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = event.currentTarget.getBoundingClientRect();
    return toPoint(event.clientX - rect.left, event.clientY - rect.top, rect);
  };

  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    // Capture, so a stroke that leaves the canvas mid-drag still finishes here.
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointAt(event);
    bufferRef.current.begin(point);
    historyRef.current.push([point]);
    lastRef.current = point;
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!bufferRef.current.active) return;
    const point = pointAt(event);
    bufferRef.current.push(point);
    historyRef.current[historyRef.current.length - 1]?.push(point);
    if (lastRef.current) paint(lastRef.current, point);
    lastRef.current = point;
  };

  const up = () => {
    const segment = bufferRef.current.end();
    if (!segment) return;
    lastRef.current = null;
    strokesRef.current += 1;
    onSegment(segment);
    onStrokeEnd(strokesRef.current);
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      aria-label="Drawing surface"
    />
  );
}
