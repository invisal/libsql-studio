import {
  exportRowsToMarkdown,
  exportRowsToAsciiTable,
} from "@/components/lib/export-helper";

describe("exportRowsToMarkdown", () => {
  it("should export rows to markdown", () => {
    const headers = ["Name", "Age", "City"];
    const records = [
      ["Alice", 30, "New York"],
      ["Bob", 25, "San Francisco"],
      ["Charlie", 35, "Los Angeles"],
    ];
    const cellTextLimit = 50;

    const result = exportRowsToMarkdown(headers, records, cellTextLimit);

    expect(result).toBe(
      `| Name    | Age | City          |
| ------- | --- | ------------- |
| Alice   | 30  | New York      |
| Bob     | 25  | San Francisco |
| Charlie | 35  | Los Angeles   |`
    );
  });

  it("should truncate cell text if it exceeds the limit", () => {
    const headers = ["Name", "Description"];
    const records = [
      ["Alice", "A very long description that exceeds the limit"],
      ["Bob", "Short description"],
    ];
    const cellTextLimit = 20;

    const result = exportRowsToMarkdown(headers, records, cellTextLimit);

    expect(result).toBe(
      `| Name  | Description             |
| ----- | ----------------------- |
| Alice | A very long descript... |
| Bob   | Short description       |`
    );
  });
});

describe("exportRowsToAsciiTable", () => {
  it("should export rows to ASCII table format", () => {
    const headers = ["Name", "Age", "City"];
    const records = [
      ["Alice", 30, "New York"],
      ["Bob", 25, "San Francisco"],
      ["Charlie", 35, "Los Angeles"],
    ];
    const cellTextLimit = 50;

    const result = exportRowsToAsciiTable(headers, records, cellTextLimit);

    expect(result).toBe(
      `┌─────────┬─────┬───────────────┐
│ Name    │ Age │ City          │
╞═════════╪═════╪═══════════════╡
│ Alice   │ 30  │ New York      │
├─────────┼─────┼───────────────┤
│ Bob     │ 25  │ San Francisco │
├─────────┼─────┼───────────────┤
│ Charlie │ 35  │ Los Angeles   │
└─────────┴─────┴───────────────┘`
    );
  });

  it("should truncate cell text if it exceeds the limit in ASCII table", () => {
    const headers = ["Name", "Description"];
    const records = [
      ["Alice", "A very long description that exceeds the limit"],
      ["Bob", "Short description"],
    ];
    const cellTextLimit = 20;

    const result = exportRowsToAsciiTable(headers, records, cellTextLimit);

    expect(result).toBe(
      `┌───────┬─────────────────────────┐
│ Name  │ Description             │
╞═══════╪═════════════════════════╡
│ Alice │ A very long descript... │
├───────┼─────────────────────────┤
│ Bob   │ Short description       │
└───────┴─────────────────────────┘`
    );
  });
});
