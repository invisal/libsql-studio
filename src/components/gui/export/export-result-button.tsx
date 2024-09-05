import { Button, buttonVariants } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type OptimizeTableState from "../table-optimized/OptimizeTableState";
import { type ChangeEvent, useCallback, useState } from "react";
import { getFormatHandlers } from "@/components/lib/export-helper";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ExportResultButton({
  data,
}: {
  data: OptimizeTableState;
}) {
  const [format, setFormat] = useState<string>("sql");

  //do we want to make them something like this or just string?
  // is we use the as const , where should i move it to?

  const OutputTargetType = {
    File: "file",
    Clipboard: "clipboard",
  } as const;

  type OutputTargetType =
    (typeof OutputTargetType)[keyof typeof OutputTargetType];

  const ExportSelectionType = {
    Complete: "complete",
    Selected: "selected",
  } as const;

  type ExportSelectionType =
    (typeof ExportSelectionType)[keyof typeof ExportSelectionType];

  const [exportSelection, setExportSelection] = useState<ExportSelectionType>(
    ExportSelectionType.Complete
  );

  const [outputTarget, setOutputTarget] = useState<OutputTargetType>(
    OutputTargetType.File
  );

  const [tableName, setTableName] = useState<string>("UnknownTable");

  const [cellTextLimit, setCellTextLimit] = useState<number | undefined>(50);

  const [batchSize, setBatchSize] = useState<number | undefined>(1);

  const onExportClicked = useCallback(() => {
    if (!format) return;

    const headers = data.getHeaders().map((header) => header.name);
    const records = (
      exportSelection === ExportSelectionType.Complete
        ? data.getAllRows()
        : data.getSelectedRows()
    ) // i need more instruction on how to do this getSelectedRows
      .map((row) => headers.map((header) => row.raw[header]));

    const exportTableName = tableName.trim() || "UnknownTable";
    const formatHandlers = getFormatHandlers(
      records,
      headers,
      exportTableName,
      cellTextLimit ?? 50,
      batchSize ?? 1
    );

    const handler = formatHandlers[format];
    if (!handler) return;

    const content = handler();

    //should we move this to a seperate function by now?
    if (outputTarget === OutputTargetType.File) {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      navigator.clipboard
        .writeText(content)
        .then(() => toast.success("Content copied to clipboard"))
        .catch((err) => {
          toast.error("Failed to copy content to clipboard");
          console.error("Failed to copy content: ", err);
        });
    }
  }, [
    format,
    data,
    exportSelection,
    ExportSelectionType.Complete,
    tableName,
    cellTextLimit,
    batchSize,
    outputTarget,
    OutputTargetType.File,
  ]);

  const handleCellTextLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setCellTextLimit(undefined);
      return;
    }

    const parsedValue = Number.parseInt(value, 10);
    setCellTextLimit(Number.isNaN(parsedValue) ? undefined : parsedValue);
  };

  const handleBatchSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setBatchSize(undefined);
      return;
    }

    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isNaN(parsedValue) && parsedValue > 0) {
      setBatchSize(parsedValue);
    }
  };

  return (
    <Dialog open>
      <DialogTrigger>
        <div className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Export
        </div>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogTitle className="p-4">Export</DialogTitle>

        <div className="flex flex-col gap-4">
          <div className="px-4 flex flex-col gap-4">
            <Label>Output Format</Label>
            <Select onValueChange={setFormat} value={format}>
              <SelectTrigger>
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectSeparator />
                <SelectItem value="markdown">Markdown Table</SelectItem>
                <SelectItem value="ascii">Ascii Table</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <div
                className={cn(
                  buttonVariants({
                    variant:
                      exportSelection === ExportSelectionType.Complete
                        ? "default"
                        : "outline",
                  }),
                  "h-auto items-start cursor-pointer"
                )}
                onClick={() => setExportSelection(ExportSelectionType.Complete)}
              >
                <div>
                  <div>Complete</div>
                  <div className="text-xs">{data.getAllRows().length} rows</div>
                </div>
              </div>

              <div
                className={cn(
                  buttonVariants({
                    variant:
                      exportSelection === ExportSelectionType.Selected
                        ? "default"
                        : "outline",
                  }),
                  "h-auto items-start cursor-pointer"
                )}
                onClick={() => setExportSelection(ExportSelectionType.Selected)}
              >
                <div>
                  <div>Selected</div>
                  <div className="text-xs">
                    {data.getSelectedRows().length} rows
                  </div>
                </div>
              </div>
            </div>
          </div>

          {format === "sql" && (
            <div className="px-4 flex flex-col gap-2 border-t pt-3">
              <Label>Additional Parameters</Label>

              <div className="flex gap-2 mt-2">
                <div className="flex flex-col gap-1 flex-grow">
                  <span className="text-xs">Table Name</span>
                  <Input
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="UnknownTable"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs">Batch Size</span>
                  <Input
                    type="number"
                    value={batchSize ?? ""}
                    onChange={handleBatchSizeChange}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          )}

          {format === "markdown" && (
            <div className="px-4 flex flex-col gap-2 border-t pt-3">
              <Label>Additional Parameters</Label>

              <div className="flex gap-2 mt-2">
                <div className="flex flex-col gap-1 flex-grow">
                  <span className="text-xs">Cell Text Limit</span>
                  <Input
                    type="number"
                    placeholder="50"
                    value={cellTextLimit ?? ""}
                    onChange={handleCellTextLimitChange}
                  />
                </div>
              </div>
            </div>
          )}

          {format === "ascii" && (
            <div className="px-4 flex flex-col gap-2 border-t pt-3">
              <Label>Additional Parameters</Label>

              <div className="flex gap-2 mt-2">
                <div className="flex flex-col gap-1 flex-grow">
                  <span className="text-xs">Cell Text Limit</span>
                  <Input
                    type="number"
                    placeholder="50"
                    value={cellTextLimit ?? ""}
                    onChange={handleCellTextLimitChange}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="px-4 flex flex-col gap-4 border-t pt-3">
            <Label>Output Target</Label>
            <div className="flex gap-2">
              <Button
                variant={
                  outputTarget === OutputTargetType.File ? "default" : "outline"
                }
                onClick={() => setOutputTarget(OutputTargetType.File)}
              >
                File
              </Button>
              <Button
                variant={
                  outputTarget === OutputTargetType.Clipboard
                    ? "default"
                    : "outline"
                }
                onClick={() => setOutputTarget(OutputTargetType.Clipboard)}
              >
                Clipboard
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <Button onClick={onExportClicked}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
