import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueChartProps {
  data: {
    label: string;
    revenue: number;
    profit: number;
  }[];
}

const formatRupiah = (value: number) => {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)} M`;
  }
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)} Jt`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data untuk periode ini.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="label" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={formatRupiah}
            width={80}
          />
          <Tooltip 
            cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            formatter={(value: any, name: any) => [
              `Rp ${Number(value).toLocaleString("id-ID")}`,
              name === "revenue" ? "Omset" : "Laba Bersih"
            ]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="revenue" name="Omset" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
          <Bar dataKey="profit" name="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
