import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { PriceHistory } from '../services/api';

interface PriceChartProps {
  data: PriceHistory[];
  currentPrice: number;
  productTitle: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  currentPrice, 
  productTitle 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 365
    };

    const cutoffDate = new Date(now.getTime() - periods[selectedPeriod] * 24 * 60 * 60 * 1000);
    
    return data
      .filter(item => new Date(item.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(item => ({
        ...item,
        date: format(parseISO(item.timestamp), 'MMM dd'),
        fullDate: format(parseISO(item.timestamp), 'MMM dd, yyyy HH:mm'),
        price: Number(item.price)
      }));
  }, [data, selectedPeriod]);

  // Calculate price statistics
  const priceStats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const prices = filteredData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const firstPrice = filteredData[0].price;
    const lastPrice = filteredData[filteredData.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return {
      min: minPrice,
      max: maxPrice,
      change,
      changePercent,
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };
  }, [filteredData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 min-w-[200px]">
          <p className="text-sm font-medium text-gray-900 mb-2">{data.fullDate}</p>            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-sm font-semibold text-gray-900">${data.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${
                  data.price === priceStats?.min 
                    ? 'text-green-600' 
                    : data.price === priceStats?.max 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                }`}>
                  {data.price === priceStats?.min 
                    ? 'Lowest Price' 
                    : data.price === priceStats?.max 
                      ? 'Highest Price' 
                      : 'Regular Price'}
                </span>
              </div>
            </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-8">
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 mb-6 inline-block">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No price history yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Price tracking will begin once you add this product to your watchlist. 
            We'll start collecting price data to show you trends over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg shadow-gray-200/20 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
          
          {/* Period selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {period === 'all' ? 'All' : period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Price stats */}
        {priceStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="text-sm text-blue-600 mb-1">Current Price</div>
              <div className="text-lg font-bold text-blue-900">${currentPrice.toFixed(2)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="text-sm text-green-600 mb-1">Lowest</div>
              <div className="text-lg font-bold text-green-900">${priceStats.min.toFixed(2)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
              <div className="text-sm text-red-600 mb-1">Highest</div>
              <div className="text-lg font-bold text-red-900">${priceStats.max.toFixed(2)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Period Change</div>
              <div className={`text-lg font-bold flex items-center ${
                priceStats.change >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {priceStats.change >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {priceStats.changePercent > 0 ? '+' : ''}{priceStats.changePercent.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Target price line - removed */}
              
              {/* Area fill */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="none"
                fill="url(#priceGradient)"
              />
              
              {/* Main line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer with insights */}
      {priceStats && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-2">💡 Price Insights</div>
            <div className="space-y-1 text-sm">
              <div>
                Average price over {selectedPeriod === 'all' ? 'all time' : selectedPeriod}: 
                <span className="font-semibold text-gray-900 ml-1">${priceStats.average.toFixed(2)}</span>
              </div>
              <div>
                Current price is {currentPrice > priceStats.average ? 'above' : 'below'} average by 
                <span className={`font-semibold ml-1 ${
                  currentPrice > priceStats.average ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${Math.abs(currentPrice - priceStats.average).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
