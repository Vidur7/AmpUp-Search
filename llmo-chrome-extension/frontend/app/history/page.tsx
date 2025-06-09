'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface Analysis {
  url: string;
  overall_score: number;
  timestamp: string;
  id: string;
}

export default function History() {
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

    const fetchAnalyses = async () => {
      try {
        if (!checkAuth()) return;

        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        // Fetch all analyses
        const analysesResponse = await fetch(`${API_BASE_URL}/user/analyses?limit=100`, {
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
        // Sort by date (newest first)
        const sortedData = [...analysesData].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAnalyses(sortedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching analyses data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analyses data. Please try again later.');
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [router]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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

    if (analyses.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No History Yet</h2>
          <p className="text-gray-600 mb-6">You haven&apos;t analyzed any content yet.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Start Your First Analysis
          </button>
        </div>
      );
    }

    // Group analyses by month
    const groupedAnalyses: { [key: string]: Analysis[] } = {};
    analyses.forEach(analysis => {
      const date = new Date(analysis.timestamp);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!groupedAnalyses[monthYear]) {
        groupedAnalyses[monthYear] = [];
      }
      
      groupedAnalyses[monthYear].push(analysis);
    });

    return (
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {Object.entries(groupedAnalyses).map(([monthYear, monthAnalyses]) => (
          <div key={monthYear} className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{monthYear}</h2>
            <div className="space-y-4">
              {monthAnalyses.map(analysis => (
                <div 
                  key={analysis.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => router.push(`/analysis?id=${analysis.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        analysis.overall_score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                        analysis.overall_score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                    >
                      {Math.round(analysis.overall_score)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{new URL(analysis.url).hostname}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(analysis.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View Report →
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout userName={userName}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">History</h1>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
} 