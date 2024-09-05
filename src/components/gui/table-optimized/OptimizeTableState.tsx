import { selectArrayFromIndexList } from "@/components/lib/export-helper";
import { OptimizeTableHeaderProps } from ".";
import { LucideKey, LucideKeySquare, LucideSigma } from "lucide-react";
import {
  DatabaseResultSet,
  DatabaseTableSchema,
  TableColumnDataType,
} from "@/drivers/base-driver";
import { ReactElement } from "react";
import deepEqual from "deep-equal";

export interface OptimizeTableRowValue {
  raw: Record<string, unknown>;
  change?: Record<string, unknown>;
  changeKey?: number;
  isNewRow?: boolean;
  isRemoved?: boolean;
}

type TableChangeEventCallback = (state: OptimizeTableState) => void;

export default class OptimizeTableState {
  protected focus: [number, number] | null = null;
  protected selectedRows = new Set<number>();
  protected data: OptimizeTableRowValue[] = [];
  protected headers: OptimizeTableHeaderProps[] = [];
  protected headerWidth: number[] = [];
  protected editMode = false;
  protected readOnlyMode = false;
  public mismatchDetection = false;
  protected container: HTMLDivElement | null = null;

  protected changeCallback: TableChangeEventCallback[] = [];
  protected changeDebounceTimerId: NodeJS.Timeout | null = null;

  protected changeCounter = 1;
  protected changeLogs: Record<number, OptimizeTableRowValue> = {};

  static createFromResult(
    dataResult: DatabaseResultSet,
    schemaResult?: DatabaseTableSchema
  ) {
    return new OptimizeTableState(
      dataResult.headers.map((header) => {
        let initialSize = 150;
        const headerName = header.name;
        const dataType = header.type;

        if (
          dataType === TableColumnDataType.INTEGER ||
          dataType === TableColumnDataType.REAL
        ) {
          initialSize = 100;
        } else if (dataType === TableColumnDataType.TEXT) {
          // Use 100 first rows to determine the good initial size
          let maxSize = 0;
          for (let i = 0; i < Math.min(dataResult.rows.length, 100); i++) {
            const currentCell = dataResult.rows[i];
            if (currentCell) {
              maxSize = Math.max(
                (currentCell[headerName ?? ""]?.toString() ?? "").length,
                maxSize
              );
            }
          }

          initialSize = Math.max(150, Math.min(500, maxSize * 8));
        }

        const headerData = schemaResult
          ? schemaResult.columns.find((c) => c.name === header.name)
          : undefined;

        // --------------------------------------
        // Matching foreign key
        // --------------------------------------
        let foreignKey = headerData?.constraint?.foreignKey;
        if (!foreignKey && schemaResult?.constraints) {
          for (const c of schemaResult.constraints) {
            if (
              c.foreignKey &&
              c.foreignKey.columns?.length === 1 &&
              c.foreignKey.columns[0] === header.name
            ) {
              foreignKey = c.foreignKey;
            }
          }
        }

        let icon: ReactElement | undefined = undefined;
        if (schemaResult?.pk.includes(headerName ?? "")) {
          icon = <LucideKey className="w-4 h-4 text-red-500" />;
        } else if (foreignKey) {
          icon = <LucideKeySquare className="w-4 h-4 text-yellow-500" />;
        } else if (headerData?.constraint?.generatedExpression) {
          icon = <LucideSigma className="w-4 h-4 text-blue-500" />;
        }

        return {
          initialSize,
          name: headerName ?? "",
          originalDataType: header.originalType,
          displayName: header.displayName,
          resizable: true,
          headerData,
          foreignKey,
          dataType,
          icon,
        };
      }),
      dataResult.rows.map((r) => ({ ...r }))
    );
  }

  constructor(
    headers: OptimizeTableHeaderProps[],
    data: Record<string, unknown>[]
  ) {
    this.headers = headers;
    this.data = data.map((row) => ({
      raw: row,
    }));
    this.headerWidth = headers.map((h) => h.initialSize);
  }

  setReadOnlyMode(readOnly: boolean) {
    this.readOnlyMode = readOnly;
  }

  getReadOnlyMode() {
    return this.readOnlyMode;
  }

  setContainer(div: HTMLDivElement | null) {
    this.container = div;
  }

  // ------------------------------------------------
  // Event Handlers
  // ------------------------------------------------
  addChangeListener(cb: TableChangeEventCallback) {
    this.changeCallback.push(cb);
  }

  removeChangeListener(cb: TableChangeEventCallback) {
    this.changeCallback = this.changeCallback.filter((c) => c !== cb);
  }

