import { defaultProfile, type Profile, type State } from './engine';
export interface SaveData {
  version: 1;
  profile: Profile;
  run: State | null;
}
export interface Repository {
  load(): SaveData;
  save(data: SaveData): boolean;
}
export class LocalRepository implements Repository {
  constructor(private storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {}
  load(): SaveData {
    const fallback: SaveData = { version: 1, profile: defaultProfile(), run: null };
    try {
      const raw = this.storage.getItem('guardroom.save.v1');
      if (!raw) return fallback;
      const d = JSON.parse(raw);
      if (
        d.version !== 1 ||
        d.profile?.version !== 1 ||
        !Number.isFinite(d.profile.points) ||
        !Array.isArray(d.profile.completed) ||
        !d.profile.settings ||
        !d.profile.research
      )
        return fallback;
      if (
        d.run &&
        (d.run.version !== 1 ||
          !Array.isArray(d.run.units) ||
          !Array.isArray(d.run.enemies) ||
          !Number.isFinite(d.run.gold) ||
          !d.run.claims ||
          !d.run.adCounts ||
          !d.run.eventOrder)
      )
        d.run = null;
      return d;
    } catch {
      return fallback;
    }
  }
  save(data: SaveData) {
    try {
      this.storage.setItem('guardroom.save.v1', JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
}
