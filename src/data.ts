export type Kind='guard'|'fire'|'electric'|'sniper'|'drone'|'chemist'|'soldier'|'agent';
export type Attack='single'|'burn'|'chain'|'snipe'|'multi'|'poison'|'burst'|'pierce';
export interface UnitDef {id:Kind;name:string;rarity:number;damage:number;interval:number;range:number;attack:Attack;color:number;skill:string;evolvable:boolean}
export const UNITS:UnitDef[]=[
{id:'guard',name:'경비원',rarity:0,damage:17,interval:.65,range:260,attack:'single',color:0x72b7d0,skill:'신속 사격',evolvable:true},
{id:'fire',name:'소방관',rarity:1,damage:23,interval:1.2,range:220,attack:'burn',color:0xf39e64,skill:'화염 확산 · 화상',evolvable:true},
{id:'electric',name:'전기기사',rarity:1,damage:20,interval:1.1,range:275,attack:'chain',color:0xf4d465,skill:'연쇄 감전',evolvable:true},
{id:'sniper',name:'저격수',rarity:2,damage:100,interval:2.1,range:430,attack:'snipe',color:0xc5a5ee,skill:'보스 피해 1.6배',evolvable:false},
{id:'drone',name:'드론 조종사',rarity:2,damage:20,interval:.85,range:340,attack:'multi',color:0x74dbc3,skill:'2기 동시 타격',evolvable:false},
{id:'chemist',name:'화학 연구원',rarity:2,damage:20,interval:1.3,range:300,attack:'poison',color:0xa3d56e,skill:'중독 · 방어력 감소',evolvable:false},
{id:'soldier',name:'전직 군인',rarity:3,damage:25,interval:.28,range:310,attack:'burst',color:0xe0b982,skill:'5회마다 강화 탄환',evolvable:false},
{id:'agent',name:'특수 요원',rarity:4,damage:77,interval:.8,range:440,attack:'pierce',color:0xffce74,skill:'전선 관통',evolvable:false}];
export const RARITIES=['일반','고급','희귀','영웅','전설'];
export interface EnemyDef {id:string;name:string;hp:number;speed:number;armor:number;color:number;damage:number}
export const ENEMIES:EnemyDef[]=[
{id:'zombie',name:'감염자',hp:85,speed:17,armor:0,color:0x9cae88,damage:8},
{id:'runner',name:'질주자',hp:60,speed:29,armor:0,color:0xc1a181,damage:9},
{id:'armor',name:'철갑 감염자',hp:180,speed:12,armor:.35,color:0x8297a9,damage:13},
{id:'explode',name:'포자 폭탄',hp:110,speed:20,armor:0,color:0xe89575,damage:20},
{id:'ranged',name:'침 뱉는 괴물',hp:115,speed:15,armor:0,color:0xb493c9,damage:10},
{id:'flying',name:'비행 변이체',hp:90,speed:24,armor:0,color:0x80c5bd,damage:12},
{id:'mutant',name:'거대 돌연변이',hp:1900,speed:8,armor:.15,color:0xbf816c,damage:40},
{id:'breaker',name:'붕괴자',hp:4500,speed:7,armor:.22,color:0xd87485,damage:60}];
export type Stat='damage'|'speed'|'gold'|'discount'|'chain'|'fireRange'|'hp'|'crit'|'poison'|'boss'|'skill'|'cooldown'|'elevator'|'range'|'regen'|'start'|'drone'|'burn'|'armor'|'splash';
export interface Perk {id:Stat;name:string;desc:string;value:number}
export const PERKS:Perk[]=[
{id:'damage',name:'철갑 탄환',desc:'전체 공격력 +20%',value:.2},
{id:'speed',name:'전투 각성',desc:'전체 공격속도 +15%',value:.15},
{id:'gold',name:'자원 회수',desc:'처치 골드 +20%',value:.2},
{id:'discount',name:'주민 네트워크',desc:'소환 비용 15% 할인',value:.15},
{id:'chain',name:'고압 전류',desc:'전기 연쇄 대상 +1',value:1},
{id:'fireRange',name:'확산 노즐',desc:'화염 범위 +30%',value:.3},
{id:'hp',name:'내진 보강',desc:'최대 내구도 +25%, 같은 양 회복',value:.25},
{id:'crit',name:'침착한 조준',desc:'저격수 치명타 확률 +25%',value:.25},
{id:'poison',name:'불안정 시약',desc:'독 지속 피해 +50%',value:.5},
{id:'boss',name:'대형 표적',desc:'보스에게 주는 피해 +25%',value:.25},
{id:'skill',name:'지원 포격',desc:'긴급 스킬 피해 +40%',value:.4},
{id:'cooldown',name:'무전 중계기',desc:'긴급 스킬 대기시간 20% 감소',value:.2},
{id:'elevator',name:'급행 운행',desc:'엘리베이터 대기시간 30% 감소',value:.3},
{id:'range',name:'고배율 렌즈',desc:'전체 사거리 +20%',value:.2},
{id:'regen',name:'수리 드론',desc:'매초 내구도 0.6 회복',value:.6},
{id:'start',name:'비상 금고',desc:'즉시 400골드 지급',value:400},
{id:'drone',name:'군집 제어',desc:'드론 동시 타격 +1',value:1},
{id:'burn',name:'고열 연료',desc:'화상 지속 피해 +50%',value:.5},
{id:'armor',name:'약점 분석',desc:'적 방어력 15% 무시',value:.15},
{id:'splash',name:'파편 탄두',desc:'일반 사격에 25% 주변 피해',value:.25}];
export const EVOLUTIONS=[{id:'rapid',name:'폭풍 사격',desc:'공격속도 +80% · 연속 타격'}, {id:'shield',name:'수호 방벽',desc:'전체 침입 피해 30% 감소 · 내구도 40 회복'}, {id:'flame',name:'불꽃 각성',desc:'화염 범위 공격 · 공격력 +50%'}];
export const EVENTS=[{id:'blackout',name:'도시 정전',desc:'10초간 전기기사의 공격속도가 절반으로 감소합니다.'},{id:'parcel',name:'의문의 택배',desc:'빈 방에 생존자 한 명이 무료로 합류합니다.'},{id:'helicopter',name:'구조 헬기',desc:'30초 동안 헬기의 지원 사격이 도착합니다.'},{id:'rush',name:'괴물 폭주',desc:'다음 웨이브에 적 4마리 추가, 30초간 처치 골드 50% 증가.'},{id:'trade',name:'수상한 거래',desc:'최대 내구도 15%를 대가로 공격력 25%를 얻습니다.'},{id:'supply',name:'긴급 보급',desc:'300골드 또는 내구도 80 회복을 선택하세요.'}];
export const RESEARCH=[{id:'damage',name:'전투 훈련',desc:'레벨당 공격력 +3%'},{id:'start',name:'비축 자금',desc:'레벨당 시작 골드 +30'},{id:'hp',name:'건물 보강',desc:'레벨당 내구도 +15'},{id:'gold',name:'전리품 수거',desc:'레벨당 처치 골드 +3%'},{id:'discount',name:'모집 공고',desc:'레벨당 소환 비용 -1%'},{id:'skill',name:'비상 매뉴얼',desc:'레벨당 스킬 피해 +5%'}] as const;
