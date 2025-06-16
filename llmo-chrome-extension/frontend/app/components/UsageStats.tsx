import { useState, useEffect } from 'react';

interface Analysis {
  url: string;
  overall_score: number;
  timestamp: string;
  id: string;
}

interface UsageStatsProps {
  analyses: Analysis[];
}

export default function UsageStatsCard({ analyses }: UsageStatsProps) {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
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
  
  const totalAnalyses = analyses.length;
  const maxAnalyses = 100; // Increased limit for beta testing
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Total Analyses</span>
            <span className="text-sm font-medium text-gray-700">
              {totalAnalyses}/{maxAnalyses}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (totalAnalyses / maxAnalyses) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-indigo-800">Beta Testing Program</h3>
                <div className="mt-2 text-sm text-indigo-700">
                  <p>You&apos;re part of our exclusive beta testing program. Enjoy unlimited access to all features during this period.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 