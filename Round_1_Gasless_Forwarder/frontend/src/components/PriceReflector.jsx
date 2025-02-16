import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const PriceReflector = () => {
  const [isEth, setIsEth] = useState(true);
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coinId = isEth ? 'ethereum' : 'matic-network';
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30`
        );
        const data = await response.json();
        
        const formattedData = data.prices.map(([timestamp, price]) => ({
          date: format(new Date(timestamp), 'MM/dd'),
          price: price.toFixed(2),
        }));
        
        setPriceData(formattedData);
        setCurrentPrice(data.prices[data.prices.length - 1][1].toFixed(2));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [isEth]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isEth ? 'Ethereum (ETH)' : 'Polygon (MATIC)'} Price
        </h1>
        <button
          onClick={() => setIsEth(!isEth)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
        >
          Switch to {isEth ? 'MATIC' : 'ETH'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-300">Loading chart...</div>
      ) : (
        <>
          <div className="mb-4">
            <span className="text-3xl font-bold text-white">
              ${currentPrice}
            </span>
            <span className="ml-2 text-gray-400">USD</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default PriceReflector;