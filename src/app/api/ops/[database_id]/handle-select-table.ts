import { DatabaseOperationHandler } from "@/lib/with-database-ops";
import { NextResponse } from "next/server";
import { createTursoEdgeDriver } from "./turso-edge-client";
import { RequestOperationSelectTable } from "@/lib/api/api-request-types";
import { ApiError } from "@/lib/api-error";
import { HttpStatus } from "@/constants/http-status";

const handleSelectTableRequest: DatabaseOperationHandler<
  RequestOperationSelectTable
> = async ({ database, body, permission }) => {
  permission.rules.checkViewTable(body.tableName, {
    raw: body.options?.whereRaw,
  });

  const client = await createTursoEdgeDriver(database);

  if (body.options.orderBy) {
    for (const orderOption of body.options.orderBy) {
      if (orderOption.by !== "DESC" && orderOption.by !== "ASC") {
        throw new ApiError({
          message: "Order by must be DESC or ASC",
          status: HttpStatus.FORBIDDEN,
        });
      }
    }
  }

  try {
    return NextResponse.json(
      await client.selectTable(body.tableName, body.options)
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message });
  }
};

export default handleSelectTableRequest;
