"use client";
import "gridstack/dist/gridstack.min.css";
import { GridStack, GridStackNode } from "gridstack";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { LucideBarChart, LucidePieChart } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const WIDGET_ID_PREFIX = "#dashboard-grid-";

function BarChartDemo() {
  const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
  ];

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "#2563eb",
    },
    mobile: {
      label: "Mobile",
      color: "#60a5fa",
    },
  } satisfies ChartConfig;

  return (
    <ResponsiveContainer>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}

function PieChartDemo() {
  return (
    <ResponsiveContainer>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "#2563eb",
          },
          mobile: {
            label: "Mobile",
            color: "#60a5fa",
          },
        }}
      >
        <PieChart>
          <Pie
            data={[
              { name: "New User", value: 30 },
              { name: "Returning", value: 50 },
            ]}
            dataKey="value"
            nameKey={"name"}
          >
            <Cell key="cell-1" fill="#27ae60" />
            <Cell key="cell-2" fill="#95a5a6" />
          </Pie>
        </PieChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
}

function DemoChart({ id }: { id: string }) {
  const [name, setName] = useState("Pageview");
  const [sql, setSql] = useState("SELECT * FROM hello_world;");
  const [chartType, setChartType] = useState("bar");

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="p-2 text-sm flex gap-1">
        <div className="flex-grow items-center font-bold">{name}</div>
        <Sheet modal={false}>
          <SheetTrigger asChild>
            <Button variant={"outline"} size="sm">
              Edit
            </Button>
          </SheetTrigger>
          <SheetContent className="pt-12 flex flex-col gap-8" side="bottom">
            <div className="flex flex-col gap-4">
              <Label>Chart Type</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <Label>SQL</Label>
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.currentTarget.value)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <Label>Chart Type</Label>
              <div className="flex gap-2">
                <div
                  onClick={() => setChartType("bar")}
                  className={cn(
                    "p-4 border-4 rounded-lg cursor",
                    chartType === "bar" ? "border-black" : ""
                  )}
                >
                  <LucideBarChart className="w-8 h-8" />
                </div>
                <div
                  onClick={() => setChartType("pie")}
                  className={cn(
                    "p-4 border-4 rounded-lg cursor",
                    chartType === "pie" ? "border-black" : ""
                  )}
                >
                  <LucidePieChart className="w-8 h-8" />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Button
          variant={"outline"}
          size="sm"
          onClick={() => {
            GridStack.init().removeWidget(WIDGET_ID_PREFIX + id);
          }}
        >
          Remove
        </Button>
      </div>
      <div className="grow p-2">
        {chartType === "bar" ? <BarChartDemo /> : <PieChartDemo />}
      </div>
    </div>
  );
}

export default function TestingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridStack | null>(null);

  const [items, setItems] = useState([
    {
      id: "1",
      content: <DemoChart id="1" />,
      h: 20,
      w: 5,
      x: 0,
      y: 0,
    },
  ]);

  const onChartAdd = useCallback(() => {
    if (gridRef.current) {
      const widgetId = window.crypto.randomUUID();

      setItems((prev) => {
        const y = Math.max(...prev.map((t) => (t.y ?? 0) + t.h));

        return [
          ...prev,
          {
            id: widgetId,
            content: <DemoChart id={widgetId} />,
            w: 12,
            h: 30,
            x: 0,
            y,
          },
        ];
      });

      setTimeout(() => {
        if (gridRef.current) {
          gridRef.current.makeWidget("#dashboard-grid-" + widgetId);
        }
      }, 10);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current && !gridRef.current) {
      gridRef.current = GridStack.init({
        float: false,
        column: 12,
        cellHeight: 10,
        cellHeightUnit: "px",
      });

      gridRef.current.on(
        "change",
        function (event: Event, nodes: GridStackNode[]) {
          for (const node of nodes) {
            const found = items.find((x) => x.id === node.id);
            if (found) {
              found.x = node.x ?? found.x;
              found.y = node.y ?? found.x;
              found.h = node.h ?? found.x;
              found.w = node.w ?? found.x;
            }
          }
        }
      );
    }
  }, [containerRef, items]);

  return (
    <div>
      <div className="p-4">
        <Button onClick={onChartAdd}>Add Chart</Button>
      </div>
      <div ref={containerRef} className="grid-stack bg-gray-100 min-h-screen">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              id={"dashboard-grid-" + item.id}
              className="grid-stack-item p-0.5"
              gs-id={item.id}
              gs-w={item.w}
              gs-h={item.h}
              gs-x={item.x}
              gs-y={item.y}
            >
              <div className="grid-stack-item-content border bg-white">
                {item.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
