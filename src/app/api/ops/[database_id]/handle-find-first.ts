import { DatabaseOperationHandler } from "@/lib/with-database-ops";
import { NextResponse } from "next/server";
import { createTursoEdgeDriver } from "./turso-edge-client";
import { RequestOperationFindFirst } from "@/lib/api/api-request-types";

const handleFindFirst: DatabaseOperationHandler<
  RequestOperationFindFirst
> = async ({ database, body, permission }) => {
  permission.rules.checkViewTable(body.tableName);
  const client = await createTursoEdgeDriver(database);

  try {
    return NextResponse.json({
      data: await client.findFirst(body.tableName, body.options),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message });
  }
};

export default handleFindFirst;
