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
}

export default function Canvas({ onSegment, onStrokeEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef(new SegmentBuffer());
  const lastRef = useRef<Pt | null>(null);
  const strokesRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The backing store is sized in device pixels and the context scaled back, so
    // a line is a line rather than a blurred pair of rows.
    const context = canvas.getContext('2d');
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      if (!context) return;
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 2.5;
      context.strokeStyle = getComputedStyle(canvas).getPropertyValue('--ink').trim() || '#e9ebf4';
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
    // Capture, so a stroke that leaves the canvas mid-drag still finishes here.
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointAt(event);
    bufferRef.current.begin(point);
    lastRef.current = point;
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!bufferRef.current.active) return;
    const point = pointAt(event);
    bufferRef.current.push(point);
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
