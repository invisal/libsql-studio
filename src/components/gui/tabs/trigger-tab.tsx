import { DatabaseTriggerSchema } from "@/drivers/base-driver";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatabaseDriver } from "@/context/driver-provider";
import SqlEditor from "../sql-editor";
import TableCombobox from "../table-combobox/TableCombobox";
import { noop } from "@/lib/utils";

export default function TriggerTab({
  schemaName,
  name,
}: {
  schemaName: string;
  name: string;
}) {
  const { databaseDriver } = useDatabaseDriver();
  const [trigger, setTrigger] = useState<DatabaseTriggerSchema>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    databaseDriver
      .trigger(schemaName, name)
      .then(setTrigger)
      .catch((e: Error) => {
        setError(e.message);
      });
  }, [databaseDriver, schemaName, name]);

  if (error) {
    return <div className="p-4">{error}</div>;
  }

  return (
    <div className="flex flex-col overflow-hidden w-full h-full">
      <div className="p-4 flex flex-col gap-2">
        <div className="text-xs">Trigger Name</div>
        <Input value={trigger?.name ?? ""} readOnly />

        <div className="flex gap-2">
          <div className="w-[200px]">
            <Select value={trigger?.when ?? "BEFORE"}>
              <SelectTrigger>
                <SelectValue placeholder="When" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEFORE">Before</SelectItem>
                <SelectItem value="AFTER">After</SelectItem>
                <SelectItem value="INSTEAD_OF">Instead Of</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select value={trigger?.operation}>
              <SelectTrigger>
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSERT">Insert</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TableCombobox
            schemaName={schemaName}
            value={trigger?.tableName}
            onChange={noop}
          />
        </div>
      </div>
      <div className="grow overflow-hidden">
        <div className="h-full">
          <SqlEditor
            value={trigger?.statement ?? ""}
            dialect={databaseDriver.getFlags().dialect}
          />
        </div>
      </div>
    </div>
  );
}
