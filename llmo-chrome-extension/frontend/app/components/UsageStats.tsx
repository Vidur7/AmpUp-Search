import { useState, useEffect } from 'react';

interface UsageStats {
  analysis_count: number;
  full_views_used: number;
  is_premium: boolean;
}

export default function UsageStatsCard() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:8000/api/v1/user/usage', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch usage statistics');
        }
        
        const data = await response.json();
        setUsageStats(data);
      } catch (error) {
        console.error('Error fetching usage statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsageStats();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  if (!usageStats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
        <p className="text-gray-500">Unable to load usage statistics</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Analyses Used</span>
            <span className="text-sm font-medium text-gray-700">
              {usageStats.analysis_count}/5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (usageStats.analysis_count / 5) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Full Views</span>
            <span className="text-sm font-medium text-gray-700">
              {usageStats.full_views_used}/2
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (usageStats.full_views_used / 2) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="pt-2">
          <p className="text-sm text-gray-600">
            Account Type: <span className="font-medium">{usageStats.is_premium ? 'Premium' : 'Free'}</span>
          </p>
        </div>
        
        {!usageStats.is_premium && (
          <button
            onClick={() => window.open('https://ampup.ai/pricing', '_blank')}
            className="w-full mt-2 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-md transition-all"
          >
            Upgrade to Premium
          </button>
        )}
      </div>
    </div>
  );
} 