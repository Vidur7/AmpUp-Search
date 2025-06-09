'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import RecentScores from '../components/RecentScores';
import UsageStatsCard from '../components/UsageStats';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface Analysis {
  url: string;
  overall_score: number;
  timestamp: string;
  id: string;
}

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        console.log('No token or user found, redirecting to signin');
        router.push('/auth/signin');
        return false;
      }
      
      try {
        // Validate user data
        const userData = JSON.parse(userStr);
        if (userData.name) {
          setUserName(userData.name);
        } else if (userData.email) {
          setUserName(userData.email.split('@')[0]);
        }
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

        // Fetch past analyses
        const analysesResponse = await fetch(`${API_BASE_URL}/user/analyses`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        
        if (!analysesResponse.ok) {
          const errorText = await analysesResponse.text();
          
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
        setAnalyses(analysesData);

        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data. Please try again later.');
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      );
    }

    if (error) {
      return (
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
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <UsageStatsCard />
          <RecentScores />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis History</h2>
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
                          View Full Report
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
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:shadow-lg transition-all"
              >
                Start Your First Analysis
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <DashboardLayout userName={userName}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
} 