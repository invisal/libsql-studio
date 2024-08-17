"use client";

import MyStudio from "@/components/my-studio";
import { IframeMySQLDriver } from "@/drivers/iframe-driver";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function EmbedPageClient() {
  const searchParams = useSearchParams();
  const driver = useMemo(() => new IframeMySQLDriver(), []);

  useEffect(() => {
    return driver.listen();
  }, [driver]);

  return (
    <MyStudio
      driver={driver}
      color={searchParams.get("color") || "gray"}
      name={searchParams.get("name") || "Unnamed Connection"}
    />
  );
}
