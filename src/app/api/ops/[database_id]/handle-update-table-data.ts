import { DatabaseOperationHandler } from "@/lib/with-database-ops";
import { NextResponse } from "next/server";
import { createTursoEdgeDriver } from "./turso-edge-client";
import { RequestOperationUpdateTableData } from "@/lib/api/api-request-types";

const handleUpdateTableDataRequest: DatabaseOperationHandler<
  RequestOperationUpdateTableData
> = async ({ database, permission, body }) => {
  permission.rules.checkUpdateTable(body.tableName, body.ops);

  const client = await createTursoEdgeDriver(database);
  const tableName = body.tableName;
  const tableSchema = await client.tableSchema(tableName);

  try {
    return NextResponse.json(
      await client.updateTableData(tableName, body.ops, tableSchema)
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message });
  }
};

export default handleUpdateTableDataRequest;
