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
  }, [analyses]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">Usage Statistics</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  // Calculate live statistics
  const totalAnalyses = analyses.length;
  const maxAnalyses = 100; // Beta testing limit
  
  // Calculate this week's analyses
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekAnalyses = analyses.filter(analysis => 
    new Date(analysis.timestamp) >= oneWeekAgo
  ).length;
  
  // Calculate average score
  const averageScore = analyses.length > 0 
    ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.overall_score, 0) / analyses.length)
    : 0;
  
  // Calculate score trend (compare last 5 vs previous 5)
  const recent5 = analyses.slice(0, 5);
  const previous5 = analyses.slice(5, 10);
  
  let scoreTrend = null;
  if (recent5.length > 0 && previous5.length > 0) {
    const recentAvg = recent5.reduce((sum, a) => sum + a.overall_score, 0) / recent5.length;
    const previousAvg = previous5.reduce((sum, a) => sum + a.overall_score, 0) / previous5.length;
    scoreTrend = recentAvg - previousAvg;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">Usage Statistics</h2>
      
      <div className="space-y-6">
        {/* Total Analyses Progress */}
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

        {/* Statistics Grid */}
        {totalAnalyses > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{thisWeekAnalyses}</div>
              <div className="text-xs text-gray-600">This Week</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-900">{averageScore}</div>
                {scoreTrend !== null && (
                  <div className={`ml-2 text-xs ${scoreTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreTrend >= 0 ? '↗' : '↘'} {Math.abs(Math.round(scoreTrend))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600">Avg Score</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-2">No analyses yet</p>
            <p className="text-gray-400 text-xs">Install the Chrome extension and analyze your first website!</p>
          </div>
        )}
        
        {/* Beta Program Info */}
        <div className="pt-2 border-t border-gray-100">
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