  protected broadcastChange(instant?: boolean) {
    if (instant) {
      if (this.changeDebounceTimerId) clearTimeout(this.changeDebounceTimerId);
      this.changeCallback.reverse().forEach((cb) => cb(this));
    }

    if (this.changeDebounceTimerId) return false;
    this.changeDebounceTimerId = setTimeout(() => {
      this.changeDebounceTimerId = null;
      this.changeCallback.reverse().forEach((cb) => cb(this));
    }, 5);

    return true;
  }

  // ------------------------------------------------
  // Handle headers and data
  // ------------------------------------------------
  getHeaders() {
    return this.headers;
  }

  getValue(y: number, x: number): unknown {
    const rowChange = this.data[y]?.change;
    if (rowChange) {
      const currentHeaderName = this.headers[x]?.name ?? "";
      if (currentHeaderName in rowChange) {
        return rowChange[currentHeaderName];
      }

      return this.getOriginalValue(y, x);
    }
    return this.getOriginalValue(y, x);
  }

  hasCellChange(y: number, x: number) {
    const changeLog = this.data[y]?.change;
    if (!changeLog) return false;

    const currentHeaderName = this.headers[x]?.name ?? "";
    return currentHeaderName in changeLog;
  }

  getOriginalValue(y: number, x: number): unknown {
    const currentHeaderName = this.headers[x]?.name ?? "";
    return this.data[y]?.raw[currentHeaderName];
  }

  changeValue(y: number, x: number, newValue: unknown) {
    if (this.readOnlyMode) return;

    const oldValue = this.getOriginalValue(y, x);

    const row = this.data[y];
    const headerName = this.headers[x]?.name ?? "";

    if (!row) return;

    if (deepEqual(oldValue, newValue)) {
      const rowChange = row.change;
      if (rowChange && headerName in rowChange) {
        delete rowChange[headerName];
        if (Object.entries(rowChange).length === 0) {
          if (row.changeKey) {
            delete this.changeLogs[row.changeKey];
            delete row.changeKey;
          }
          delete row.change;
        }
      }
    } else {
      const rowChange = row.change;
      if (rowChange) {
        rowChange[headerName] = newValue;
      } else {
        row.changeKey = ++this.changeCounter;
        row.change = { [headerName]: newValue };
        this.changeLogs[row.changeKey] = row;
      }
    }

    this.broadcastChange();
  }

  getChangedRows() {
    return Object.values(this.changeLogs);
  }

  getRowsCount() {
    return this.data.length;
  }

  getHeaderCount() {
    return this.headers.length;
  }

  disardAllChange() {
    const newRows: OptimizeTableRowValue[] = [];

    for (const row of Object.values(this.changeLogs)) {
      if (row.isNewRow) {
        newRows.push(row);
        delete row.change;
        delete row.changeKey;
        delete row.isNewRow;
      } else {
        delete row.change;
        delete row.changeKey;
        delete row.isRemoved;
      }
    }

    // Remove all new rows
    this.data = this.data.filter((row) => !newRows.includes(row));
    this.changeLogs = {};

    this.broadcastChange(true);
  }

  applyChanges(
    updatedRows: {
      row: OptimizeTableRowValue;
      updated: Record<string, unknown>;
    }[]
  ) {
    const rowChanges = this.getChangedRows();
    const removedRows = rowChanges.filter((row) => row.isRemoved);

    for (const row of rowChanges) {
      const updated = updatedRows.find((updateRow) => updateRow.row === row);
      row.raw = { ...row.raw, ...row.change, ...updated?.updated };
      delete row.changeKey;
      delete row.change;
      delete row.isNewRow;
      delete row.isRemoved;
    }

    if (removedRows.length > 0) {
      this.data = this.data.filter((row) => !removedRows.includes(row));
    }

    this.changeLogs = {};
    this.broadcastChange();
  }

  insertNewRow(index = -1) {
    if (index === -1) {
      const focus = this.getFocus();
      if (focus) index = focus.y;
    }

    if (index < 0) index = 0;

    const newRow = {
      isNewRow: true,
      raw: {},
      change: {},
      changeKey: ++this.changeCounter,
    };

    this.data.splice(index, 0, newRow);
    this.changeLogs[newRow.changeKey] = newRow;
    this.broadcastChange();
  }

  isNewRow(index: number) {
    return !!this.data[index]?.isNewRow;
  }

