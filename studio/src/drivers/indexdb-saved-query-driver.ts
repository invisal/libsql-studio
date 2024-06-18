import {
  SavedQueryChangeListener,
  SavedQueryDriver,
  SavedQueryItem,
} from "@libsqlstudio/gui/driver";
import { idb } from "@studio/db/indexdb";

export default class IndexDbSavedQueryDriver implements SavedQueryDriver {
  protected projectId: string;
  protected cb: SavedQueryChangeListener[] = [];
  protected cache: SavedQueryItem[] = [];

  constructor(id: string) {
    this.projectId = id;
  }

  addChangeListener(callback: SavedQueryChangeListener): void {
    this.cb.push(callback);
  }

  removeChangeListener(callback: SavedQueryChangeListener): void {
    this.cb = this.cb.filter((c) => c !== callback);
  }

  async get(id: string): Promise<SavedQueryItem | undefined> {
    const data = await idb.query.get(id);
    return data;
  }

  async getList(): Promise<SavedQueryItem[]> {
    const data = await idb.query.toArray();
    this.cache = data;
    return data;
  }

  async remove(id: string): Promise<void> {
    await idb.query.delete(id);
    this.cache = this.cache.filter((r) => r.id !== id);
    this.trigger();
  }

  async create(data: { name: string; code: string }): Promise<string> {
    const id = window.crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const tmp = {
      id,
      projectId: this.projectId,
      name: data.name,
      code: data.code,
      createdAt: now,
      updatedAt: now,
    };

    await idb.query.add(tmp);
    this.cache.push(tmp);
    this.trigger();

    return id;
  }

  async update(
    id: string,
    data: { name: string; code: string }
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const old = await this.get(id);

    if (old) {
      const tmp = {
        id,
        projectId: this.projectId,
        name: data.name,
        code: data.code,
        createdAt: old.createdAt,
        updatedAt: now,
      };
      await idb.query.update(id, tmp);
      this.cache = this.cache.map((r) => {
        if (r.id === id) return tmp;
        return r;
      });
    }

    this.trigger();
  }

  /**
   * Remove the whole saved query
   */
  async removeAll(): Promise<void> {
    await idb.query.where({ project_id: this.projectId }).delete();
    this.cache = [];
  }

  trigger() {
    for (const cb of this.cb) {
      cb(this.cache);
    }
  }
}
