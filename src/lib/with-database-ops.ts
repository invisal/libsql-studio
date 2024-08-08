import { database, database_role, database_user_role } from "@/db/schema";
import { User } from "lucia";
import withUser from "./with-user";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { get_database } from "@/db";
import { getSession } from "./auth";
import { ApiError } from "./api-error";
import parseSafeJson from "./json-safe";
import { PermissionController } from "@/app/api/ops/[database_id]/permission-controller";

export interface DatabasePermissionTableRule {
  name: string;
  insert: boolean;
  update: boolean;
  delete: boolean;
}

export interface DatabasePermissionRule {
  tables: DatabasePermissionTableRule[];
}

export interface DatabasePermission {
  isOwner: boolean;
  canExecuteQuery: boolean;
  rules: PermissionController;
}

export async function getDatabaseWithAuth(databaseId: string) {
  const db = get_database();
  const { user } = await getSession();

  if (!user)
    throw new ApiError({ message: "You do not have permission", status: 500 });

  const [info, role] = await db.batch([
    db.query.database.findFirst({ where: eq(database.id, databaseId) }),
    db.query.database_user_role.findFirst({
      where: and(
        eq(database_user_role.databaseId, databaseId),
        eq(database_user_role.userId, user.id)
      ),
    }),
  ]);

  if (!info || info.deletedAt !== null) {
    throw new ApiError({ message: "Database does not exist", status: 500 });
  }

  if (!role) {
    throw new ApiError({ message: "You do not have permission", status: 500 });
  }

  return { info, role, user, db };
}

export type DatabaseOperationHandler<BodyType = unknown> = (props: {
  user: User;
  body: BodyType;
  database: typeof database.$inferSelect;
  permission: DatabasePermission;
}) => Promise<NextResponse>;

export default function withDatabaseOperation<T = unknown>(
  handler: DatabaseOperationHandler<T>
) {
  return withUser<{ params: { database_id: string } }>(
    async ({ user, req, params }) => {
      const databaseId = params.params.database_id;
      const db = get_database();

      if (!databaseId) {
        return NextResponse.json(
          { error: "Database is not provided" },
          { status: 500 }
        );
      }

      const { info: databaseInfo, role: databaseRole } =
        await getDatabaseWithAuth(databaseId);

      const roleId = databaseRole.roleId ?? "";
      const permission = await db.query.database_role.findFirst({
        where: eq(database_role.id, roleId),
      });

      if (!permission) {
        return NextResponse.json(
          { error: "You do not have permission" },
          { status: 500 }
        );
      }

      return await handler({
        user,
        body:
          headers().get("Content-Type") === "application/json"
            ? await req.json()
            : {},
        database: databaseInfo,
        permission: {
          isOwner: !!permission.isOwner,
          canExecuteQuery: !!permission.canExecuteQuery,
          rules: new PermissionController(
            !!permission.isOwner,
            !!permission.canExecuteQuery,
            parseSafeJson<DatabasePermissionRule>(permission.permissions, {
              tables: [],
            })
          ),
        },
      });
    }
  );
}
