import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PriceHistory } from '../services/api';

interface PriceChartProps {
  data: PriceHistory[];
  targetPrice?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, targetPrice }) => {
  // Sort data by timestamp and format for chart
  const chartData = data
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((item) => ({
      timestamp: new Date(item.timestamp).toLocaleDateString(),
      price: item.price,
      fullDate: new Date(item.timestamp).toLocaleString(),
    }));

  const minPrice = Math.min(...data.map(item => item.price));
  const maxPrice = Math.max(...data.map(item => item.price));
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">{data.fullDate}</p>
          <p className="text-lg font-semibold text-gray-900">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fontSize: 12 }}
            stroke="#666"
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Target price reference line */}
          {targetPrice && (
            <ReferenceLine 
              y={targetPrice} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label={{ value: `Target: $${targetPrice.toFixed(2)}`, position: "top" }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
