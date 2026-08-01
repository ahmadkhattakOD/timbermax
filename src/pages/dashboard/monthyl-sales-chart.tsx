import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { roundAmount } from "utils/helpers";

interface MonthlySalesData {
  month: string;
  sales: number;
  quotations: number;
  invoices: number;
}

interface MonthlySalesChartProps {
  data: MonthlySalesData[];
}

const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ data }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [chartHeight, setChartHeight] = useState(400);

  // Check for mobile/small screen sizes
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setChartHeight(mobile ? 300 : 400);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: isMobile ? "12px" : "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            maxWidth: isMobile ? "200px" : "300px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: "bold",
              marginBottom: "5px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                margin: "4px 0",
                color: entry.color,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ marginRight: "10px" }}>{entry.name}:</span>
              <span style={{ fontWeight: "600" }}>
                {entry.name === "Sales"
                  ? `$${roundAmount(entry.value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format month names for mobile (shorter labels)
  const formatMonth = (month: string) => {
    if (!isMobile) return month;

    // Shorten month names for mobile
    const monthMap: Record<string, string> = {
      January: "Jan",
      February: "Feb",
      March: "Mar",
      April: "Apr",
      May: "May",
      June: "Jun",
      July: "Jul",
      August: "Aug",
      September: "Sep",
      October: "Oct",
      November: "Nov",
      December: "Dec",
    };

    return monthMap[month] || month.substring(0, 3);
  };

  // Custom tick formatter for Y-axis on mobile
  const formatYAxisTick = (value: number) => {
    if (isMobile) {
      if (value >= 1000) return `${roundAmount(value / 1000)}k`;
      return roundAmount(value).toString();
    }
    return roundAmount(value).toLocaleString();
  };

  return (
    <div
      style={{
        width: "100%",
        height: chartHeight,
        position: "relative",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={
            isMobile
              ? { top: 20, right: 10, left: 0, bottom: 20 }
              : { top: 20, right: 30, left: 20, bottom: 20 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: isMobile ? 11 : 12 }}
            interval={isMobile ? "preserveStartEnd" : 0}
            minTickGap={isMobile ? 5 : 10}
          />

          <YAxis
            yAxisId="left"
            tickFormatter={formatYAxisTick}
            tick={{ fontSize: isMobile ? 11 : 12 }}
            width={isMobile ? 30 : 60}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `$${formatYAxisTick(value)}`}
            tick={{ fontSize: isMobile ? 11 : 12 }}
            width={isMobile ? 40 : 70}
          />

          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{
              zIndex: 1000,
            }}
          />

          <Legend
            verticalAlign="top"
            height={isMobile ? 36 : 50}
            wrapperStyle={{
              fontSize: isMobile ? 11 : 14,
              paddingBottom: "10px",
            }}
            iconSize={isMobile ? 10 : 12}
          />

          <Bar
            yAxisId="left"
            dataKey="invoices"
            name="Invoices"
            fill="#8884d8"
            barSize={isMobile ? 15 : 20}
            radius={[2, 2, 0, 0]}
          />

          <Bar
            yAxisId="left"
            dataKey="quotations"
            name="Quotations"
            fill="#82ca9d"
            barSize={isMobile ? 15 : 20}
            radius={[2, 2, 0, 0]}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sales"
            name="Sales ($)"
            stroke="#ff7300"
            strokeWidth={isMobile ? 1.5 : 2}
            dot={{ r: isMobile ? 2.5 : 4 }}
            activeDot={{ r: isMobile ? 4 : 6 }}
          />

          <ReferenceLine
            yAxisId="right"
            y={data.reduce((sum, month) => sum + month.sales, 0) / data.length}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: "Avg. Sales",
              position: "insideTopRight",
              fill: "red",
              fontSize: isMobile ? 10 : 12,
              offset: isMobile ? 5 : 10,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChart;
