import { UNITS, ENEMIES, PERKS, EVENTS, type Kind, type Stat } from './data';
import {
  floorY,
  slotX,
  enemyPosition,
  distanceToEnemy,
  enemyDistance,
  effectiveRange,
  BASE_SPEED,
  WAVE_OPENING_DELAY,
  MIN_WAVE_TIME,
} from './map';
export { floorY, slotX } from './map';
export interface Unit {
  id: number;
  kind: Kind;
  slot: number;
  star: number;
  cool: number;
  shots: number;
  evolution?: string;
  moving: number;
  expires?: number;
}
export interface Enemy {
  id: number;
  kind: number;
  floor: number;
  x: number;
  hp: number;
  maxHp: number;
  dot: number;
  dotTime: number;
  age: number;
  pattern: number;
}
export interface FX {
  id: number;
  type: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: number;
  life: number;
  maxLife: number;
  text?: string;
}
export interface Profile {
  version: 1;
  points: number;
  research: Record<string, number>;
  wins: number;
  best: number;
  settings: { sound: boolean; effects: boolean };
  completed: string[];
}
export type Phase = 'battle' | 'perk' | 'event' | 'revive' | 'won' | 'lost';
export interface State {
  version: 1;
  runId: string;
  phase: Phase;
  mode: 'normal' | 'endless';
  time: number;
  wave: number;
  waveTime: number;
  spawned: number;
  spawnClock: number;
  gold: number;
  hp: number;
  maxHp: number;
  units: Unit[];
  enemies: Enemy[];
  nextId: number;
  summons: number;
  upgrade: number;
  perks: Partial<Record<Stat, number>>;
  choices: Stat[];
  event: string;
  eventIndex: number;
  nextEvent: number;
  eventOrder: string[];
  blackout: number;
  support: number;
  rush: number;
  pendingRush?: number;
  rushBonus: number;
  skillCd: number;
  elevatorCd: number;
  revived: boolean;
  adCounts: Record<string, number>;
  claims: string[];
  kills: number;
  earned: number;
  pendingBoss: number;
  free: number;
  seed: number;
}
export const defaultProfile = (): Profile => ({
  version: 1,
  points: 0,
  research: {},
  wins: 0,
  best: 0,
  settings: { sound: true, effects: true },
  completed: [],
});
export class Engine {
  s: State;
  fx: FX[] = [];
  notice = '';
  noticeUntil = 0;
  paused = false;
  speed = BASE_SPEED;
  selected: number | null = null;
  constructor(
    public profile: Profile,
    state?: State,
    mode: 'normal' | 'endless' = 'normal',
    seed = Date.now() >>> 0,
  ) {
    this.s = state ?? {
      version: 1,
      runId: crypto.randomUUID(),
      phase: 'battle',
      mode,
      time: 0,
      wave: 1,
      waveTime: 0,
      spawned: 0,
      spawnClock: WAVE_OPENING_DELAY,
      gold: 650 + (profile.research.start || 0) * 30,
      hp: 300 + (profile.research.hp || 0) * 15,
      maxHp: 300 + (profile.research.hp || 0) * 15,
      units: [],
      enemies: [],
      nextId: 1,
      summons: 0,
      upgrade: 0,
      perks: {},
      choices: [],
      event: '',
      eventIndex: 0,
      nextEvent: 65,
      eventOrder: [],
      blackout: 0,
      support: 0,
      rush: 0,
      rushBonus: 0,
      skillCd: 0,
      elevatorCd: 0,
      revived: false,
      adCounts: {},
      claims: [],
      kills: 0,
      earned: 0,
      pendingBoss: 0,
      free: 2,
      seed,
    };
    if (!state) {
      this.s.eventOrder = this.shuffle(EVENTS.map((e) => e.id));
      this.summon(true, 'guard', 0);
      this.summon(true, 'guard', 3);
      this.summon(true, 'fire', 6);
      this.summon(true, 'electric', 9);
      this.s.free = 2;
    }
  }
  random() {
    let x = this.s.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.s.seed = x >>> 0;
    return (x >>> 0) / 4294967296;
  }
  shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  p(k: Stat) {
    return this.s.perks[k] || 0;
  }
  say(t: string) {
    this.notice = t;
    this.noticeUntil = this.s.time + 3.4;
  }
  get summonCost() {
    return this.s.free > 0
      ? 0
      : Math.max(
          40,
          Math.round(
            (100 + this.s.summons * 5) *
              (1 -
                Math.min(0.6, this.p('discount') + (this.profile.research.discount || 0) * 0.01)),
          ),
        );
  }
  get upgradeCost() {
    return 140 + this.s.upgrade * 90;
  }
  get power() {
    return Math.round(
      this.s.units.reduce(
        (a, u) =>
          a +
          (UNITS.find((d) => d.id === u.kind)!.damage /
            UNITS.find((d) => d.id === u.kind)!.interval) *
            Math.pow(2.3, u.star - 1),
        0,
      ) * this.damageMult(),
    );
  }
  damageMult() {
    return (
      (1 + this.p('damage') + (this.profile.research.damage || 0) * 0.03) *
      (1 + this.s.upgrade * 0.15)
    );
  }
  effect(type: string, x: number, y: number, tx = x, ty = y, color = 0x9be7d2, text?: string) {
    this.fx.push({
      id: this.s.nextId++,
      type,
      x,
      y,
      tx,
      ty,
      color,
      life: type === 'text' ? 1.1 : 0.35,
      maxLife: type === 'text' ? 1.1 : 0.35,
      text,
    });
  }
  summon(free = false, kind?: Kind, slot?: number) {
    const s = this.s;
    if (s.phase !== 'battle' || this.paused) return false;
    const empty = Array.from({ length: 12 }, (_, i) => i).filter(
      (i) => !s.units.some((u) => u.slot === i),
    );
    if (!empty.length) {
      this.say('빈 배치 칸이 없습니다. 같은 생존자를 합성하세요.');
      return false;
    }
    const cost = free ? 0 : this.summonCost;
    if (s.gold < cost) {
      this.say('골드가 부족합니다.');
      return false;
    }
    if (!kind) {
      const r = this.random();
      const pool =
        r < 0.48
          ? ['guard']
          : r < 0.77
            ? ['fire', 'electric']
            : r < 0.94
              ? ['sniper', 'drone', 'chemist']
              : r < 0.995
                ? ['soldier']
                : ['agent'];
      kind = pool[Math.floor(this.random() * pool.length)] as Kind;
    }
    s.gold -= cost;
    if (!free) {
      if (s.free > 0) s.free--;
      s.summons++;
    }
    const dest =
      slot !== undefined && empty.includes(slot)
        ? slot
        : empty[Math.floor(this.random() * empty.length)];
    const u: Unit = { id: s.nextId++, kind, slot: dest, star: 1, cool: 0.1, shots: 0, moving: 0 };
    s.units.push(u);
    const def = UNITS.find((d) => d.id === kind)!;
    this.effect('ring', slotX(dest), floorY(Math.floor(dest / 3)), 0, 0, def.color);
    this.say((def.rarity === 4 ? '전설 합류! ' : '') + def.name + ' 합류');
    return u;
  }
  merge(id: number) {
    if (this.s.phase !== 'battle' || this.paused) return false;
    const a = this.s.units.find((u) => u.id === id);
    if (!a || a.moving > 0 || a.evolution || a.star >= 5) return false;
    const b = this.s.units.find(
      (u) => u.id !== id && u.kind === a.kind && u.star === a.star && !u.evolution && u.moving <= 0,
    );
    if (!b) {
      this.say('같은 생존자 · 같은 별 단계가 필요합니다.');
      return false;
    }
    this.s.units = this.s.units.filter((u) => u.id !== b.id);
    a.star++;
    this.effect('ring', slotX(a.slot), floorY(Math.floor(a.slot / 3)), 0, 0, 0xffd17c);
    this.say(UNITS.find((d) => d.id === a.kind)!.name + ' ' + a.star + '성 합성!');
    return true;
  }
  evolve(id: number, path: string) {
    if (this.s.phase !== 'battle' || this.paused || !['rapid', 'shield', 'flame'].includes(path))
      return false;
    const u = this.s.units.find((u) => u.id === id);
    if (!u || u.star < 3 || u.evolution || !UNITS.find((d) => d.id === u.kind)!.evolvable)
      return false;
    u.evolution = path;
    if (path === 'shield') this.s.hp = Math.min(this.s.maxHp, this.s.hp + 40);
    this.effect('ring', slotX(u.slot), floorY(Math.floor(u.slot / 3)), 0, 0, 0xffd17c);
    this.say('돌연변이 진화 완료');
    return true;
  }
  move(id: number, slot: number) {
    if (
      this.s.phase !== 'battle' ||
      this.paused ||
      slot < 0 ||
      slot >= 12 ||
      this.s.elevatorCd > 0 ||
      this.s.units.some((u) => u.slot === slot)
    )
      return false;
    const u = this.s.units.find((u) => u.id === id);
    if (!u || u.moving > 0) return false;
    const old = u.slot;
    u.slot = slot;
    u.moving = 1.25;
    this.s.elevatorCd = 8 * (1 - Math.min(0.8, this.p('elevator')));
    this.effect(
      'lift',
      slotX(old),
      floorY(Math.floor(old / 3)),
      slotX(slot),
      floorY(Math.floor(slot / 3)),
      0x82e1db,
    );
    this.say('생존자 재배치 중');
    return true;
  }
  upgrade() {
    if (this.s.phase !== 'battle' || this.paused || this.s.gold < this.upgradeCost) return false;
    this.s.gold -= this.upgradeCost;
    this.s.upgrade++;
    this.say('전원 공격력 +15%');
    return true;
  }
  skill() {
    if (this.s.phase !== 'battle' || this.paused || this.s.skillCd > 0) return false;
    const damage = 220 * (1 + this.p('skill') + (this.profile.research.skill || 0) * 0.05);
    for (const e of this.s.enemies) {
      e.hp -= damage;
      const p = enemyPosition(e);
      this.effect('blast', p.x, p.y, 0, 0, 0xf2bd77);
    }
    this.s.skillCd = 30 * (1 - Math.min(0.75, this.p('cooldown')));
    this.say('비상 포격!');
    return true;
  }
  offerPerks() {
    this.s.choices = this.shuffle(PERKS.map((p) => p.id)).slice(0, 3);
    this.s.phase = 'perk';
  }
  choosePerk(id: Stat) {
    if (this.s.phase !== 'perk' || !this.s.choices.includes(id)) return false;
    const p = PERKS.find((p) => p.id === id)!;
    this.s.perks[id] = this.p(id) + p.value;
    if (id === 'hp') {
      const n = Math.round(this.s.maxHp * 0.25);
      this.s.maxHp += n;
      this.s.hp += n;
    }
    if (id === 'start') this.s.gold += 400;
    this.s.choices = [];
    this.s.phase = 'battle';
    this.say(p.name + ' 적용');
    return true;
  }
  resolveEvent(choice = 'accept') {
    if (this.s.phase !== 'event') return false;
    const s = this.s;
    const event = s.event;
    s.phase = 'battle';
    if (choice !== 'decline') {
      if (event === 'blackout') s.blackout = 10;
      if (event === 'parcel') this.summon(true);
      if (event === 'helicopter') s.support = 30;
      if (event === 'rush') {
        s.pendingRush = 4;
        s.rushBonus = 30;
      }
      if (event === 'trade') {
        s.maxHp = Math.round(s.maxHp * 0.85);
        s.hp = Math.min(s.hp, s.maxHp);
        s.perks.damage = this.p('damage') + 0.25;
      }
      if (event === 'supply') {
        if (choice === 'heal') s.hp = Math.min(s.maxHp, s.hp + 80);
        else s.gold += 300;
      }
    }
    s.event = '';
    return true;
  }
  spawn() {
    const s = this.s;
    const boss = s.wave % 10 === 0 && s.spawned === 0;
    const maxKind = Math.min(6, 1 + Math.floor(s.wave / 3));
    const kind = boss ? (s.wave % 20 === 0 ? 7 : 6) : Math.floor(this.random() * maxKind);
    const d = ENEMIES[kind];
    const scale = 1 + (s.wave - 1) * 0.105 + Math.max(0, s.wave - 20) * 0.12;
    const hp = d.hp * scale;
    const floor =
      s.wave % 20 === 0
        ? Math.floor((s.waveTime / 7) % 4)
        : (s.spawned + Math.floor(s.wave / 2)) % 4;
    s.enemies.push({
      id: s.nextId++,
      kind,
      floor,
      x: 465 + this.random() * 18,
      hp,
      maxHp: hp,
      dot: 0,
      dotTime: 0,
      age: 0,
      pattern: 0,
    });
    s.spawned++;
  }
  hurt(n: number) {
    const shield = this.s.units.some((u) => u.evolution === 'shield');
    this.s.hp -= n * (shield ? 0.7 : 1);
    if (this.s.hp <= 0) {
      this.s.hp = 0;
      this.s.phase = this.s.revived ? 'lost' : 'revive';
    }
  }
  tick(dt: number) {
    if (this.paused || this.s.phase !== 'battle') return;
    let remaining = Math.max(0, Math.min(dt, 0.1)) * this.speed;
    while (remaining > 0.000001 && this.s.phase === 'battle') {
      const step = Math.min(remaining, 0.05);
      this.advance(step);
      remaining -= step;
    }
  }
  private advance(dt: number) {
    const s = this.s;
    s.time += dt;
    s.waveTime += dt;
    s.gold += dt * (s.time < 120 ? 7 : 4);
    s.skillCd = Math.max(0, s.skillCd - dt);
    s.elevatorCd = Math.max(0, s.elevatorCd - dt);
    s.blackout = Math.max(0, s.blackout - dt);
    s.rushBonus = Math.max(0, s.rushBonus - dt);
    s.hp = Math.min(s.maxHp, s.hp + this.p('regen') * dt);
    this.fx = this.fx.filter((f) => (f.life -= dt) > 0);
    const quota = 6 + Math.floor(s.wave * 0.65) + s.rush;
    s.spawnClock -= dt;
    if (s.spawned < quota && s.spawnClock <= 0) {
      this.spawn();
      s.spawnClock = Math.max(0.45, 1.6 - s.wave * 0.045);
    }
    for (const e of s.enemies) {
      e.age += dt;
      e.x -= ENEMIES[e.kind].speed * dt * (e.kind === 7 && e.hp < e.maxHp * 0.5 ? 1.45 : 1);
      if (e.dotTime > 0) {
        e.hp -= e.dot * dt;
        e.dotTime -= dt;
      }
      if (e.kind === 4 && e.x < 355 && e.age > e.pattern + 5) {
        e.pattern = e.age;
        this.hurt(2);
        const p = enemyPosition(e);
        this.effect('shot', p.x, p.y, 250, 65, 0xbb8fdd);
      }
      if (e.kind === 6 && e.age > e.pattern + 8) {
        e.pattern = e.age;
        this.hurt(7);
        for (const other of s.enemies)
          if (other.kind < 6 && enemyDistance(other,e)<130)
            other.hp = Math.min(other.maxHp, other.hp + 12);
        const p = enemyPosition(e);
        this.effect('ring', p.x, p.y, 0, 0, 0xd48c70);
      }
      if (e.kind === 7 && e.age > e.pattern + 9) {
        e.pattern = e.age;
        for (const u of s.units) if (Math.floor(u.slot / 3) === e.floor) u.moving = 2.5;
        this.effect('blast', 250, floorY(e.floor), 0, 0, 0xe77289);
      }
    }
    s.units = s.units.filter((u) => !u.expires || u.expires > s.time);
    for (const u of s.units) {
      u.moving = Math.max(0, u.moving - dt);
      if (u.moving > 0) continue;
      u.cool -= dt;
      if (u.cool > 0) continue;
      const d = UNITS.find((d) => d.id === u.kind)!;
      const f = Math.floor(u.slot / 3);
      const range = effectiveRange(d.range, this.p('range'), u.star);
      let targets = s.enemies
        .filter((e) => e.hp > 0 && distanceToEnemy(u.slot, e) < range)
        .sort((a, b) => a.x - b.x);
      if (!targets.length) continue;
      let attack = d.attack;
      if (u.evolution === 'flame') attack = 'burn';
      if (attack === 'snipe')
        targets.sort((a, b) => (b.kind >= 6 ? 1 : 0) - (a.kind >= 6 ? 1 : 0) || a.x - b.x);
      const first = targets[0];
      let damage =
        d.damage *
        Math.pow(2.3, u.star - 1) *
        this.damageMult() *
        (u.evolution === 'flame' ? 1.5 : 1);
      u.shots++;
      if (attack === 'burst' && u.shots % 5 === 0) damage *= 2.5;
      if (attack === 'snipe' && this.random() < 0.1 + this.p('crit')) damage *= 2;
      if (attack === 'chain') targets = targets.slice(0, 3 + this.p('chain'));
      else if (attack === 'multi') targets = targets.slice(0, 2 + this.p('drone'));
      else if (attack === 'burn')
        targets = targets.filter((e) => enemyDistance(e, first) < 65 * (1 + this.p('fireRange')));
      else if (attack !== 'pierce') targets = [first];
      for (const e of targets) {
        const armor = Math.max(
          0,
          ENEMIES[e.kind].armor -
            this.p('armor') -
            (e.dotTime > 0 && attack === 'poison' ? 0.2 : 0),
        );
        const hit =
          damage *
          (1 - armor) *
          (e.kind >= 6 ? (attack === 'snipe' ? 1.6 : 1) * (1 + this.p('boss')) : 1);
        e.hp -= hit;
        if (attack === 'burn' || attack === 'poison') {
          e.dot = damage * 0.23 * (1 + this.p(attack === 'burn' ? 'burn' : 'poison'));
          e.dotTime = 3;
        }
        const target = enemyPosition(e);
        this.effect(attack, slotX(u.slot), floorY(f) - 13, target.x, target.y - 8, d.color);
        this.effect(
          'text',
          target.x,
          target.y - 30,
          target.x,
          target.y - 50,
          d.color,
          Math.round(hit).toString(),
        );
      }
      if (this.p('splash') > 0 && attack === 'single')
        for (const e of s.enemies)
          if (e.id !== first.id && enemyDistance(e, first) < 55) e.hp -= damage * this.p('splash');
      u.cool =
        (d.interval /
          (1 + this.p('speed') + 0.05 * (u.star - 1)) /
          (u.evolution === 'rapid' ? 1.8 : 1)) *
        (u.kind === 'electric' && s.blackout > 0 ? 2 : 1);
    }
    if (s.support > 0) {
      s.support -= dt;
      for (const e of s.enemies) {
        e.hp -= 45 * dt;
        if (Math.floor(s.time * 5) !== Math.floor((s.time - dt) * 5)) {
          const p = enemyPosition(e);
          this.effect('shot', p.x - 20, 45, p.x, p.y, 0x8be9d0);
        }
      }
    }
    const alive: Enemy[] = [];
    for (const e of s.enemies) {
      if (e.hp <= 0) {
        const gold =
          (e.kind >= 6 ? 200 : 18 + Math.floor(s.wave * 1.3)) *
          (1 + this.p('gold') + (this.profile.research.gold || 0) * 0.03) *
          (s.rushBonus > 0 ? 1.5 : 1);
        s.gold += gold;
        s.kills++;
        if (e.kind >= 6) {
          s.pendingBoss = Math.round(gold);
          this.say('보스 격파! +' + Math.round(gold) + 'G');
        }
        const p = enemyPosition(e);
        this.effect('death', p.x, p.y, 0, 0, ENEMIES[e.kind].color);
      } else if (e.x < 34) {
        this.hurt(ENEMIES[e.kind].damage);
        const p = enemyPosition(e);
        this.effect('blast', p.x, p.y, 0, 0, 0xf17a7e);
      } else alive.push(e);
    }
    s.enemies = alive;
    if (s.phase !== 'battle') return;
    if (s.spawned >= quota && !s.enemies.length && s.waveTime >= MIN_WAVE_TIME) {
      if (s.wave >= 20 && s.mode === 'normal') {
        s.phase = 'won';
        return;
      }
      const completed = s.wave;
      s.wave++;
      s.waveTime = 0;
      s.spawned = 0;
      s.spawnClock = WAVE_OPENING_DELAY;
      s.rush = s.pendingRush || 0;
      s.pendingRush = 0;
      s.gold += 80 + s.wave * 5;
      this.say('WAVE ' + s.wave + ' · 생존 보급 지급');
      if (completed % 5 === 0) {
        this.offerPerks();
        return;
      }
    }
    if (s.time >= s.nextEvent) {
      s.nextEvent += 70 + this.random() * 25;
      s.event = s.eventOrder[s.eventIndex++ % s.eventOrder.length];
      s.phase = 'event';
    }
  }
  adLimit(type: string) {
    return type === 'hero' || type === 'reroll' ? 2 : 1;
  }
  canAd(type: string) {
    const s = this.s;
    if ((s.adCounts[type] || 0) >= this.adLimit(type)) return false;
    return type === 'revive'
      ? s.phase === 'revive' && !s.revived
      : type === 'reroll'
        ? s.phase === 'perk'
        : type === 'boss'
          ? s.phase === 'battle' && s.pendingBoss > 0
          : type === 'hero'
            ? s.phase === 'battle' && s.units.length < 12
            : type === 'support'
              ? s.phase === 'battle'
              : false;
  }
  claimAd(type: string, receipt: string) {
    if (this.s.claims.includes(receipt) || !this.canAd(type)) return false;
    this.s.claims.push(receipt);
    this.s.adCounts[type] = (this.s.adCounts[type] || 0) + 1;
    if (type === 'revive') {
      this.s.revived = true;
      this.s.hp = this.s.maxHp * 0.5;
      this.s.enemies = [];
      this.s.phase = 'battle';
    }
    if (type === 'hero') {
      const u = this.summon(true, 'soldier');
      if (u) u.expires = this.s.time + 45;
    }
    if (type === 'reroll') this.offerPerks();
    if (type === 'boss') {
      this.s.gold += this.s.pendingBoss;
      this.s.pendingBoss = 0;
    }
    if (type === 'support') this.s.support = 20;
    this.say('지원 보상을 받았습니다.');
    return true;
  }
  finish() {
    if (!['won', 'lost'].includes(this.s.phase)) return 0;
    if (this.profile.completed.includes(this.s.runId)) return this.s.earned;
    const reward =
      20 + this.s.wave * 6 + Math.floor(this.s.kills / 3) + (this.s.phase === 'won' ? 150 : 0);
    this.profile.completed.push(this.s.runId);
    this.profile.points += reward;
    this.profile.best = Math.max(this.profile.best, this.s.wave);
    if (this.s.phase === 'won') this.profile.wins++;
    this.s.earned = reward;
    return reward;
  }
}
export function buyResearch(profile: Profile, id: string) {
  if (!['damage', 'start', 'hp', 'gold', 'discount', 'skill'].includes(id)) return false;
  const level = profile.research[id] || 0;
  const cost = 50 + level * 35;
  if (level >= 10 || profile.points < cost) return false;
  profile.points -= cost;
  profile.research[id] = level + 1;
  return true;
}
