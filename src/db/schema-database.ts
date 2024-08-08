import {
  index,
  int,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { user } from "./schema-user";

export const database = sqliteTable(
  "database",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    name: text("name"),
    description: text("description"),
    color: text("color").default("gray"),
    driver: text("driver").default("turso"),
    host: text("host"),
    token: text("token"),
    username: text("username"),
    password: text("password"),
    databaseName: text("database_name"),
    createdAt: int("created_at"),
    deletedAt: int("deleted_at"),
  },
  (table) => {
    return { databaseUserIdx: index("database_user_idx").on(table.userId) };
  }
);

export const database_role = sqliteTable(
  "database_role",
  {
    id: text("id").primaryKey(),
    databaseId: text("database_id")
      .notNull()
      .references(() => database.id),
    name: text("name"),
    canExecuteQuery: int("can_execute_query").default(0),
    isOwner: int("is_owner").default(0),
    permissions: text("permissions"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: int("created_at"),
    updatedBy: text("updated_by").references(() => user.id),
    updatedAt: int("updated_at"),
  },
  (table) => {
    return {
      databaseRoleIdx: index("database_role_idx").on(table.databaseId),
    };
  }
);

export const database_user_role = sqliteTable(
  "database_user_role",
  {
    userId: text("user_id").references(() => user.id),
    databaseId: text("database_id").references(() => database.id),
    roleId: text("role_id").references(() => database_role.id),
    createdAt: int("created_at"),
    createdBy: text("created_by").references(() => user.id),
  },
  (table) => {
    return { pk: primaryKey({ columns: [table.databaseId, table.userId] }) };
  }
);
