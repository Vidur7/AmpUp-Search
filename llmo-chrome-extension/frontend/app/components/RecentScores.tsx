import React from 'react';
import { useRouter } from 'next/navigation';

interface Analysis {
  url: string;
  overall_score: number;
  timestamp: string;
  id: string;
}

interface RecentScoresProps {
  analyses: Analysis[];
}

export default function RecentScores({ analyses }: RecentScoresProps) {
  const router = useRouter();
  
  // Sort by timestamp and get the 5 most recent
  const sortedAnalyses = [...analyses].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const recentAnalyses = sortedAnalyses.slice(0, 5);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };


  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Recent Scans</h2>
        {recentAnalyses.length > 0 && (
          <span className="text-xs text-gray-500">
            Last {recentAnalyses.length} scan{recentAnalyses.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {recentAnalyses.length > 0 ? (
        <div className="space-y-3">
                     {recentAnalyses.map((analysis) => (
            <div 
              key={analysis.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => router.push(`/analysis?id=${analysis.id}`)}
            >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {new URL(analysis.url).hostname}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      analysis.overall_score >= 80 ? 'bg-green-100 text-green-800' :
                      analysis.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getScoreLabel(analysis.overall_score)}
                    </span>
                  </div>
                </div>
              <div className="ml-4 flex-shrink-0">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(analysis.overall_score)}`}
                >
                  {Math.round(analysis.overall_score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-2">No recent scans</p>
          <p className="text-gray-400 text-xs">Your analyzed websites will appear here</p>
        </div>
      )}
      
      {recentAnalyses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button 
            onClick={() => router.push('/analyses')}
            className="text-indigo-600 hover:text-white hover:bg-indigo-600 text-sm font-medium py-2 px-4 border border-indigo-600 rounded-lg transition-all duration-200 cursor-pointer"
          >
            View All {analyses.length} Analyse{analyses.length !== 1 ? 's' : ''} →
          </button>
        </div>
      )}
    </div>
  );
} 