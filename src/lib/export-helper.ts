import { escapeIdentity, escapeSqlValue } from "./sql-helper";
import * as hrana from "@libsql/hrana-client";

export function selectArrayFromIndexList<T = unknown>(
  data: Array<T>,
  indexList: number[]
): Array<T> {
  return indexList.map((index) => data[index]);
}

export function transformResultToArray(
  headers: string[],
  data: Array<hrana.Row>
): unknown[][] {
  return data.map((row) => {
    return headers.map((header) => row[header]);
  });
}

export function exportRowsToSqlInsert(
  tableName: string,
  headers: string[],
  records: unknown[][]
): string {
  let result: string[] = [];

  const headersPart = headers.map(escapeIdentity).join(", ");

  for (const record of records) {
    const valuePart = record.map(escapeSqlValue).join(", ");
    const line = `INSERT INTO ${escapeIdentity(
      tableName
    )}(${headersPart}) VALUES(${valuePart});`;

    result.push(line);
  }

  return result.join("\r\n");
}

function cellToExcelValue(value: unknown) {
  if (value === undefined) return "";
  if (value === null) return "NULL";
  return value.toString();
}

export function exportRowsToExcel(records: unknown[][]) {
  let result: string[] = [];

  for (const record of records) {
    const line = record.map(cellToExcelValue).join("\t");
    result.push(line);
  }

  return result.join("\r\n");
}