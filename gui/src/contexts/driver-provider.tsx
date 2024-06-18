import { SavedQueryDriver } from "@gui/driver";
import type { BaseDriver } from "@gui/drivers/base-driver";
import type { CollaborationDriver } from "@gui/drivers/collaboration-driver";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";

interface DriverListProps {
  databaseDriver: BaseDriver;
  collaborationDriver?: CollaborationDriver;
  savedQueryDriver?: SavedQueryDriver;
}

const DriverContext = createContext<DriverListProps>({
  databaseDriver: {} as unknown as BaseDriver,
});

export function useDatabaseDriver() {
  return useContext(DriverContext);
}

export function DriverProvider({
  children,
  databaseDriver,
  collaborationDriver,
  savedQueryDriver,
}: PropsWithChildren<DriverListProps>) {
  const value = useMemo(() => {
    return { databaseDriver, collaborationDriver, savedQueryDriver };
  }, [databaseDriver, collaborationDriver, savedQueryDriver]);

  return (
    <DriverContext.Provider value={value}>{children}</DriverContext.Provider>
  );
}
