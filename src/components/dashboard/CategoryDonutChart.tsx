"use client";

import { CategorySpendSummary } from "@/types/financial";
import { formatINR } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  Rent: "#0d9488",           // Glacier Teal
  Housing: "#0d9488",        // Alias
  Food: "#f59e0b",           // Amber
  Groceries: "#10b981",      // Emerald
  Transport: "#06b6d4",      // Cyan
  Transportation: "#06b6d4", // Alias
  Bills: "#38bdf8",          // Sky Blue
  Utilities: "#38bdf8",      // Alias
  Shopping: "#64748b",       // Slate
  Entertainment: "#f43f5e",  // Rose
  Subscriptions: "#ec4899",  // Pink
  Healthcare: "#14b8a6",     // Crisp Teal
  Health: "#14b8a6",         // Alias
  Education: "#3b82f6",      // Blue
  Travel: "#fb923c",         // Orange
  PersonalCare: "#f472b6",   // Warm Pink
  Investment: "#2dd4bf",     // Mint
  Other: "#94a3b8",          // Clean Slate
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomDonutTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const categoryName = item.payload.name || item.name;
    const amount = item.value;
    const percentage = item.payload.percentage;
    const color = item.payload.color || "#0d9488";

    return (
      <div className="bg-[#0B0F14] border border-[#243041] px-4 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="text-xs font-semibold text-slate-200">
            {categoryName}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black text-white font-mono">
            {formatINR(amount)}
          </span>
          {percentage !== undefined && (
            <span className="text-xs font-bold text-slate-400 font-mono">
              ({percentage}%)
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function CategoryDonutChart({ data }: { data: CategorySpendSummary[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex items-center justify-center h-72 text-xs text-slate-400">
        No expenses recorded in this cycle yet.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    color: CATEGORY_COLORS[item.category] || "#94a3b8",
  }));

  return (
    <div className="bg-[#131922] backdrop-blur-xl p-6 rounded-3xl border border-[#243041] shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">
            Category Spending Breakdown
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Top expenditure drivers in active cycle
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="sm:col-span-5 h-52 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="#070a11"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="sm:col-span-7 space-y-2.5">
          {data.slice(0, 5).map((item) => {
            const color = CATEGORY_COLORS[item.category] || "#94a3b8";
            return (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  />
                  <span className="font-semibold text-slate-200">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white font-mono">{formatINR(item.amount)}</span>
                  <span className="text-slate-300 font-bold font-mono text-xs w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
