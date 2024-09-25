import { useState, useEffect, useCallback, useRef } from "react";
import GenericCell from "./generic-cell";
import { DatabaseValue, TableColumnDataType } from "@/drivers/base-driver";
import OptimizeTableState from "../table-optimized/OptimizeTableState";
import { useFullEditor } from "../providers/full-editor-provider";
import { OptimizeTableHeaderWithIndexProps } from "../table-optimized";
import { cn } from "@/lib/utils";

export interface TableEditableCell<T = unknown> {
  value: DatabaseValue<T>;
  valueType: TableColumnDataType | undefined;
  isChanged?: boolean;
  focus?: boolean;
  editMode?: boolean;
  state: OptimizeTableState;
  onChange?: (newValue: DatabaseValue<T>) => void;
  editor?: "input" | "json" | "text";
  header: OptimizeTableHeaderWithIndexProps;
}

interface TabeEditableCellProps<T = unknown> {
  toString: (v: DatabaseValue<T>) => DatabaseValue<string>;
  toValue: (v: DatabaseValue<string>) => DatabaseValue<T>;
  align?: "left" | "right";
}

function InputCellEditor({
  value,
  align,
  discardChange,
  readOnly,
  applyChange,
  onChange,
  state,
}: Readonly<{
  align?: "left" | "right";
  applyChange: (v: DatabaseValue<string>, shouldExit?: boolean) => void;
  discardChange: () => void;
  value: DatabaseValue<string>;
  onChange: (v: string) => void;
  state: OptimizeTableState;
  readOnly?: boolean;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldExit = useRef(true);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <input
      ref={inputRef}
      autoFocus
      readOnly={readOnly}
      onBlur={() => {
        applyChange(value, shouldExit.current);
      }}
      onChange={(e) => {
        onChange(e.currentTarget.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          applyChange(value);
          e.stopPropagation();
        } else if (e.key === "Escape") {
          discardChange();
        } else if (e.key === "Tab") {
          // Enter the next cell
          const focus = state.getFocus();
          if (focus) {
            const colCount = state.getHeaderCount();
            const n = focus.y * colCount + focus.x + 1;
            const x = n % colCount;
            const y = Math.floor(n / colCount);
            if (y >= state.getRowsCount()) return;

            shouldExit.current = false;
            applyChange(value, false);

            state.setFocus(y, x);
            state.scrollToFocusCell(x === 0 ? "left" : "right", "bottom");
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }}
      type="text"
      className={
        align === "right"
          ? "font-mono bg-background w-full h-full outline-none pl-2 pr-2 border-0 text-right"
          : "font-mono bg-background w-full h-full outline-none pl-2 pr-2 border-0"
      }
      value={value ?? ""}
    />
  );
}

export default function createEditableCell<T = unknown>({
  toString,
  toValue,
  align,
}: TabeEditableCellProps<T>): React.FC<TableEditableCell<T>> {
  return function GenericEditableCell({
    value,
    valueType,
    isChanged,
    focus,
    onChange,
    state,
    editor,
    editMode,
    header,
  }: TableEditableCell<T>) {
    const [editValue, setEditValue] = useState<DatabaseValue<string>>(
      toString(value)
    );
    const { openEditor } = useFullEditor();

    useEffect(() => {
      setEditValue(toString(value));
    }, [value]);

    const applyChange = useCallback(
      (v: DatabaseValue<string>, shouldExitEdit = true) => {
        if (onChange) onChange(toValue(v) ?? (v as DatabaseValue<T>));
        if (shouldExitEdit) {
          state.exitEditMode();
        }
      },
      [onChange, state]
    );

    const discardChange = useCallback(() => {
      setEditValue(toString(value));
      state.exitEditMode();
    }, [setEditValue, state, value]);

    const uneditableColumn =
      !!header.headerData?.constraint?.generatedExpression;

    if (
      !uneditableColumn &&
      editMode &&
      (editor === undefined || editor === "input")
    ) {
      return (
        <div
          className={cn(
            "libsql-cell flex",
            focus && "libsql-focus",
            isChanged && "libsql-change"
          )}
        >
          <InputCellEditor
            state={state}
            readOnly={state.getReadOnlyMode()}
            align={align}
            applyChange={applyChange}
            discardChange={discardChange}
            onChange={setEditValue}
            value={editValue}
          />
        </div>
      );
    }

    return (
      <GenericCell
        header={header}
        value={toValue(editValue)}
        valueType={valueType}
        focus={focus}
        isChanged={isChanged}
        align={align}
        mismatchDetection={state.mismatchDetection}
        onDoubleClick={() => {
          if (
            typeof editValue === "string" &&
            (editor === "json" || editor === "text")
          ) {
            openEditor({
              format: editor,
              initialValue: editValue,
              readOnly: state.getReadOnlyMode(),
              onCancel: () => state.exitEditMode(),
              onSave: applyChange,
            });
          }
          state.enterEditMode();
        }}
      />
    );
  };
}
