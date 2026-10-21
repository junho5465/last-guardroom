import { describe, it, expect } from 'vitest';
import { Engine, defaultProfile, type Enemy } from '../src/engine';
import {
  slotX,
  floorY,
  ROUTE,
  ROUTE_LENGTH,
  enemyPosition,
  distanceToEnemy,
  BASE_SPEED,
  FAST_SPEED,
  MIN_WAVE_TIME,
  WAVE_OPENING_DELAY,
} from '../src/map';
const make = () => new Engine(defaultProfile(), undefined, 'normal', 4455);
const atDistance = (distance: number) => ({ x: 465 - (distance / ROUTE_LENGTH) * 431 });
const enemy = (x: number, floor = 3): Enemy => ({
  id: 100,
  kind: 0,
  floor,
  x,
  hp: 1000,
  maxHp: 1000,
  dot: 0,
  dotTime: 0,
  age: 0,
  pattern: 0,
});
describe('중앙 배치와 외곽 경로', () => {
  it('배치 12칸이 서로 겹치지 않고 외곽 통로 안쪽에 있다', () => {
    const points = new Set();
    for (let i = 0; i < 12; i++) {
      const x = slotX(i),
        y = floorY(Math.floor(i / 3));
      expect(x).toBeGreaterThan(110);
      expect(x).toBeLessThan(390);
      expect(y).toBeGreaterThan(140);
      expect(y).toBeLessThan(510);
      points.add(x + ',' + y);
    }
    expect(points.size).toBe(12);
  });
  it('경로의 모든 코너를 끊김 없이 통과하고 경비실에 도달한다', () => {
    let distance = 0;
    for (let i = 0; i < ROUTE.length; i++) {
      if (i) distance += Math.hypot(ROUTE[i].x - ROUTE[i - 1].x, ROUTE[i].y - ROUTE[i - 1].y);
      const p = enemyPosition(atDistance(distance));
      expect(p.x).toBeCloseTo(ROUTE[i].x);
      expect(p.y).toBeCloseTo(ROUTE[i].y);
    }
    expect(enemyPosition({ x: 500 })).toEqual({ ...ROUTE[0] });
    expect(enemyPosition({ x: 0 })).toEqual({ ...ROUTE[ROUTE.length - 1] });
  });
  it('층 번호 대신 실제 사거리로 공격한다', () => {
    const e = make();
    e.s.units = [e.s.units[0]];
    e.s.spawnClock = 999;
    e.s.enemies = [enemy(442, 3)];
    expect(distanceToEnemy(0, e.s.enemies[0])).toBeLessThan(160);
    e.tick(0.1);
    expect(e.s.enemies[0].hp).toBeLessThan(1000);
    expect(e.s.units[0].shots).toBeGreaterThan(0);
    const far = enemy(atDistance(630).x, 0);
    e.s.enemies = [far];
    e.s.units[0].cool = 0;
    e.tick(0.1);
    expect(far.hp).toBe(1000);
  });
  it('도착한 적은 내구도를 한 번만 차감한다', () => {
    const e = make();
    e.s.units = [];
    e.s.spawnClock = 999;
    e.s.enemies = [enemy(33)];
    e.tick(0.1);
    const hp = e.s.hp;
    expect(hp).toBe(292);
    expect(e.s.enemies).toHaveLength(0);
    e.tick(0.1);
    expect(e.s.hp).toBe(hp);
  });
});
describe('기본 속도와 전투 판정', () => {
  it('새 경비와 저장 복원 모두 기본 2배로 시작한다', () => {
    const a = make();
    expect(a.speed).toBe(BASE_SPEED);
    a.tick(0.1);
    expect(a.s.time).toBeCloseTo(0.2);
    const b = new Engine(a.profile, JSON.parse(JSON.stringify(a.s)));
    expect(b.speed).toBe(2);
    b.speed = FAST_SPEED;
    const before = b.s.time;
    b.tick(0.1);
    expect(b.s.time - before).toBeCloseTo(0.4);
  });
  it('같은 시뮬레이션 시간에는 2배와 4배의 공격·이동 판정이 같다', () => {
    const a = make(),
      b = make();
    b.speed = FAST_SPEED;
    a.s.nextEvent = b.s.nextEvent = 9999;
    for (let i = 0; i < 200; i++) {
      a.tick(0.05);
      b.tick(0.025);
    }
    expect(a.s.time).toBeCloseTo(b.s.time);
    expect(a.s.gold).toBeCloseTo(b.s.gold);
    expect(a.s.kills).toBe(b.s.kills);
    expect(a.s.enemies.map((e) => e.hp)).toEqual(b.s.enemies.map((e) => e.hp));
    expect(a.s.units.map((u) => u.shots)).toEqual(b.s.units.map((u) => u.shots));
  });
  it('웨이브 종료의 강제 대기와 다음 시작 대기를 줄였다', () => {
    const e = make();
    e.s.spawned = 100;
    e.s.waveTime = MIN_WAVE_TIME;
    e.s.enemies = [];
    e.tick(0.01);
    expect(e.s.wave).toBe(2);
    expect(e.s.spawnClock).toBe(WAVE_OPENING_DELAY);
    expect(WAVE_OPENING_DELAY).toBeLessThan(1);
    expect(MIN_WAVE_TIME / BASE_SPEED).toBe(6);
  });
});
