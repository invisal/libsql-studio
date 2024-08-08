import {
  DatabaseSchemaItem,
  DatabaseTableOperation,
} from "@/drivers/base-driver";
import { ApiError } from "@/lib/api-error";
import { DatabasePermissionRule } from "@/lib/with-database-ops";

export class PermissionController {
  protected rules: DatabasePermissionRule;
  protected isOwner: boolean;
  protected canExecuteQuery: boolean;

  constructor(
    isOwner: boolean,
    canExecuteQuery: boolean,
    rules: DatabasePermissionRule
  ) {
    this.rules = rules;
    this.canExecuteQuery = canExecuteQuery;
    this.isOwner = isOwner;
  }

  filterTableList(tables: DatabaseSchemaItem[]): DatabaseSchemaItem[] {
    if (this.canExecuteQuery) return tables;

    const allowedTables = new Set(
      this.rules.tables.map((t) => t.name.toUpperCase())
    );

    return tables.filter((table) =>
      allowedTables.has(table.name.toUpperCase())
    );
  }

  private findTableRule(name: string) {
    return this.rules.tables.find(
      (t) => t.name.toUpperCase() === name.toUpperCase()
    );
  }

  checkUpdateTable(tableName: string, ops: DatabaseTableOperation[]) {
    if (this.canExecuteQuery) return;
    const rule = this.findTableRule(tableName);

    if (!rule) {
      throw new ApiError({ message: "You do not have permission" });
    }

    for (const op of ops) {
      if (op.operation === "DELETE" && !rule.delete)
        throw new ApiError({ message: "You do not have DELETE permission" });
      if (op.operation === "INSERT" && !rule.insert)
        throw new ApiError({ message: "You do not have INSERT permission" });
      if (op.operation === "UPDATE" && !rule.update)
        throw new ApiError({ message: "You do not have UPDATE permission" });
    }
  }

  checkViewTable(name: string, options?: { raw?: string }) {
    if (this.canExecuteQuery) return;

    if (!this.findTableRule(name)) {
      throw new ApiError({ message: "You do not have permission" });
    }

    if (options?.raw) {
      throw new ApiError({
        message: "No permission to execute query",
      });
    }
  }

  checkExecuteQuery() {
    if (!this.canExecuteQuery) {
      throw new ApiError({
        message: "No permission to execute query",
      });
    }
  }
}
