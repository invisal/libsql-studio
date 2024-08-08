import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDatabaseDriver } from "@/context/driver-provider";
import { ApiRole } from "@/lib/api/api-database-response";
import { LucidePencil, LucideTrash } from "lucide-react";
import { useEffect, useState } from "react";

export default function RolesTab() {
  const { collaborationDriver } = useDatabaseDriver();
  const [roleList, setRoleList] = useState<ApiRole[]>([]);

  useEffect(() => {
    if (collaborationDriver) {
      collaborationDriver.getRoles().then(setRoleList).catch(console.error);
    }
  }, [collaborationDriver]);

  return (
    <div className="py-4 px-8">
      <h1 className="font-bold">Manage Roles</h1>

      <div className="mt-8 rounded border max-w-[600px]">
        <div className="flex p-3 items-center gap-2 border-b bg-secondary">
          <div className="grow">
            <Input placeholder="New Role Name" className="bg-background" />
          </div>
          <div className="w-[100px]">
            <Button className="w-full">Create</Button>
          </div>
        </div>

        {roleList.map((role) => {
          return (
            <div key={role.id} className="flex p-3 items-center gap-2 border-b">
              <div className="grow flex flex-col text-sm">
                <div className="font-bold">{role.name}</div>
              </div>
              <div>
                <Button size="icon" variant="outline">
                  <LucidePencil className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Button size="icon" variant="destructive">
                  <LucideTrash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
