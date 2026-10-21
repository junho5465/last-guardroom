export function waveBalance(wave: number, mode: 'normal' | 'endless') {
  const late = Math.max(0, wave - 5);
  const normal = 1 + (wave - 1) * 0.14 + late * late * 0.012;
  return {
    hp: normal * (mode === 'endless' ? 1.45 + wave * 0.025 : 1),
    count: 7 + Math.floor(wave * (mode === 'endless' ? 1.15 : 0.9)),
    spawnInterval: Math.max(0.35, 1.35 - wave * 0.04),
    enemyKinds: Math.min(6, 2 + Math.floor(wave / 2)),
  };
}
