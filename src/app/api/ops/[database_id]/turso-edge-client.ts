import { database } from "@/db/schema";
import RqliteDriver from "@/drivers/rqlite-driver";
import TursoDriver from "@/drivers/turso-driver";
import ValtownDriver from "@/drivers/valtown-driver";
import { env } from "@/env";
import { decrypt } from "@/lib/encryption-edge";

export async function createTursoEdgeDriver(db: typeof database.$inferSelect) {
  const url = db.host ?? "";

  if (db.driver === "rqlite") {
    return new RqliteDriver(
      url,
      db.username ? await decrypt(env.ENCRYPTION_KEY, db.username) : "",
      db.password ? await decrypt(env.ENCRYPTION_KEY, db.password) : ""
    );
  } else if (db.driver === "valtown") {
    return new ValtownDriver(
      db.token ? await decrypt(env.ENCRYPTION_KEY, db.token) : ""
    );
  }

  const token = db.token
    ? await decrypt(env.ENCRYPTION_KEY, db.token ?? "")
    : "";
  return new TursoDriver(url, token);
}
