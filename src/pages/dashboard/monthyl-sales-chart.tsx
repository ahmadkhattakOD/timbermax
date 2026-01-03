import React from 'react';
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
  ReferenceLine
} from 'recharts';

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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              margin: '5px 0', 
              color: entry.color 
            }}>
              {entry.name}: {entry.name === 'Sales' ? `$${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="invoices"
          name="Invoices"
          fill="#8884d8"
          barSize={20}
        />
        <Bar
          yAxisId="left"
          dataKey="quotations"
          name="Quotations"
          fill="#82ca9d"
          barSize={20}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sales"
          name="Sales ($)"
          stroke="#ff7300"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <ReferenceLine
          yAxisId="right"
          y={data.reduce((sum, month) => sum + month.sales, 0) / data.length}
          stroke="red"
          strokeDasharray="3 3"
          label={{
            value: 'Avg. Sales',
            position: 'insideTopRight',
            fill: 'red'
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default MonthlySalesChart;