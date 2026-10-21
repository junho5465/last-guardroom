import Phaser from 'phaser';
import { Engine, floorY, slotX } from './engine';
import { UNITS, ENEMIES } from './data';
import { asset } from './icons';
import { enemyPosition, distanceToEnemy, effectiveRange, ROUTE, ROUTE_LENGTH } from './map';

/** Texture-backed art; the simulation remains independent of the renderer. */
export class BattleScene extends Phaser.Scene {
  engine: Engine | null = null;
  draggingId: number | null = null;
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private sprites: Phaser.GameObjects.Image[] = [];
  private labelIndex = 0;
  private spriteIndex = 0;
  onSlot: (slot: number) => void = () => {};
  constructor() {
    super('battle');
  }
  preload() {
    this.load.image('support-helicopter', asset('support-helicopter.webp'));
    this.load.svg('courtyard', asset('courtyard.svg'), { width: 1000, height: 1180 });
    for (const d of UNITS) this.load.image(d.id, asset(d.id + '.webp'));
    for (let i = 0; i < ENEMIES.length; i++)
      this.load.image('enemy-' + i, asset('enemy-' + i + '.webp'));
  }
  create() {
    this.add.image(0, 0, 'courtyard').setOrigin(0).setDisplaySize(500, 590);
    this.g = this.add.graphics().setDepth(1);
  }
  private hitSlot(x: number, y: number) {
    for (let i = 0; i < 12; i++)
      if (Math.abs(x - slotX(i)) < 38 && Math.abs(y - floorY(Math.floor(i / 3))) < 42) return i;
    return -1;
  }
  private text(x: number, y: number, t: string, size = 12, color = '#b9c8c7', bold = false) {
    let o = this.labels[this.labelIndex++];
    if (!o) {
      o = this.add.text(x, y, t, {
        fontFamily: 'Pretendard,Arial,sans-serif',
        fontSize: size,
        color,
      });
      o.setDepth(4);
      this.labels.push(o);
    }
    return o
      .setPosition(x, y)
      .setText(t)
      .setFontSize(size)
      .setColor(color)
      .setFontStyle(bold ? 'bold' : 'normal')
      .setVisible(true)
      .setAlpha(1);
  }
  private sprite(key: string, x: number, y: number, w: number, h: number) {
    let o = this.sprites[this.spriteIndex++];
    if (!o) {
      o = this.add.image(x, y, key).setDepth(2);
      this.sprites.push(o);
    }
    return o
      .setTexture(key)
      .setPosition(x, y)
      .setDisplaySize(w, h)
      .setOrigin(0.5, 0.92)
      .setVisible(true)
      .setAlpha(1)
      .clearTint()
      .setAngle(0)
      .setFlipX(false);
  }
  private line(x: number, y: number, tx: number, ty: number, c: number, width = 1, a = 1) {
    this.g.lineStyle(width, c, a);
    this.g.lineBetween(x, y, tx, ty);
  }
  private circle(x: number, y: number, r: number, c: number, a = 1) {
    this.g.fillStyle(c, a);
    this.g.fillCircle(x, y, r);
  }
  update(_now: number, delta: number) {
    const e = this.engine;
    if (e) e.tick(delta / 1000);
    if (!this.g) return;
    this.g.clear();
    this.labelIndex = 0;
    this.spriteIndex = 0;
    if (e) {
      for (const u of e.s.units) {
        const x = slotX(u.slot),
          y = floorY(Math.floor(u.slot / 3));
        if (e.selected === u.id) {
          const d = UNITS.find((d) => d.id === u.kind)!;
          const range = effectiveRange(d.range, e.p('range'), u.star);
          this.g.lineStyle(1, 0xbad9cf, 0.3);
          this.g.strokeCircle(x, y, range);
          this.g.fillStyle(0x7cbaa3, 0.035);
          this.g.fillCircle(x, y, range);
          this.g.fillStyle(0xeed098, 0.12);
          this.g.fillRoundedRect(x - 38, y - 40, 76, 80, 10);
          this.g.lineStyle(1.5, 0xf1cd86);
          this.g.strokeRoundedRect(x - 25, y - 41, 50, 78, 5);
        }
        if (u.evolution) {
          this.g.lineStyle(
            1.5,
            u.evolution === 'flame' ? 0xe6a06d : u.evolution === 'shield' ? 0x9ac6d2 : 0xdec682,
            0.8,
          );
          this.g.strokeEllipse(x, y + 21, 44, 13);
        }
        const image = this.sprite(
          u.kind,
          x,
          y + 24 + Math.sin(e.s.time * 2.6 + u.id) * 0.7,
          64,
          80,
        );
        const target = [...e.s.enemies].sort(
          (a, b) => distanceToEnemy(u.slot, a) - distanceToEnemy(u.slot, b),
        )[0];
        if (target) image.setFlipX(enemyPosition(target).x < x);
        if (this.draggingId === u.id) image.setAlpha(0.3);
        if (u.moving > 0) {
          image.setAlpha(0.35);
          this.text(x - 10, y - 8, '이동', 10, '#c7d8d4', true);
        }
        if (u.evolution === 'flame') image.setTint(0xffdab1);
        const stars = '★'.repeat(u.star);
        this.text(x - u.star * 3.5, y + 30, stars, 10, u.evolution ? '#eed095' : '#acbdb7', true);
      }
      for (const m of e.s.enemies) {
        const boss = m.kind >= 6;
        const position = enemyPosition(m);
        const y = position.y,
          ex = position.x;
        const b = Math.sin(e.s.time * 6 + m.id) * 1.1;
        this.sprite('enemy-' + m.kind, ex, y + 23 + b, boss ? 88 : 50, boss ? 98 : 62)
          .setFlipX(ex < 250)
          .setAngle(Math.sin(e.s.time * 4 + m.id) * (m.kind === 5 ? 4 : 1));
        const width = boss ? 66 : 34;
        const by = y - (boss ? 76 : 45);
        this.g.fillStyle(0x10232d, 0.9);
        this.g.fillRoundedRect(ex - width / 2 - 1, by - 1, width + 2, 6, 3);
        this.g.fillStyle(boss ? 0xe3a18c : 0x9ebc9c);
        this.g.fillRoundedRect(ex - width / 2, by, width * Math.max(0, m.hp / m.maxHp), 4, 2);
        if (boss) this.text(ex - 34, by - 17, ENEMIES[m.kind].name, 10, '#efd1af', true);
      }
      for (const f of e.fx) {
        const a = f.life / f.maxLife;
        if (f.type === 'text') {
          this.text(f.x - 5, f.y - (1 - a) * 18, f.text || '', 12, '#ffe1a6', true).setAlpha(a);
          continue;
        }
        if (['ring', 'death', 'blast'].includes(f.type)) {
          this.g.lineStyle(f.type === 'blast' ? 4 : 2, f.color, a);
          this.g.strokeCircle(f.x, f.y, (1 - a) * 30 + 5);
          for (let i = 0; i < 5; i++) {
            const ang = i * Math.PI * 0.4;
            this.circle(
              f.x + Math.cos(ang) * (1 - a) * 30,
              f.y + Math.sin(ang) * (1 - a) * 23,
              2.5 * a,
              f.color,
              a,
            );
          }
        } else if (f.type === 'lift') {
          this.line(f.x, f.y, f.tx, f.ty, f.color, 2, a);
        } else {
          const p = 1 - a;
          this.line(f.x, f.y, f.tx, f.ty, f.color, f.type === 'snipe' ? 2 : 1, a * 0.35);
          this.circle(
            Phaser.Math.Linear(f.x, f.tx, p),
            Phaser.Math.Linear(f.y, f.ty, p),
            f.type === 'burn' ? 6 : 2.5,
            f.color,
            a,
          );
          if (f.type === 'chain') {
            this.line(f.tx - 7, f.ty - 14, f.tx + 4, f.ty, f.color, 2, a);
            this.line(f.tx + 4, f.ty, f.tx - 4, f.ty + 12, f.color, 2, a);
          }
        }
      }
      if (e.s.support > 0) {
        const x = 265 + Math.sin(e.s.time * .7) * 90, y = 60 + Math.sin(e.s.time * 2) * 2;
        this.g.fillStyle(0xf5e4a6, .055);
        this.g.fillTriangle(x - 40, y + 15, x - 100, 280, x + 30, 280);
        this.sprite('support-helicopter', x, y, 152, 95).setOrigin(.5, .5);
        this.line(x - 55, y - 28, x + 60, y - 28, 0xc3ceba, 1, .3 + Math.sin(e.s.time * 60) * .2);
        this.text(x - 35, y + 47, '지원 사격 · ' + Math.ceil(e.s.support) + 's', 10, '#efd5a3', true);
      }
    }
    for (let i = this.labelIndex; i < this.labels.length; i++) this.labels[i].setVisible(false);
    for (let i = this.spriteIndex; i < this.sprites.length; i++) this.sprites[i].setVisible(false);
  }
}
