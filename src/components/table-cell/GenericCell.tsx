import { useMemo } from "react";
import styles from "./styles.module.css";
import { isLinkString } from "@/lib/validation";
import DisplayLinkCell from "./display-link-cell";

interface TableCellProps<T = unknown> {
  value: T;
  focus?: boolean;
  isChanged?: boolean;
  onFocus?: () => void;
  onDoubleClick?: () => void;
}

export default function GenericCell({
  value,
  onFocus,
  isChanged,
  focus,
  onDoubleClick,
}: TableCellProps<unknown>) {
  const className = [
    styles.cell,
    focus ? styles.focus : null,
    "pl-2 pr-2",
    isChanged ? styles.change : null,
  ]
    .filter(Boolean)
    .join(" ");

  const content = useMemo(() => {
    if (value === null) {
      return <span className="text-gray-500 float-right">NULL</span>;
    }

    if (value === undefined) {
      return <span className="text-gray-500 float-right">DEFAULT</span>;
    }

    if (typeof value === "string") {
      if (isLinkString(value)) {
        return <DisplayLinkCell link={value} />;
      }

      return (
        <span
          className={
            isChanged ? "text-black" : "text-gray-500 dark:text-gray-300"
          }
        >
          {value}
        </span>
      );
    }

    if (typeof value === "number" || typeof value === "bigint") {
      return (
        <span
          className={
            isChanged
              ? "text-black block text-right"
              : "text-blue-700 dark:text-blue-300 block text-right"
          }
        >
          {value.toString()}
        </span>
      );
    }

    if (value instanceof ArrayBuffer) {
      const sliceByte = value.slice(0, 64);
      const base64Text = btoa(
        new Uint8Array(sliceByte).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      return (
        <div className="flex">
          <div className="mr-2 justify-center items-center flex-col">
            <span className="bg-blue-500 text-white inline rounded p-1 pl-2 pr-2">
              blob
            </span>
          </div>
          <div className="text-orange-600">{base64Text}</div>
        </div>
      );
    }

    return <span>{value.toString()}</span>;
  }, [value, isChanged]);

  return (
    <div
      className={className}
      onMouseDown={onFocus}
      onDoubleClick={onDoubleClick}
    >
      {content}
    </div>
  );
}
