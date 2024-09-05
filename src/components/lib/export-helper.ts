import {
  escapeCsvValue,
  escapeIdentity,
  escapeSqlValue,
} from "@/drivers/sqlite/sql-helper";

export function selectArrayFromIndexList<T = unknown>(
  data: T[],
  indexList: number[]
): T[] {
  return indexList.map((index) => data[index]) as T[];
}

export function exportRowsToSqlInsert(
  tableName: string,
  headers: string[],
  records: unknown[][],
  batchSize: number
): string {
  const result: string[] = [];
  const headersPart = headers.map(escapeIdentity).join(", ");

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const valuesPart = batch
      .map((record) => `(${record.map(escapeSqlValue).join(", ")})`)
      .join(",\n  ");

    const line = `INSERT INTO ${escapeIdentity(tableName)}(${headersPart}) VALUES\n  ${valuesPart};`;
    result.push(line);
  }

  return result.join("\n\n");
}

function cellToExcelValue(value: unknown) {
  if (value === undefined) return "";
  if (value === null) return "NULL";
  return value.toString();
}

export function exportRowsToExcel(records: unknown[][]) {
  const result: string[] = [];

  for (const record of records) {
    const line = record.map(cellToExcelValue).join("\t");
    result.push(line);
  }

  return result.join("\r\n");
}

export function exportRowsToJson(
  headers: string[],
  records: unknown[][]
): string {
  const recordsWithBigIntAsString = records.map((record) =>
    record.map((value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

  const recordsAsObjects = recordsWithBigIntAsString.map((record) =>
    record.reduce<Record<string, unknown>>((obj, value, index) => {
      const header = headers[index];
      if (header !== undefined) {
        obj[header] = value;
      }
      return obj;
    }, {})
  );

  return JSON.stringify(recordsAsObjects, null, 2);
}

export function exportRowsToCsv(
  headers: string[],
  records: unknown[][]
): string {
  const result: string[] = [];

  // Add headers
  const escapedHeaders = headers.map(escapeCsvValue);
  const headerLine = escapedHeaders.join(",");
  result.push(headerLine);

  // Add records
  for (const record of records) {
    const escapedRecord = record.map(escapeCsvValue);
    const recordLine = escapedRecord.join(",");
    result.push(recordLine);
  }

  return result.join("\n");
}

function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function calculateColumnWidths(
  headers: string[],
  records: unknown[][],
  cellTextLimit: number
): number[] {
  return headers.map((header, index) => {
    const maxContentWidth = Math.max(
      header.length,
      ...records.map((record) => {
        const cellContent = String(record[index]);
        return cellContent.length > cellTextLimit
          ? cellTextLimit + 3
          : cellContent.length;
      })
    );
    return Math.min(maxContentWidth, cellTextLimit + 3);
  });
}

export function exportRowsToMarkdown(
  headers: string[],
  records: unknown[][],
  cellTextLimit: number
): string {
  const result: string[] = [];
  const columnWidths = calculateColumnWidths(headers, records, cellTextLimit);

  // Add headers
  const headerRow = `| ${headers.map((h, i) => truncateText(h, cellTextLimit).padEnd(columnWidths[i])).join(" | ")} |`;
  result.push(headerRow);

  // Add separator
  const separator = `| ${columnWidths.map((width) => "-".repeat(width)).join(" | ")} |`;
  result.push(separator);

  // Add records
  for (const record of records) {
    const row = `| ${record
      .map((cell, index) =>
        truncateText(String(cell), cellTextLimit).padEnd(columnWidths[index])
      )
      .join(" | ")} |`;
    result.push(row);
  }

  return result.join("\n");
}

export function exportRowsToAsciiTable(
  headers: string[],
  records: unknown[][],
  cellTextLimit: number
): string {
  const result: string[] = [];
  const columnWidths = calculateColumnWidths(headers, records, cellTextLimit);

  // Create top border
  const topBorder = `┌${columnWidths.map((width) => "─".repeat(width + 2)).join("┬")}┐`;
  result.push(topBorder);

  // Add headers
  const headerRow = `│ ${headers
    .map((h, i) => truncateText(h, cellTextLimit).padEnd(columnWidths[i]))
    .join(" │ ")} │`;
  result.push(headerRow);

  // Add separator
  const headerSeparator = `╞${columnWidths.map((width) => "═".repeat(width + 2)).join("╪")}╡`;
  result.push(headerSeparator);

  // Add records
  for (const record of records) {
    const row = `│ ${record
      .map((cell, index) =>
        truncateText(String(cell), cellTextLimit).padEnd(columnWidths[index])
      )
      .join(" │ ")} │`;
    result.push(row);

    // Add separator between rows, except for the last row
    if (record !== records[records.length - 1]) {
      const rowSeparator = `├${columnWidths.map((width) => "─".repeat(width + 2)).join("┼")}┤`;
      result.push(rowSeparator);
    }
  }

  // Add bottom border
  const bottomBorder = `└${columnWidths.map((width) => "─".repeat(width + 2)).join("┴")}┘`;
  result.push(bottomBorder);

  return result.join("\n");
}

export function getFormatHandlers(
  records: unknown[][],
  headers: string[],
  tableName: string,
  cellTextLimit: number,
  batchSize: number
): Record<string, (() => string) | undefined> {
  return {
    csv: () => exportRowsToCsv(headers, records),
    json: () => exportRowsToJson(headers, records),
    sql: () => exportRowsToSqlInsert(tableName, headers, records, batchSize),
    markdown: () => exportRowsToMarkdown(headers, records, cellTextLimit),
    ascii: () => exportRowsToAsciiTable(headers, records, cellTextLimit),
  };
}
