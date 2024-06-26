import type {
  SavedConnectionItemConfigConfig,
  SupportedDriver,
} from "@/app/connect/saved-connection-storage";
import { get_database } from "@/db";
import { dbTempSession } from "@/db/schema";
import { getSessionFromCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";
import dynamic from "next/dynamic";

const ClientPageBody = dynamic(() => import("./page-client"), {
  ssr: false,
});

export default async function SessionPage({
  searchParams,
}: {
  searchParams: { sid: string };
}) {
  const { session } = await getSessionFromCookie();

  if (!session) {
    return <div>Something wrong</div>;
  }

  const now = Math.floor(Date.now() / 1000);
  const db = get_database();
  const sessionId = searchParams?.sid;

  const sessionInfo = await db.query.dbTempSession.findFirst({
    where: eq(dbTempSession.id, sessionId),
  });

  if (!sessionInfo) {
    return <div className="p-4">Session Not Found</div>;
  }

  if (now > (sessionInfo.expiredAt ?? 0)) {
    return <div className="p-4">Session Expired</div>;
  }

  const credential: SavedConnectionItemConfigConfig = JSON.parse(
    sessionInfo.credential ?? ""
  );

  return (
    <ClientPageBody
      name={sessionInfo.name ?? "Temporary Session"}
      expired={sessionInfo.expiredAt ?? 0}
      config={{
        driver: sessionInfo.driver as SupportedDriver,
        ...credential,
      }}
    />
  );
}
