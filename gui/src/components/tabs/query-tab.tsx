import { useRef, useState } from "react";
import { identify } from "sql-query-identifier";
import { LucidePlay, LucideSave } from "lucide-react";
import SqlEditor from "@gui/components/sql-editor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@gui/components/ui/resizable";
import { Separator } from "@gui/components/ui/separator";
import { Button } from "@gui/components/ui/button";
import ResultTable from "@gui/components/query-result-table";
import { KEY_BINDING } from "@gui/lib/key-matcher";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { selectStatementFromPosition } from "@gui/sqlite/sql-helper";
import QueryProgressLog from "../query-progress-log";
import { useAutoComplete } from "@gui/contexts/auto-complete-provider";
import { useDatabaseDriver } from "@gui/contexts/driver-provider";
import OptimizeTableState from "../table-optimized/OptimizeTableState";
import { MultipleQueryProgress, multipleQuery } from "@gui/lib/multiple-query";
import { DatabaseResultStat } from "@gui/driver";
import ResultStats from "../result-stat";
import isEmptyResultStats from "@gui/lib/empty-stats";
import { Toolbar, ToolbarButton } from "../toolbar";

export default function QueryWindow() {
  const { schema } = useAutoComplete();
  const { databaseDriver } = useDatabaseDriver();
  const [code, setCode] = useState("");
  const [data, setData] = useState<OptimizeTableState>();
  const [stats, setStats] = useState<DatabaseResultStat>();
  const [progress, setProgress] = useState<MultipleQueryProgress>();
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [lineNumber, setLineNumber] = useState(0);
  const [columnNumber, setColumnNumber] = useState(0);

  const onRunClicked = (all = false) => {
    const statements = identify(code, {
      dialect: "sqlite",
      strict: false,
    });

    let finalStatements: string[] = [];

    const editor = editorRef.current;

    if (all) {
      finalStatements = statements.map((s) => s.text);
    } else if (editor?.view) {
      const position = editor.view.state.selection.main.head;
      const statement = selectStatementFromPosition(statements, position);

      if (statement) {
        finalStatements = [statement.text];
      }
    }

    if (finalStatements.length > 0) {
      // Reset the result and make a new query
      setData(undefined);
      setProgress(undefined);

      multipleQuery(databaseDriver, finalStatements, (currentProgrss) => {
        setProgress(currentProgrss);
      })
        .then(({ last }) => {
          if (last) {
            const state = OptimizeTableState.createFromResult(last);
            state.setReadOnlyMode(true);
            setData(state);
            setStats(last.stat);
          }
        })
        .catch(console.error);
    }
  };

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel style={{ position: "relative" }}>
        <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col">
          <div className="grow overflow-hidden">
            <SqlEditor
              ref={editorRef}
              value={code}
              onChange={setCode}
              schema={schema}
              onCursorChange={(_, line, col) => {
                setLineNumber(line);
                setColumnNumber(col);
              }}
              onKeyDown={(e) => {
                if (KEY_BINDING.run.match(e)) {
                  onRunClicked();
                  e.preventDefault();
                }
              }}
            />
          </div>
          <div className="grow-0 shrink-0">
            <Separator />
            <Toolbar>
              <ToolbarButton primary icon={LucideSave} text="Save" />

              <ToolbarButton
                onClick={() => onRunClicked()}
                icon={LucidePlay}
                text="Run Current"
                shortcut={KEY_BINDING.run.toString()}
              />

              <ToolbarButton
                onClick={() => onRunClicked(true)}
                icon={LucidePlay}
                text="Run All"
              />

              <div className="grow justify-end items-center flex text-sm mr-2 gap-2">
                <div>Ln {lineNumber}</div>
                <div>Col {columnNumber + 1}</div>
              </div>
            </Toolbar>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} style={{ position: "relative" }}>
        {data && (
          <div className="flex flex-col h-full w-full">
            <div className="grow overflow-hidden">
              <ResultTable data={data} />
            </div>
            {stats && !isEmptyResultStats(stats) && (
              <div className="shrink-0">
                <Separator />
                <ResultStats stats={stats} />
              </div>
            )}
          </div>
        )}
        {!data && progress && (
          <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            <QueryProgressLog progress={progress} />
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