  removeRow(index = -1) {
    if (index === -1) {
      // Remove the row at focus
      const focus = this.getFocus();
      if (focus) index = focus.y;
    }

    const row = this.data[index];

    if (row) {
      if (row.isNewRow && row.changeKey) {
        delete this.changeLogs[row.changeKey];
        this.data = this.data.filter((dataRow) => dataRow != row);
      } else {
        row.isRemoved = true;
        if (!row.changeKey) {
          row.change = {};
          row.changeKey = ++this.changeCounter;
          this.changeLogs[row.changeKey] = row;
        }
      }
    }

    this.broadcastChange();
  }

  isRemovedRow(index: number) {
    return !!this.data[index]?.isRemoved;
  }

  getAllRows() {
    return this.data;
  }

  // ------------------------------------------------
  // Handle focus logic
  // ------------------------------------------------
  getFocus(): { x: number; y: number } | null {
    return this.focus
      ? {
          x: this.focus[1],
          y: this.focus[0],
        }
      : null;
  }

  getFocusValue(): unknown {
    const focusCell = this.getFocus();
    if (focusCell) {
      return this.getValue(focusCell.y, focusCell.x);
    }

    return undefined;
  }

  setFocusValue(newValue: unknown) {
    const focusCell = this.getFocus();
    if (focusCell) {
      this.changeValue(focusCell.y, focusCell.x, newValue);
    }
  }

  hasFocus(y: number, x: number): boolean {
    if (!this.focus) return false;
    return this.focus[0] === y && this.focus[1] === x;
  }

  setFocus(y: number, x: number) {
    this.focus = [y, x];
    this.broadcastChange();
  }

  isInEditMode() {
    return this.editMode;
  }

  enterEditMode() {
    this.editMode = true;
    this.broadcastChange();
  }

  exitEditMode() {
    this.editMode = false;

    if (this.container) {
      this.container.focus();
    }

    this.broadcastChange();
  }

  clearFocus() {
    this.focus = null;
    this.broadcastChange();
  }

  setHeaderWidth(idx: number, newWidth: number) {
    return (this.headerWidth[idx] = newWidth);
  }

  getHeaderWidth() {
    return this.headerWidth;
  }

  scrollToFocusCell(horizontal: "left" | "right", vertical: "top" | "bottom") {
    if (this.container && this.focus) {
      const cellX = this.focus[1];
      const cellY = this.focus[0];
      let cellLeft = 0;
      let cellRight = 0;
      const cellTop = (cellY + 1) * 38;
      const cellBottom = cellTop + 38;

      for (let i = 0; i < cellX; i++) {
        cellLeft += this.headerWidth[i] ?? 0;
      }
      cellRight = cellLeft + (this.headerWidth[cellX] ?? 0);

      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const containerLeft = this.container.scrollLeft;
      const containerRight = containerLeft + this.container.clientWidth;
      const containerTop = this.container.scrollTop;
      const containerBottom = containerTop + height;

      if (horizontal === "right") {
        if (cellRight > containerRight) {
          this.container.scrollLeft = Math.max(0, cellRight - width);
        }
      } else {
        if (cellLeft < containerLeft) {
          this.container.scrollLeft = cellLeft;
        }
      }

      if (vertical === "bottom") {
        if (cellBottom > containerBottom) {
          this.container.scrollTop = Math.max(0, cellBottom - height);
        }
      } else {
        if (cellTop - 38 < containerTop) {
          this.container.scrollTop = Math.max(0, cellTop - 38);
        }
      }
    }
  }

  // ------------------------------------------------
  // Handle select row logic
  // ------------------------------------------------
  clearSelect() {
    this.selectedRows.clear();
    this.broadcastChange();
  }

  getSelectedRowCount() {
    return this.selectedRows.size;
  }

  getSelectedRowsArray(): unknown[][] {
    return selectArrayFromIndexList(this.data, this.getSelectedRowIndex()).map(
      (row) => this.headers.map((header) => row.raw[header.name])
    );
  }

  getSelectedRowIndex() {
    return Array.from(this.selectedRows.values());
  }

  getSelectedRows(): OptimizeTableRowValue[] {
    return this.data.filter((row, index) => this.selectedRows.has(index));
  }

  selectRow(y: number, toggle?: boolean) {
    if (toggle) {
      if (this.selectedRows.has(y)) {
        this.selectedRows.delete(y);
      } else {
        this.selectedRows.add(y);
      }
    } else {
      this.selectedRows.add(y);
    }
    this.broadcastChange();
  }

  selectRange(y1: number, y2: number) {
    const maxY = Math.max(y1, y2);
    const minY = Math.min(y1, y2);

    this.selectedRows.clear();
    for (let i = minY; i <= maxY; i++) {
      this.selectedRows.add(i);
    }

    this.broadcastChange();
  }

  isRowSelected(y: number) {
    return this.selectedRows.has(y);
  }
}
