import Phaser from 'phaser';
import './style.css';
import { icon, asset } from './icons';
import { BASE_SPEED, FAST_SPEED } from './map';
import { Engine, buyResearch, floorY, slotX, type State } from './engine';
import { BattleScene } from './scene';
import { LocalRepository } from './storage';
import { UNITS, RARITIES, RESEARCH, PERKS, EVOLUTIONS, EVENTS, type Stat } from './data';
import { platform } from './platform';
const repo = new LocalRepository();
const data = repo.load();
let profile = data.profile;
let engine: Engine | null = data.run ? new Engine(profile, data.run) : null;
let view = 'lobby';
let modalKey = '';
let adBusy = false;
let audio: AudioContext | null = null;
let lastKills = 0;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<main class="shell"><header class="top"><a class="wordmark" href="#" id="brand" aria-label="로비로 돌아가기"><span class="brand-symbol">${icon('shield')}</span><span>최후의 경비실<small>101동 경비본부</small></span></a><button class="icon-btn" id="settings" aria-label="설정">${icon('settings')}</button></header><section id="hud" hidden><div class="hud-top"><div class="wave"><span class="wave-label">방어 웨이브</span><strong id="wave">01</strong><span id="wave-total">/ 20</span></div><div class="resources"><span class="resource" title="보유 골드" aria-label="보유 골드">${icon('coin')}<b id="gold"></b></span><span class="resource power-resource" title="전투력" aria-label="전투력">${icon('bolt')}<b id="power"></b></span></div></div><div class="integrity-label"><span>${icon('shield')} 건물 내구도</span><b id="hp-text"></b></div><div class="hp"><div id="hp-fill"></div></div></section><section id="stage"><div id="canvas" hidden><div id="slot-controls" class="slot-controls"></div><div class="selected" id="selected" hidden></div></div><div class="lobby" id="lobby"><section class="key-art" aria-label="청솔아파트 야간 경비"><img class="hero-art" src="${asset('lobby-night.webp')}" alt="불 켜진 경비실 앞에서 무전기를 든 경비실장" fetchpriority="high"><div class="hero-shade"></div><div class="hero-copy"><span class="chapter">청솔아파트 · 첫 번째 밤</span><h1>최후의<br><span>경비실</span></h1><p>모두가 떠난 도시.<br>우리에겐 지켜야 할 집이 있다.</p></div><div class="location-tag">${icon('flag')}<span>101동, 마지막 방어선</span><span class="location-rule"></span></div></section><div class="lobby-bottom"><div class="section-heading"><h2>오늘 밤의 작전</h2><span>소환 · 합성 · 진화</span></div><div class="modes"><div class="mode-card active"><span class="mode-symbol">${icon('shield')}</span><span><b>일반 경비</b><small>20웨이브 방어</small></span><span class="mode-check">${icon('check')}</span></div><button id="endless" class="mode-card locked">${icon('lock')}<span><b>무한 경비</b><small>일반 경비 클리어 후 개방</small></span></button></div><button class="primary start-button" id="start">${icon('play')}<span>경비 시작</span>${icon('arrow')}</button><button class="continue" id="continue" hidden><span>진행 중인 경비 이어하기 <small id="current-run"></small></span>${icon('chevron')}</button><div class="lobby-nav"><button id="research"><span class="nav-art research-art">${icon('flask')}</span><span><b>연구소</b><small id="points"></small></span>${icon('chevron')}</button><button id="collection"><span class="nav-art collection-art">${icon('people')}</span><span><b>생존자 도감</b><small>8명의 생존자</small></span>${icon('chevron')}</button></div><div class="record"><span>${icon('trophy')} 최고 기록 <b id="best"></b></span><span>방어 성공 <b id="wins"></b></span></div></div></div></section><section class="battle-controls" id="controls" hidden><div class="hint" id="hint"></div><div class="action-grid"><button id="summon" class="primary summon-action"><span class="action-icon">${icon('people')}</span><span>생존자 소환<small id="summon-cost"></small></span></button><button id="upgrade" class="secondary"><span class="action-icon">${icon('upgrade')}</span><span>전원 강화<small id="upgrade-cost"></small></span></button><button id="skill" class="skill"><span class="action-icon">${icon('target')}</span><span>비상 포격<small id="skill-cd"></small></span></button></div><div class="toolbar"><button id="pause">${icon('pause')}<span>일시정지</span></button><button id="speed"><b>2×</b><span>전투 속도</span></button><button id="support">${icon('radio')}<span>지원 요청</span></button><button id="home">${icon('home')}<span>로비</span></button></div><div id="toast" role="status" aria-live="polite"></div></section><footer>${icon('check')} 기록은 자동으로 저장됩니다</footer></main><div id="modal" class="modal" hidden></div>`;
const $ = (id: string) => document.getElementById(id)!;
const scene = new BattleScene();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'canvas',
  width: 500,
  height: 590,
  backgroundColor: '#172734',
  scene: [scene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true },
  audio: { noAudio: true },
  fps: { target: 60 },
});
void game;
$('slot-controls').innerHTML = Array.from(
  { length: 12 },
  (_, i) =>
    '<button class="slot-access" data-slot="' +
    i +
    '" style="left:' +
    slotX(i) / 5 +
    '%;top:' +
    floorY(Math.floor(i / 3)) / 5.9 +
    '%" aria-label="' +
    (Math.floor(i / 3)+1) +
    '행 ' +
    ((i % 3) + 1) +
    '열 빈 칸"></button>',
).join('');
for (const b of document.querySelectorAll<HTMLButtonElement>('.slot-access'))
  b.onclick = () => scene.onSlot(Number(b.dataset.slot));

function save() {
  data.profile = profile;
  data.run = engine?.s ?? null;
  const ok = repo.save(data);
  if (!ok && engine) engine.say('저장 공간을 확인해주세요. 현재 진행은 이 화면에서 유지됩니다.');
}
function beep(freq = 520) {
  if (!profile.settings.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.connect(g);
    g.connect(audio.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 0.5, audio.currentTime + 0.12);
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.14);
    o.start();
    o.stop(audio.currentTime + 0.15);
  } catch {}
}
function bind(id: string, fn: () => void) {
  $(id).onclick = fn;
}
function showModal(html: string) {
  $('modal').innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' + html + '</div>';
  $('modal').hidden = false;
}
function closeModal() {
  $('modal').hidden = true;
  $('modal').innerHTML = '';
  modalKey = '';
}
function dismissible(title: string, html: string) {
  const wasPaused = engine?.paused ?? false;
  if (engine) engine.paused = true;
  showModal(
    '<span class="dialog-emblem">' +
      icon('shield') +
      '</span><h2>' +
      title +
      '</h2>' +
      html +
      '<button class="secondary wide" id="close">돌아가기</button>',
  );
  bind('close', () => {
    closeModal();
    if (engine) engine.paused = wasPaused;
    update();
  });
}
function syncView() {
  const battle = view === 'battle';
  $('hud').hidden = !battle;
  $('canvas').hidden = !battle;
  document.querySelector('.shell')!.classList.toggle('is-battle', battle);
  $('controls').hidden = !battle;
  $('lobby').hidden = battle;
  $('stage').classList.toggle('in-battle', battle);
  scene.engine = battle ? engine : null;
  $('continue').hidden = !engine || ['lost', 'won'].includes(engine.s.phase);
  $('points').textContent = profile.points + ' RP';
  $('best').textContent = profile.best + '웨이브';
  $('wins').textContent = profile.wins + '회';
  $('endless').innerHTML =
    icon(profile.wins ? 'spark' : 'lock') +
    '<span><b>무한 경비</b><small>' +
    (profile.wins ? '한계에 도전하세요' : '일반 경비 클리어 후 개방') +
    '</small></span>';
  $('endless').classList.toggle('locked', !profile.wins);
  if (engine) $('current-run').textContent = engine.s.wave + '웨이브';
  $('pause').innerHTML = icon('pause') + '<span>일시정지</span>';
  $('speed').innerHTML = '<b>' + (engine?.speed || BASE_SPEED) + '×</b><span>전투 속도</span>';
  updateSelected();
  if (engine) engine.paused = !battle;
  save();
  update();
}
function start(mode: 'normal' | 'endless' = 'normal') {
  const begin = () => {
    engine = new Engine(profile, undefined, mode);
    scene.engine = engine;
    view = 'battle';
    lastKills = 0;
    closeModal();
    syncView();
    beep(720);
  };
  if (engine && !['won', 'lost'].includes(engine.s.phase)) {
    dismissible(
      '새 경비를 시작할까요?',
      '<p>진행 중인 경비를 마치고 새 작전을 시작합니다. 연구 기록은 유지됩니다.</p><button class="primary wide" id="new-run">새 작전 시작</button>',
    );
    bind('new-run', begin);
  } else begin();
}
bind('start', () => start());
bind('endless', () => {
  if (profile.wins) start('endless');
  else
    dismissible(
      '아직 닫힌 경비 구역',
      '<p>일반 모드 20웨이브를 방어하면 무한 경비가 열립니다.</p>',
    );
});
bind('continue', () => {
  view = 'battle';
  closeModal();
  syncView();
});
bind('brand', () => {
  view = 'lobby';
  closeModal();
  syncView();
});
bind('home', () => {
  view = 'lobby';
  closeModal();
  syncView();
});
bind('summon', () => {
  if (engine?.summon()) beep(700);
  save();
  update();
});
bind('upgrade', () => {
  if (engine?.upgrade()) beep(430);
  save();
  update();
});
bind('skill', () => {
  if (engine?.skill()) beep(180);
  save();
  update();
});
bind('speed', () => {
  if (engine) {
    engine.speed = engine.speed === BASE_SPEED ? FAST_SPEED : BASE_SPEED;
    $('speed').innerHTML = '<b>' + engine.speed + '×</b><span>전투 속도</span>';
  }
});
bind('pause', () => {
  if (engine) {
    engine.paused = !engine.paused;
    $('pause').innerHTML =
      icon(engine.paused ? 'play' : 'pause') +
      '<span>' +
      (engine.paused ? '계속하기' : '일시정지') +
      '</span>';
    updateSelected();
    update();
    save();
  }
});
scene.onSlot = (slot) => {
  if (!engine || view !== 'battle' || !$('modal').hidden) return;
  const u = engine.s.units.find((u) => u.slot === slot);
  if (u) engine.selected = u.id;
  else if (engine.selected !== null) {
    engine.move(engine.selected, slot);
    beep(350);
    save();
  }
  updateSelected();
};
function updateSelected() {
  const e = engine;
  const panel = $('selected');
  const u = e?.s.units.find((u) => u.id === e.selected);
  if (!e || !u) {
    panel.hidden = true;
    return;
  }
  const d = UNITS.find((d) => d.id === u.kind)!;
  panel.hidden = false;
  const match = e.s.units.some(
    (b) => b.id !== u.id && b.kind === u.kind && b.star === u.star && !b.evolution && !b.moving,
  );
  panel.innerHTML = `<div class="selected-identity"><span class="selected-portrait"><img src="${asset(d.id + '.webp')}" alt=""></span><span><b>${d.name} <em>${'★'.repeat(u.star)}</em></b><small>${u.evolution ? EVOLUTIONS.find((x) => x.id === u.evolution)?.name : d.skill}</small></span></div><div class="selected-actions"><button id="merge" ${match && !u.evolution && u.star < 5 && !e.paused ? '' : 'disabled'}>${icon('merge')}합성</button><button id="evolve" ${u.star >= 3 && d.evolvable && !u.evolution && !e.paused ? '' : 'disabled'}>${icon('spark')}진화</button><button id="deselect" aria-label="선택 해제">${icon('close')}</button></div><p>${Math.floor(u.slot / 3) + 1}행 ${(u.slot % 3) + 1}열 배치 · 빈 칸을 누르면 이동 <span id="elevator-status">재배치 ${e.s.elevatorCd > 0 ? Math.ceil(e.s.elevatorCd) + '초' : '준비 완료'}</span></p>`;
  bind('merge', () => {
    if (e.merge(u.id)) beep(950);
    save();
    updateSelected();
  });
  bind('deselect', () => {
    e.selected = null;
    updateSelected();
  });
  bind('evolve', () => {
    e.paused = true;
    showModal(
      '<span class="eyebrow">돌연변이 진화 · ' +
        d.name +
        '</span><h2>생존의 다음 단계</h2><p>되돌릴 수 없는 진화. 새로운 능력을 선택하세요.</p>' +
        EVOLUTIONS.map(
          (v) =>
            '<button class="choice" id="evo-' +
            v.id +
            '"><b>' +
            v.name +
            '</b><small>' +
            v.desc +
            '</small><span>→</span></button>',
        ).join('') +
        '<button id="cancel-evo" class="quiet wide">취소</button>',
    );
    for (const v of EVOLUTIONS)
      bind('evo-' + v.id, () => {
        e.paused = false;
        e.evolve(u.id, v.id);
        closeModal();
        save();
        updateSelected();
        beep(1100);
      });
    bind('cancel-evo', () => {
      e.paused = false;
      closeModal();
    });
  });
}
bind('research', openResearch);
function openResearch() {
  dismissible(
    '생존 연구소',
    '<p>연구 포인트 <strong>' +
      profile.points +
      ' RP</strong> · 모든 연구 최대 10레벨</p><div class="research-list">' +
      RESEARCH.map((r) => {
        const n = profile.research[r.id] || 0;
        return (
          '<button class="research-row" id="res-' +
          r.id +
          '" ' +
          (n >= 10 || profile.points < 50 + n * 35 ? 'disabled' : '') +
          '><span><b>' +
          r.name +
          ' <em>Lv.' +
          n +
          '</em></b><small>' +
          r.desc +
          '</small></span><strong>' +
          (n >= 10 ? 'MAX' : 50 + n * 35 + ' RP') +
          '</strong></button>'
        );
      }).join('') +
      '</div>',
  );
  for (const r of RESEARCH)
    bind('res-' + r.id, () => {
      if (buyResearch(profile, r.id)) {
        save();
        openResearch();
        beep(680);
      }
    });
}
bind('collection', () =>
  dismissible(
    '101동 생존자 명부',
    '<div class="collection">' +
      UNITS.map(
        (d) =>
          '<div class="survivor rarity-' +
          d.rarity +
          '"><span class="portrait"><img src="' +
          asset(d.id + '.webp') +
          '" alt=""></span><span><small>' +
          RARITIES[d.rarity] +
          '</small><b>' +
          d.name +
          '</b><p>' +
          d.skill +
          '</p><small>공격 ' +
          d.damage +
          ' · 주기 ' +
          d.interval +
          '초' +
          (d.evolvable ? ' · 3성 진화' : '') +
          '</small></span></div>',
      ).join('') +
      '</div>',
  ),
);
bind('settings', () => {
  dismissible(
    '경비실 설정',
    '<label class="toggle">효과음 <input id="sound-setting" type="checkbox" ' +
      (profile.settings.sound ? 'checked' : '') +
      '></label><label class="toggle">타격 연출 <input id="effects-setting" type="checkbox" ' +
      (profile.settings.effects ? 'checked' : '') +
      '></label><div class="help"><b>경비 매뉴얼</b><p>생존자는 사거리 안의 적을 자동 공격합니다. 적은 외곽 통로를 따라 경비실로 접근합니다. 같은 종류·같은 별 2명을 합성하세요. 경비원·소방관·전기기사는 3성부터 진화합니다.</p><p>선택한 생존자는 빈 칸을 눌러 이동합니다. 5웨이브마다 강화가 열립니다. 비상 포격으로 위기를 넘기세요.</p><p>진행 상황은 이 브라우저에 자동 저장됩니다. 브라우저 데이터를 지우면 기록도 지워집니다.</p></div>',
  );
  $('sound-setting').onchange = () => {
    profile.settings.sound = ($('sound-setting') as HTMLInputElement).checked;
    save();
    beep();
  };
  $('effects-setting').onchange = () => {
    profile.settings.effects = ($('effects-setting') as HTMLInputElement).checked;
    save();
  };
});
async function ad(type: string) {
  if (!engine || adBusy || !engine.canAd(type)) return;
  const e = engine;
  e.paused = true;
  adBusy = true;
  try {
    const result = await platform.rewardedAd(
      type,
      () =>
        new Promise<boolean>((resolve) => {
          showModal(
            '<span class="eyebrow">개발용 광고 테스트</span><h2>지원 통신 연결</h2><div class="ad-graphic"><span class="signal"></span><b>생존자 지원 센터</b><small>실제 광고가 아닌 개발용 테스트입니다.</small></div><p>테스트 완료를 누를 때만 보상이 지급됩니다. 취소하면 보상이 지급되지 않습니다.</p><button class="primary wide" id="ad-complete">테스트 완료 · 보상 받기</button><button class="quiet wide" id="ad-cancel">취소</button>',
          );
          bind('ad-complete', () => resolve(true));
          bind('ad-cancel', () => resolve(false));
        }),
    );
    e.paused = false;
    if (result.completed) {
      e.claimAd(type, result.receipt);
      save();
      beep(850);
    }
    closeModal();
  } finally {
    adBusy = false;
    e.paused = false;
    modalKey = '';
    renderPhase();
  }
}
bind('support', () => {
  const e = engine;
  if (!e || e.s.phase !== 'battle') return;
  dismissible(
    '생존자 지원 센터',
    '<p>원할 때만 개발용 모의 광고를 완료하고 지원받을 수 있습니다.</p>' +
      [
        ['hero', '영웅 지원', '전직 군인 45초 합류 · 최대 2회'],
        ['support', '긴급 헬기', '20초 지원 사격 · 최대 1회'],
        ['boss', '보스 보상 2배', '마지막 보스 골드 추가 지급 · 최대 1회'],
      ]
        .map(
          ([id, title, desc]) =>
            '<button class="choice" id="ad-' +
            id +
            '" ' +
            (e.canAd(id) ? '' : 'disabled') +
            '><b>' +
            title +
            '</b><small>' +
            desc +
            '</small><span>' +
            (e.s.adCounts[id] || 0) +
            '/' +
            e.adLimit(id) +
            '</span></button>',
        )
        .join(''),
  );
  for (const id of ['hero', 'support', 'boss'])
    bind('ad-' + id, () => {
      e.paused = false;
      void ad(id);
    });
});
function renderPhase() {
  if (!engine || view !== 'battle' || adBusy) return;
  const e = engine;
  const s = e.s;
  if (s.phase === 'battle') {
    if (modalKey === 'perk' || modalKey === 'event' || modalKey === 'revive') {
      closeModal();
    }
    return;
  }
  if (modalKey === s.phase) return;
  modalKey = s.phase;
  save();
  if (s.phase === 'perk') {
    showModal(
      '<span class="eyebrow">웨이브 강화 · ' +
        (s.wave - 1) +
        '</span><h2>다음 밤을 위한 선택</h2><p>강화 하나를 선택하세요. 이번 경비 동안 유지됩니다.</p>' +
        s.choices
          .map((id) => {
            const p = PERKS.find((p) => p.id === id)!;
            return (
              '<button class="choice" id="perk-' +
              id +
              '"><b>' +
              p.name +
              '</b><small>' +
              p.desc +
              '</small><span>→</span></button>'
            );
          })
          .join('') +
        '<button class="quiet wide" id="reroll" ' +
        (e.canAd('reroll') ? '' : 'disabled') +
        '>모의 광고 · 재추첨 (' +
        (s.adCounts.reroll || 0) +
        '/2)</button>',
    );
    for (const id of s.choices)
      bind('perk-' + id, () => {
        e.choosePerk(id);
        closeModal();
        save();
        beep(750);
      });
    bind('reroll', () => void ad('reroll'));
  } else if (s.phase === 'event') {
    const ev = EVENTS.find((x) => x.id === s.event)!;
    showModal(
      '<span class="eyebrow">돌발 상황 · 무전 수신</span><h2>' +
        ev.name +
        '</h2><p>' +
        ev.desc +
        '</p><button class="primary wide" id="event-accept">' +
        (ev.id === 'supply' ? '300골드 받기' : '확인 · 진행') +
        '</button>' +
        (ev.id === 'supply' || ev.id === 'trade'
          ? '<button class="secondary wide" id="event-alt">' +
            (ev.id === 'supply' ? '내구도 80 회복' : '거래 거절') +
            '</button>'
          : ''),
    );
    bind('event-accept', () => {
      e.resolveEvent();
      closeModal();
      save();
    });
    if (ev.id === 'supply' || ev.id === 'trade')
      bind('event-alt', () => {
        e.resolveEvent(ev.id === 'supply' ? 'heal' : 'decline');
        closeModal();
        save();
      });
  } else if (s.phase === 'revive') {
    showModal(
      '<span class="eyebrow">구조 요청 · 방어선 붕괴</span><h2>아직 끝나지 않았습니다</h2><p>한 번만 내구도 50%를 회복하고 경비를 이어갈 수 있습니다.</p><button class="primary wide" id="revive">모의 광고 · 1회 구조 요청</button><button class="quiet wide" id="giveup">경비 종료</button>',
    );
    bind('revive', () => void ad('revive'));
    bind('giveup', () => {
      s.phase = 'lost';
      closeModal();
      save();
      renderPhase();
    });
  } else if (s.phase === 'won' || s.phase === 'lost') {
    const reward = e.finish();
    save();
    showModal(
      '<span class="eyebrow">OPERATION ' +
        (s.phase === 'won' ? 'COMPLETE' : 'REPORT') +
        '</span><h2>' +
        (s.phase === 'won' ? '오늘 밤도, 살아남았다' : '당신의 경비를 기억합니다') +
        '</h2><p>' +
        (s.phase === 'won'
          ? '101동의 불빛이 다시 켜졌습니다. 무한 경비가 개방되었습니다.'
          : '연구소에서 다음 작전을 준비하세요.') +
        '</p><div class="result"><span>도달 웨이브<b>' +
        s.wave +
        '</b></span><span>처치한 적<b>' +
        s.kills +
        '</b></span><span>연구 포인트<b>+' +
        reward +
        '</b></span></div><button class="primary wide" id="retry">다시 경비 시작</button><button class="secondary wide" id="result-home">로비로 돌아가기</button>',
    );
    bind('retry', () => start(s.mode));
    bind('result-home', () => {
      view = 'lobby';
      closeModal();
      syncView();
    });
  }
}
function refreshSelection() {
  const e = engine;
  if (!e) return;
  const u = e.s.units.find((u) => u.id === e.selected);
  const panel = $('selected');
  if (!u) {
    panel.hidden = true;
    return;
  }
  if (panel.hidden) return;
  const mergeButton = document.getElementById('merge') as HTMLButtonElement | null;
  const evolveButton = document.getElementById('evolve') as HTMLButtonElement | null;
  const match = e.s.units.some(
    (b) => b.id !== u.id && b.kind === u.kind && b.star === u.star && !b.evolution && b.moving <= 0,
  );
  if (mergeButton)
    mergeButton.disabled =
      !match || !!u.evolution || u.star >= 5 || u.moving > 0 || e.paused || e.s.phase !== 'battle';
  if (evolveButton)
    evolveButton.disabled =
      u.star < 3 ||
      !UNITS.find((d) => d.id === u.kind)!.evolvable ||
      !!u.evolution ||
      u.moving > 0 ||
      e.paused ||
      e.s.phase !== 'battle';
  const status = document.getElementById('elevator-status');
  if (status)
    status.textContent =
      '재배치 ' + (e.s.elevatorCd > 0 ? Math.ceil(e.s.elevatorCd) + '초' : '준비 완료');
}
function update() {
  if (view !== 'battle' || !engine) return;
  const e = engine,
    s = e.s;
  refreshSelection();
  $('wave').textContent = String(s.wave).padStart(2, '0');
  $('wave-total').textContent = s.mode === 'normal' ? '/ 20' : '/ ∞';
  $('gold').textContent = Math.floor(s.gold).toLocaleString();
  $('power').textContent = e.power.toLocaleString();
  $('hp-fill').style.width = Math.max(0, (s.hp / s.maxHp) * 100) + '%';
  $('hp-fill').classList.toggle('danger', s.hp / s.maxHp < 0.3);
  $('hp-text').textContent = Math.ceil(s.hp) + ' / ' + s.maxHp;
  $('summon-cost').textContent = s.free > 0 ? '무료 소환 ' + s.free + '회' : e.summonCost + ' G';
  $('upgrade-cost').textContent = e.upgradeCost + ' G · Lv.' + s.upgrade;
  $('skill-cd').textContent = s.skillCd > 0 ? Math.ceil(s.skillCd) + '초' : '사용 가능';
  ($('summon') as HTMLButtonElement).disabled =
    s.units.length >= 12 || s.gold < e.summonCost || e.paused;
  ($('upgrade') as HTMLButtonElement).disabled = s.gold < e.upgradeCost || e.paused;
  ($('skill') as HTMLButtonElement).disabled = s.skillCd > 0 || e.paused;
  $('toast').textContent = e.noticeUntil > s.time ? e.notice : '';
  $('hint').textContent = e.paused
    ? '경비 일시정지 · 계속하기를 눌러 재개하세요.'
    : s.blackout > 0
      ? '정전 중 · 전기기사 공격속도 감소 ' + Math.ceil(s.blackout) + '초'
      : s.support > 0
        ? '지원 헬기 사격 중 · ' + Math.ceil(s.support) + '초'
        : '생존자를 선택 → 합성 · 진화 · 빈 칸으로 재배치';
  if (lastKills < s.kills) {
    beep(150 + Math.random() * 130);
    lastKills = s.kills;
  }
  if (!profile.settings.effects) e.fx = [];
  for (const button of document.querySelectorAll<HTMLButtonElement>('.slot-access')) {
    const slot = Number(button.dataset.slot);
    const u = s.units.find((u) => u.slot === slot);
    const name = u ? UNITS.find((d) => d.id === u.kind)!.name + ' ' + u.star + '성' : '빈 칸';
    button.setAttribute(
      'aria-label',
      Math.floor(slot / 3) + 1 + '행 ' + ((slot % 3) + 1) + '열 ' + name,
    );
    button.setAttribute('aria-pressed', String(!!u && e.selected === u.id));
  }
  renderPhase();
}
setInterval(update, 150);
setInterval(() => {
  if (engine && view === 'battle') save();
}, 1000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine) {
    engine.paused = true;
    $('pause').innerHTML = icon('play') + '<span>계속하기</span>';
    save();
  }
});
window.addEventListener('pagehide', save);
syncView();
