import Dexie, { EntityTable } from "dexie";

const idb = new Dexie("libsqlstudio") as Dexie & {
  query: EntityTable<
    {
      id: string;
      projectId: string;
      code: string;
      name: string;
      createdAt: number;
      updatedAt: number;
    },
    "id"
  >;
};

idb.version(1).stores({
  query: "++id, projectId",
});

export { idb };
