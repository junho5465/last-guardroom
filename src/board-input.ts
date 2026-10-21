import type { Engine, Unit } from './engine';
import { slotX, floorY } from './map';
import { asset } from './icons';
export type BoardIntent =
  | { kind: 'tap'; slot: number }
  | { kind: 'merge'; source: number; target: number }
  | { kind: 'move'; source: number; slot: number }
  | { kind: 'cancel' };
export function boardIntent(
  sourceId: number | undefined,
  from: number,
  to: number | null,
  dragged: boolean,
  units: Unit[],
): BoardIntent {
  if (!dragged) return { kind: 'tap', slot: from };
  if (to === null || to === from || sourceId === undefined) return { kind: 'cancel' };
  const source = units.find((u) => u.id === sourceId && u.slot === from);
  if (!source || source.moving > 0) return { kind: 'cancel' };
  const target = units.find((u) => u.slot === to);
  if (!target) return { kind: 'move', source: source.id, slot: to };
  if (
    source.id !== target.id &&
    source.kind === target.kind &&
    source.star === target.star &&
    source.star < 5 &&
    !source.evolution &&
    !target.evolution &&
    target.moving <= 0 &&
    !source.expires &&
    !target.expires
  )
    return { kind: 'merge', source: source.id, target: target.id };
  return { kind: 'cancel' };
}
interface Options {
  board: HTMLElement;
  root: HTMLElement;
  getEngine: () => Engine | null;
  enabled: () => boolean;
  tap: (slot: number) => void;
  changed: () => void;
  dragging: (id: number | null) => void;
}
export function bindBoardInput(o: Options) {
  let active: {
    pointer: number;
    from: number;
    id?: number;
    x: number;
    y: number;
    dragged: boolean;
  } | null = null;
  const ghost = document.createElement('img');
  ghost.className = 'drag-ghost';
  ghost.alt = '';
  ghost.hidden = true;
  o.board.append(ghost);
  const buttons = Array.from(o.root.querySelectorAll<HTMLButtonElement>('[data-slot]'));
  const slotAt = (x: number, y: number) => {
    const r = o.board.getBoundingClientRect();
    const px = ((x - r.left) / r.width) * 500,
      py = ((y - r.top) / r.height) * 590;
    for (let i = 0; i < 12; i++)
      if (Math.abs(px - slotX(i)) <= 38 && Math.abs(py - floorY(Math.floor(i / 3))) <= 42) return i;
    return null;
  };
  const clear = () => {
    ghost.hidden = true;
    o.dragging(null);
    for (const b of buttons) b.classList.remove('drag-valid', 'drag-invalid', 'drag-source');
    const previous = active;
    active = null;
    if (previous && o.board.hasPointerCapture(previous.pointer))
      o.board.releasePointerCapture(previous.pointer);
  };
  const move = (e: PointerEvent) => {
    if (!active || e.pointerId !== active.pointer) return;
    const engine = o.getEngine();
    if (!engine || !o.enabled()) {
      clear();
      return;
    }
    if (Math.hypot(e.clientX - active.x, e.clientY - active.y) > 10) active.dragged = true;
    if (!active.dragged || active.id === undefined) return;
    e.preventDefault();
    const r = o.board.getBoundingClientRect();
    const unit = engine.s.units.find((u) => u.id === active!.id);
    if (!unit) {
      clear();
      return;
    }
    ghost.src = asset(unit.kind + '.webp');
    ghost.hidden = false;
    ghost.style.left = e.clientX - r.left + 'px';
    ghost.style.top = e.clientY - r.top + 'px';
    ghost.style.width = (r.width * 64) / 500 + 'px';
    o.dragging(unit.id);
    const target = slotAt(e.clientX, e.clientY);
    const intent = boardIntent(active.id, active.from, target, true, engine.s.units);
    for (const b of buttons) {
      const slot = Number(b.dataset.slot);
      b.classList.toggle('drag-source', slot === active.from);
      b.classList.toggle(
        'drag-valid',
        slot === target && (intent.kind === 'merge' || intent.kind === 'move'),
      );
      b.classList.toggle(
        'drag-invalid',
        slot === target && intent.kind === 'cancel' && slot !== active.from,
      );
    }
  };
  o.root.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-slot]');
    if (!b || !o.enabled() || active || e.button !== 0 || !e.isPrimary) return;
    const engine = o.getEngine();
    if (!engine) return;
    const from = Number(b.dataset.slot),
      u = engine.s.units.find((u) => u.slot === from);
    active = { pointer: e.pointerId, from, id: u?.id, x: e.clientX, y: e.clientY, dragged: false };
    o.board.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  o.board.addEventListener('pointermove', move);
  o.board.addEventListener('pointerup', (e) => {
    if (!active || e.pointerId !== active.pointer) return;
    const engine = o.getEngine();
    const intent = engine
      ? boardIntent(
          active.id,
          active.from,
          slotAt(e.clientX, e.clientY),
          active.dragged,
          engine.s.units,
        )
      : ({ kind: 'cancel' } as BoardIntent);
    clear();
    if (!engine || !o.enabled()) return;
    e.preventDefault();
    if (intent.kind === 'tap') o.tap(intent.slot);
    else if (intent.kind === 'merge') {
      if (engine.mergeInto(intent.source, intent.target)) {
        engine.selected = intent.target;
        o.changed();
      }
    } else if (intent.kind === 'move') {
      if (engine.move(intent.source, intent.slot)) {
        engine.selected = intent.source;
        o.changed();
      }
    } else engine.say('같은 생존자·같은 별 위로 밀어서 합성하세요.');
  });
  o.board.addEventListener('pointercancel', clear);
  o.board.addEventListener('lostpointercapture', () => {
    if (active) clear();
  });
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
  });
  for (const b of buttons)
    b.onclick = (e) => {
      if (e.detail === 0 && o.enabled()) o.tap(Number(b.dataset.slot));
    };
  return { cancel: clear };
}
