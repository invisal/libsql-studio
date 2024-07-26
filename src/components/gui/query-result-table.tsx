import GenericCell from "@/components/gui/table-cell/generic-cell";
import NumberCell from "@/components/gui/table-cell/number-cell";
import TextCell from "@/components/gui/table-cell/text-cell";
import OptimizeTable, {
  OptimizeTableCellRenderProps,
  OptimizeTableHeaderWithIndexProps,
} from "@/components/gui/table-optimized";
import OptimizeTableState from "@/components/gui/table-optimized/OptimizeTableState";
import {
  exportRowsToExcel,
  exportRowsToSqlInsert,
  exportRowsToJson,
} from "@/components/lib/export-helper";
import { KEY_BINDING } from "@/lib/key-matcher";
import {
  StudioContextMenuItem,
  openContextMenuFromEvent,
} from "@/messages/open-context-menu";
import {
  LucideChevronDown,
  LucidePin,
  LucidePlus,
  LucideSortAsc,
  LucideSortDesc,
  LucideTrash2,
} from "lucide-react";
import React, { PropsWithChildren, useCallback, useState } from "react";
import {
  ColumnSortOption,
  DatabaseValue,
  TableColumnDataType,
} from "@/drivers/base-driver";
import parseSafeJson from "@/lib/json-safe";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import BigNumberCell from "./table-cell/big-number-cell";
import { useDatabaseDriver } from "@/context/driver-provider";
import { useConfig } from "@/context/config-provider";
import { useFullEditor } from "./providers/full-editor-provider";

interface ResultTableProps {
  data: OptimizeTableState;
  tableName?: string;
  onSortColumnChange?: (columns: ColumnSortOption[]) => void;
  sortColumns?: ColumnSortOption[];
}

function detectTextEditorType(
  value: DatabaseValue<string>
): "input" | "json" | "text" {
  if (typeof value !== "string") return "input";

  // Check if it is JSON format
  const trimmedText = value.trim();
  if (
    trimmedText.substring(0, 1) === "{" &&
    trimmedText.substring(trimmedText.length - 1) === "}"
  ) {
    if (parseSafeJson(trimmedText, undefined) !== undefined) return "json";
  }

  // Check if it is long string
  if (value.length > 200) return "text";

  // If it is multiple line
  if (value.search(/[\n\r]/) >= 0) return "text";

  return "input";
}

