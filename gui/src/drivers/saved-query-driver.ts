export interface SavedQueryItem {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: {
    id: string;
    name: string;
  };
}

export type SavedQueryChangeListener = (list: SavedQueryItem[]) => void;

export abstract class SavedQueryDriver {
  abstract getList(): Promise<SavedQueryItem[]>;
  abstract get(id: string): Promise<SavedQueryItem | undefined>;
  abstract remove(id: string): Promise<void>;
  abstract create(data: { name: string; code: string }): Promise<string>;
  abstract update(
    id: string,
    data: {
      name: string;
      code: string;
    }
  ): Promise<void>;
  abstract addChangeListener(callback: SavedQueryChangeListener): void;
  abstract removeChangeListener(callback: SavedQueryChangeListener): void;
}
