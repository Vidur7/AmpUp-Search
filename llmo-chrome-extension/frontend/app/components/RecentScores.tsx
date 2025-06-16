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
  const recentAnalyses = analyses.slice(0, 5);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scores</h2>
      {recentAnalyses.length > 0 ? (
        <div className="space-y-4">
          {recentAnalyses.map((analysis) => (
            <div 
              key={analysis.id} 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              onClick={() => router.push(`/analysis?id=${analysis.id}`)}
            >
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {new URL(analysis.url).hostname}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                  analysis.overall_score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  analysis.overall_score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
              >
                {Math.round(analysis.overall_score)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No analyses yet</p>
        </div>
      )}
      {recentAnalyses.length > 0 && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => router.push('/analyses')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View All Analyses →
          </button>
        </div>
      )}
    </div>
  );
} 