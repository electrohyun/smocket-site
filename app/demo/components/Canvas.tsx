'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { FLUSH_MS, SegmentBuffer, toPixels, toPoint, type Pt, type StrokePayload } from '../lib/stroke';
import styles from './Canvas.module.css';

/* The canvas, on both sides of the wire.
 *
 * The drawer paints from its own pointer and the observer paints from what it
 * receives, but they paint the same way: every point reaches the surface through
 * `draw`, one path, so a line that renders live also renders on replay and a gap
 * at a segment boundary cannot appear on one side but not the other. The drawer
 * excludes itself when it broadcasts (`socket.to(room)`), so its strokes never
 * come back to it — which is exactly why its own paint has to be local, and why
 * the record beside it, not a returned stroke, is the proof of delivery.
 *
 * `draw` reassembles a stroke from its segments. The wire splits one stroke into
 * a segment per flush, all sharing an `id`; a changed `id` is a new stroke, and a
 * same-`id` segment continues from the previous one's last point, so the line
 * does not break at the 40ms seam. Normalised coordinates (stroke.ts) let the
 * observer's canvas, a different size, draw the same picture. */

export interface CanvasHandle {
  /** Paint a received segment. The observer's socket handler calls this. */
  draw(segment: StrokePayload): void;
}

interface Props {
  /**
   * Every segment the drawer produces, the end one included. The stroke count the
   * bots run on is derived from `end` segments downstream, not here: a stroke is
   * counted where it is emitted, so a replayed round counts the same way a live
   * one does (기획 3단계 §1).
   */
  onSegment: (segment: ReturnType<SegmentBuffer['take']>) => void;
  /** A receive-only surface (the observer, or a decided round) takes no strokes. */
  disabled?: boolean;
}

function Canvas({ onSegment, disabled = false }: Props, ref: React.Ref<CanvasHandle>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef(new SegmentBuffer());

  // Every stroke's points, kept in normalised space so the picture can be redrawn
  // at whatever size the canvas becomes. The wire carries a segment and forgets it
  // (stroke.ts); the screen is the one place that has to remember the whole line,
  // because sizing the backing store wipes the pixels.
  const historyRef = useRef<Pt[][]>([]);
  // The stroke being assembled: its id, and the last point drawn, so a same-id
  // segment bridges to it and a new id starts clean.
  const assembleRef = useRef<{ id: number | null; last: Pt | null }>({ id: null, last: null });

  const draw = useCallback((segment: StrokePayload) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const state = assembleRef.current;

    if (segment.id !== state.id) {
      state.id = segment.id;
      state.last = null;
      historyRef.current.push([]);
    }
    const stroke = historyRef.current[historyRef.current.length - 1];

    for (const point of segment.pts) {
      stroke.push(point);
      if (state.last) {
        const [x1, y1] = toPixels(state.last, rect);
        const [x2, y2] = toPixels(point, rect);
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      }
      state.last = point;
    }
  }, []);

  useImperativeHandle(ref, () => ({ draw }), [draw]);

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

    // A flushed segment goes out to be delivered and, through `draw`, onto this
    // canvas — the drawer's own paint, since the broadcast excludes it.
    const timer = window.setInterval(() => {
      const segment = bufferRef.current.take();
      if (segment) {
        onSegment(segment);
        draw(segment);
      }
    }, FLUSH_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [onSegment, draw]);

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = event.currentTarget.getBoundingClientRect();
    return toPoint(event.clientX - rect.left, event.clientY - rect.top, rect);
  };

  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    // Capture, so a stroke that leaves the canvas mid-drag still finishes here.
    event.currentTarget.setPointerCapture(event.pointerId);
    bufferRef.current.begin(pointAt(event));
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!bufferRef.current.active) return;
    bufferRef.current.push(pointAt(event));
  };

  const up = () => {
    const segment = bufferRef.current.end();
    if (!segment) return;
    // The end segment takes the same two paths every segment does: out to be
    // delivered, and onto this canvas. Whoever counts strokes counts it downstream.
    onSegment(segment);
    draw(segment);
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

export default forwardRef(Canvas);
