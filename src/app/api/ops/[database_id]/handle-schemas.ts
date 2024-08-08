import { DatabaseOperationHandler } from "@/lib/with-database-ops";
import { NextResponse } from "next/server";
import { createTursoEdgeDriver } from "./turso-edge-client";

const handleSchemasRequest: DatabaseOperationHandler = async ({
  permission,
  database,
}) => {
  const client = await createTursoEdgeDriver(database);

  try {
    const tables = await client.schemas();

    return NextResponse.json({
      data: permission.rules.filterTableList(tables),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message });
  }
};

export default handleSchemasRequest;