function Header({
  children,
  header,
}: PropsWithChildren<{ header: OptimizeTableHeaderWithIndexProps }>) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <div
          className="flex grow items-center px-2"
          onContextMenu={() => {
            setOpen(true);
          }}
        >
          {header.icon ? <div className="mr-2">{header.icon}</div> : null}
          <div className="grow line-clamp-1 font-mono">
            {header.displayName}
          </div>
          <LucideChevronDown className="text-mute w-4 h-4 cursor-pointer" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={"w-[300px]"}
        side="bottom"
        align="start"
        sideOffset={0}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ResultTable({
  data,
  tableName,
  onSortColumnChange,
}: ResultTableProps) {
  const { openEditor } = useFullEditor();
  const [stickyHeaderIndex, setStickHeaderIndex] = useState<number>();
  const { databaseDriver } = useDatabaseDriver();
  const { extensions } = useConfig();
  const batchSize: number = 1;

  const renderHeader = useCallback(
    (header: OptimizeTableHeaderWithIndexProps) => {
      const foreignKeyInfo = header.foreignKey ? (
        <div className="p-2">
          <div className="text-xs p-2 bg-yellow-200 text-black rounded">
            <h2 className="font-semibold">Foreign Key</h2>
            <p className="mt-1 font-mono">
              {header.foreignKey.foreignTableName}.
              {(header.foreignKey.foreignColumns ?? [])[0]}
            </p>
          </div>
        </div>
      ) : undefined;

      const generatedExpression =
        header.headerData?.constraint?.generatedExpression;
      const generatedInfo = generatedExpression ? (
        <div className="p-2">
          <div className="text-xs p-2 bg-blue-200 text-black rounded">
            <h2 className="font-semibold">Generated Expression</h2>
            <pre className="text-sm">
              <code>{generatedExpression}</code>
            </pre>
          </div>
        </div>
      ) : undefined;

      return (
        <Header header={header}>
          {foreignKeyInfo}
          {generatedInfo}
          <DropdownMenuItem
            onClick={() => {
              setStickHeaderIndex(
                header.index === stickyHeaderIndex ? undefined : header.index
              );
            }}
          >
            <LucidePin className="w-4 h-4 mr-2" />
            Pin Header
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!tableName}
            onClick={() => {
              if (onSortColumnChange) {
                onSortColumnChange([{ columnName: header.name, by: "ASC" }]);
              }
            }}
          >
            <LucideSortAsc className="w-4 h-4 mr-2" />
            Sort A → Z
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!tableName}
            onClick={() => {
              if (onSortColumnChange) {
                onSortColumnChange([{ columnName: header.name, by: "DESC" }]);
              }
            }}
          >
            <LucideSortDesc className="w-4 h-4 mr-2" />
            Sort Z → A
          </DropdownMenuItem>
        </Header>
      );
    },
    [stickyHeaderIndex, tableName, onSortColumnChange]
  );

  const renderCell = useCallback(
    ({ y, x, state, header }: OptimizeTableCellRenderProps) => {
      const isFocus = state.hasFocus(y, x);
      const editMode = isFocus && state.isInEditMode();

      if (header.dataType === TableColumnDataType.TEXT) {
        const value = state.getValue(y, x) as DatabaseValue<string>;
        const editor = detectTextEditorType(value);

        return (
          <TextCell
            header={header}
            state={state}
            editor={editor}
            editMode={editMode}
            value={state.getValue(y, x) as DatabaseValue<string>}
            focus={isFocus}
            isChanged={state.hasCellChange(y, x)}
            onChange={(newValue) => {
              state.changeValue(y, x, newValue);
            }}
          />
        );
      } else if (header.dataType === TableColumnDataType.REAL) {
        return (
          <NumberCell
            header={header}
            state={state}
            editMode={editMode}
            value={state.getValue(y, x) as DatabaseValue<number>}
            focus={isFocus}
            isChanged={state.hasCellChange(y, x)}
            onChange={(newValue) => {
              state.changeValue(y, x, newValue);
            }}
          />
        );
      } else if (header.dataType === TableColumnDataType.INTEGER) {
        if (databaseDriver.supportBigInt()) {
          return (
            <BigNumberCell
              header={header}
              state={state}
              editMode={editMode}
              value={state.getValue(y, x) as DatabaseValue<bigint>}
              focus={isFocus}
              isChanged={state.hasCellChange(y, x)}
              onChange={(newValue) => {
                state.changeValue(y, x, newValue);
              }}
            />
          );
        } else {
          return (
            <NumberCell
              header={header}
              state={state}
              editMode={editMode}
              value={state.getValue(y, x) as DatabaseValue<number>}
              focus={isFocus}
              isChanged={state.hasCellChange(y, x)}
              onChange={(newValue) => {
                state.changeValue(y, x, newValue);
              }}
            />
          );
        }
      }

      return (
        <GenericCell value={state.getValue(y, x) as string} header={header} />
      );
    },
    [databaseDriver]
  );

  const onHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const copyCallback = useCallback((state: OptimizeTableState) => {
    const focus = state.getFocus();
    if (focus) {
      const y = focus.y;
      const x = focus.x;
      window.navigator.clipboard.writeText(state.getValue(y, x) as string);
    }
  }, []);

  const pasteCallback = useCallback((state: OptimizeTableState) => {
    const focus = state.getFocus();
    if (focus) {
      const y = focus.y;
      const x = focus.x;
      window.navigator.clipboard.readText().then((pasteValue) => {
        state.changeValue(y, x, pasteValue);
      });
    }
  }, []);

  const onCellContextMenu = useCallback(
    ({
      state,
      event,
    }: {
      state: OptimizeTableState;
      event: React.MouseEvent;
    }) => {
      const randomUUID = crypto.randomUUID();
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const hasFocus = !!state.getFocus();

      function setFocusValue(newValue: unknown) {
        const focusCell = state.getFocus();
        if (focusCell) {
          state.changeValue(focusCell.y, focusCell.x, newValue);
        }
      }

      const extensionMenu = (extensions ?? []).reduce<StudioContextMenuItem[]>(
        (menu, ext) => {
          if (ext.contextMenu) {
            return [...menu, ...ext.contextMenu(state)];
          }
          return menu;
        },
        []
      );

      openContextMenuFromEvent([
        {
          title: "Insert Value",
          disabled: !hasFocus,
          subWidth: 200,
          sub: [
            {
              title: <pre>NULL</pre>,
              onClick: () => {
                setFocusValue(null);
              },
            },
            {
              title: <pre>DEFAULT</pre>,
              onClick: () => {
                setFocusValue(undefined);
              },
            },
            { separator: true },
            {
              title: (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Unix Timestamp</span>
                  <span>{timestamp}</span>
                </div>
              ),
              onClick: () => {
                setFocusValue(timestamp);
              },
            },
            { separator: true },
            {
              title: (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">UUID </span>
                  <span>{randomUUID}</span>
                </div>
              ),
              onClick: () => {
                setFocusValue(randomUUID);
              },
            },
          ],
        },
        {
          title: "Open With",
          sub: [
            {
              title: "Full Text Editor",
              onClick: () => {
                const focusValue = state.getFocusValue();
                if (typeof focusValue === "string") {
                  openEditor({
                    initialValue: focusValue,
                    format: "text",
                    readOnly: state.getReadOnlyMode(),
                    onCancel: () => {},
                    onSave: (newValue) => {
                      state.setFocusValue(newValue);
                    },
                  });
                }
              },
            },
            {
              title: "JSON Editor",
              onClick: () => {
                const focusValue = state.getFocusValue();
                if (typeof focusValue === "string") {
                  openEditor({
                    initialValue: focusValue,
                    format: "json",
                    readOnly: state.getReadOnlyMode(),
                    onCancel: () => {},
                    onSave: (newValue) => {
                      state.setFocusValue(newValue);
                    },
                  });
                }
              },
            },
          ],
        },
        ...((extensionMenu ?? []).length > 0
          ? [
              {
                separator: true,
              },
            ]
          : []),
        ...extensionMenu,
        {
          separator: true,
        },
        {
          title: "Copy Cell Value",
          shortcut: KEY_BINDING.copy.toString(),
          onClick: () => {
            copyCallback(state);
          },
        },
        {
          title: "Paste",
          shortcut: KEY_BINDING.paste.toString(),
          onClick: () => {
            pasteCallback(state);
          },
        },
        {
          separator: true,
        },
        {
          title: "Copy Row As",
          sub: [
            {
              title: "Copy as Excel",
              onClick: () => {
                if (state.getSelectedRowCount() > 0) {
                  window.navigator.clipboard.writeText(
                    exportRowsToExcel(state.getSelectedRowsArray())
                  );
                }
              },
            },
            {
              title: "Copy as Json",
              onClick: () => {
                const headers = state
                  .getHeaders()
                  .map((column) => column?.name ?? "");

                if (state.getSelectedRowCount() > 0) {
                  window.navigator.clipboard.writeText(
                    exportRowsToJson(headers, state.getSelectedRowsArray())
                  );
                }
              },
            },
            {
              title: "Copy as INSERT SQL",
              onClick: () => {
                const headers = state
                  .getHeaders()
                  .map((column) => column?.name ?? "");

                if (state.getSelectedRowCount() > 0) {
                  window.navigator.clipboard.writeText(
                    exportRowsToSqlInsert(
                      tableName ?? "UnknownTable",
                      headers,
                      state.getSelectedRowsArray(),
                      batchSize
                    )
                  );
                }
              },
            },
          ],
        },
        { separator: true },
        {
          title: "Insert row",
          icon: LucidePlus,
          onClick: () => {
            data.insertNewRow();
          },
        },
        {
          title: "Delete selected row(s)",
          icon: LucideTrash2,
          onClick: () => {
            data.getSelectedRowIndex().forEach((index) => {
              data.removeRow(index);
            });
          },
        },
      ])(event);
    },
    [data, tableName, copyCallback, pasteCallback, extensions, openEditor]
  );

  const onKeyDown = useCallback(
    (state: OptimizeTableState, e: React.KeyboardEvent) => {
      if (state.isInEditMode()) return;

      if (KEY_BINDING.copy.match(e as React.KeyboardEvent<HTMLDivElement>)) {
        copyCallback(state);
      } else if (
        KEY_BINDING.paste.match(e as React.KeyboardEvent<HTMLDivElement>)
      ) {
        pasteCallback(state);
      } else if (e.key === "ArrowRight") {
        const focus = state.getFocus();
        if (focus && focus.x + 1 < state.getHeaderCount()) {
          state.setFocus(focus.y, focus.x + 1);
          state.scrollToFocusCell("right", "top");
        }
      } else if (e.key === "ArrowLeft") {
        const focus = state.getFocus();
        if (focus && focus.x - 1 >= 0) {
          state.setFocus(focus.y, focus.x - 1);
          state.scrollToFocusCell("left", "top");
        }
      } else if (e.key === "ArrowUp") {
        const focus = state.getFocus();
        if (focus && focus.y - 1 >= 0) {
          state.setFocus(focus.y - 1, focus.x);
          state.scrollToFocusCell("left", "top");
        }
      } else if (e.key === "ArrowDown") {
        const focus = state.getFocus();
        if (focus && focus.y + 1 < state.getRowsCount()) {
          state.setFocus(focus.y + 1, focus.x);
          state.scrollToFocusCell("left", "bottom");
        }
      } else if (e.key === "Tab") {
        const focus = state.getFocus();
        if (focus) {
          const colCount = state.getHeaderCount();
          const n = focus.y * colCount + focus.x + 1;
          const x = n % colCount;
          const y = Math.floor(n / colCount);
          if (y >= state.getRowsCount()) return;
          state.setFocus(y, x);
          state.scrollToFocusCell(x === 0 ? "left" : "right", "bottom");
        }
      } else if (e.key === "Enter") {
        state.enterEditMode();
      }

      e.preventDefault();
    },
    [copyCallback, pasteCallback]
  );

  return (
    <OptimizeTable
      internalState={data}
      onContextMenu={onCellContextMenu}
      onHeaderContextMenu={onHeaderContextMenu}
      stickyHeaderIndex={stickyHeaderIndex}
      renderAhead={20}
      renderHeader={renderHeader}
      renderCell={renderCell}
      rowHeight={35}
      onKeyDown={onKeyDown}
    />
  );
}
