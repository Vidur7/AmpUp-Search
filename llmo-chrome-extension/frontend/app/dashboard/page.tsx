'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface Analysis {
  url: string;
  overall_score: number;
  timestamp: string;
  id: string;
}

interface UsageStats {
  analysis_count: number;
  full_views_used: number;
  is_premium: boolean;
}

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        console.log('No token or user found, redirecting to signin');
        router.push('/auth/signin');
        return false;
      }
      
      try {
        // Validate user data
        JSON.parse(user);
        return true;
      } catch (e) {
        console.error('Invalid user data in localStorage:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/signin');
        return false;
      }
    };

    const fetchDashboardData = async () => {
      try {
        if (!checkAuth()) return;

        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        console.log('Fetching dashboard data with token:', token);

        // Fetch past analyses
        const analysesResponse = await fetch(`${API_BASE_URL}/user/analyses`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        
        console.log('Analyses response:', {
          status: analysesResponse.status,
          statusText: analysesResponse.statusText,
        });

        if (!analysesResponse.ok) {
          const errorText = await analysesResponse.text();
          console.error('Analyses response error:', {
            status: analysesResponse.status,
            statusText: analysesResponse.statusText,
            error: errorText,
          });

          if (analysesResponse.status === 401) {
            console.log('Unauthorized, clearing tokens and redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth/signin');
            return;
          }
          throw new Error(`Failed to fetch analyses: ${errorText}`);
        }

        const analysesData = await analysesResponse.json();
        console.log('Analyses data:', analysesData);
        setAnalyses(analysesData);

        // Fetch usage stats
        console.log('Fetching usage stats');
        const statsResponse = await fetch(`${API_BASE_URL}/user/usage`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        console.log('Usage stats response:', {
          status: statsResponse.status,
          statusText: statsResponse.statusText,
        });

        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          console.error('Usage stats response error:', {
            status: statsResponse.status,
            statusText: statsResponse.statusText,
            error: errorText,
          });
          throw new Error(`Failed to fetch usage stats: ${errorText}`);
        }

        const statsData = await statsResponse.json();
        console.log('Usage stats data:', statsData);

        setUsageStats(statsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data. Please try again later.');
        setAnalyses([]);
        setUsageStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            View your analysis history and usage statistics
          </p>
        </div>

        {/* Usage Stats */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
          {usageStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Free Analyses Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageStats.analysis_count}/5
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Full Views Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageStats.full_views_used}/2
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageStats.is_premium ? 'Premium' : 'Free'}
                </p>
              </div>
            </div>
          )}
          
          {/* Upgrade CTA */}
          {usageStats && !usageStats.is_premium && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900">Upgrade to Premium</h3>
              <p className="mt-2 text-sm text-gray-600">
                Get unlimited analyses and full access to all features.
              </p>
              <button
                onClick={() => window.open('https://ampup.ai/pricing', '_blank')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>

        {/* Past Analyses */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis History</h2>
          {analyses && analyses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyses.map((analysis) => (
                    <tr key={analysis.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new URL(analysis.url).hostname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          analysis.overall_score >= 80 ? 'bg-green-100 text-green-800' :
                          analysis.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(analysis.overall_score)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => router.push(`/analysis?id=${analysis.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No analyses yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 