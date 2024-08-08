import { headers } from "next/headers";
import { databaseOperationHandler } from "../../ops/[database_id]/handler";
import { get_database } from "@/db";
import { eq } from "drizzle-orm";
import { dbTempSession } from "@/db/schema-temp-session";
import withErrorHandler from "@/lib/with-error-handler";
import { ApiError } from "@/lib/api-error";
import { HttpStatus } from "@/constants/http-status";
import parseSafeJson from "@/lib/json-safe";
import { SavedConnectionItemConfigConfig } from "@/app/(theme)/connect/saved-connection-storage";
import { PermissionController } from "../../ops/[database_id]/permission-controller";

export const runtime = "edge";

export const POST = withErrorHandler<{ params: { session_id: string } }>(
  async function ({ req, params }) {
    const db = get_database();
    const session = await db.query.dbTempSession.findFirst({
      where: eq(dbTempSession.id, params.params.session_id),
    });

    if (!session) {
      throw new ApiError({
        message: "Session does not exist",
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if ((session.expiredAt ?? 0) < now) {
      throw new ApiError({
        message: "Session has expired",
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const body =
      headers().get("Content-Type") === "application/json"
        ? await req.json()
        : {};

    const config = parseSafeJson<SavedConnectionItemConfigConfig | null>(
      session.credential ?? "",
      null
    );

    if (config === null) {
      throw new ApiError({
        message: "Problem parsing the credential",
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return await databaseOperationHandler({
      body,
      permission: {
        canExecuteQuery: true,
        isOwner: true,
        rules: new PermissionController(true, true, { tables: [] }),
      },
      database: {
        databaseName: "",
        driver: session.driver,
        host: config.url,
        password: config.password ?? null,
        token: config.token,
        color: null,
        createdAt: null,
        deletedAt: null,
        description: "",
        id: "",
        name: "",
        userId: "",
        username: config.username ?? null,
      },
      user: {
        id: "0",
        name: "Guest",
        picture: "",
        storageUsage: 0,
      },
    });
  }
);
