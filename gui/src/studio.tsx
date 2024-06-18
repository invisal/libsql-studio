"use client";
import "./index.css";
import MainScreen from "./components/main-connection";
import { ConfigProvider } from "./contexts/config-provider";
import { DriverProvider } from "./contexts/driver-provider";
import ThemeProvider from "./contexts/theme-provider";
import type { BaseDriver } from "./drivers/base-driver";
import { CollaborationDriver } from "./drivers/collaboration-driver";
import { ReactElement } from "react";
import { StudioExtension } from "./extension";
import { SavedQueryDriver } from "./driver";

interface StudioProps {
  driver: BaseDriver;
  collaboration?: CollaborationDriver;
  savedQuery?: SavedQueryDriver;
  name: string;
  color: string;

  onBack?: () => void;
  sideBarFooterComponent?: ReactElement;

  theme?: "dark" | "light";
  onThemeChange?: (theme: "dark" | "light") => void;

  extensions?: StudioExtension[];
}

export function Studio({
  driver,
  theme,
  onThemeChange,
  collaboration,
  savedQuery,
  name,
  color,
  extensions,
  sideBarFooterComponent,
  onBack,
}: Readonly<StudioProps>) {
  return (
    <ThemeProvider theme={theme ?? "light"} onChange={onThemeChange}>
      <DriverProvider
        databaseDriver={driver}
        collaborationDriver={collaboration}
        savedQueryDriver={savedQuery}
      >
        <ConfigProvider
          extensions={extensions}
          name={name}
          color={color}
          onBack={onBack}
          sideBarFooterComponent={sideBarFooterComponent}
        >
          <MainScreen />
        </ConfigProvider>
      </DriverProvider>
    </ThemeProvider>
  );
}
