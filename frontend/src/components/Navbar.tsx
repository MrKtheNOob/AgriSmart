import { useEffect, useState } from 'react';
import { BASE_URL } from '../utils';

export default function Navbar() {
  const [testerCount, setTesterCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`${BASE_URL}/telemetry/count`);
        const data = await response.json();
        setTesterCount(data.count);
      } catch (err) {
        console.error('Failed to fetch telemetry count:', err);
      }
    };

    fetchCount();
    // Refresh every minute to stay updated
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800">
              AgriSmart
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                {testerCount} testeurs actifs
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
