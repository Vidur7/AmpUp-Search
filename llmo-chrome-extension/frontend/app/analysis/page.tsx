'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import AnalysisResults from './components/AnalysisResults';

export default function AnalysisPage() {
  const [userName, setUserName] = useState<string>('User');
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations'>('analysis');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');
  const encodedData = searchParams.get('data');
  
  console.log('AnalysisPage - URL analysisId:', analysisId);
  console.log('AnalysisPage - URL has encoded data:', !!encodedData);

  useEffect(() => {
    // Handle direct data passed in URL
    if (encodedData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        console.log('AnalysisPage - Decoded data from URL:', decodedData);
        setAnalysisData(decodedData);
        setLoading(false);
        return; // Skip the redirect if we have data
      } catch (error) {
        console.error('Error parsing encoded analysis data:', error);
        setError('Could not parse analysis data from URL. The data might be corrupted or too large.');
        setLoading(false);
      }
    }

    // Fall back to ID-based approach
    if (analysisId) {
      // We have an ID, so we'll let the AnalysisResults component handle the API call
      setLoading(false);
    } else {
      console.warn('No analysis ID or data found in URL, redirecting to analyses page');
      setError('No analysis data available');
      setLoading(false);
      // Uncomment to redirect automatically:
      // router.push('/analyses');
    }
  }, [analysisId, encodedData, router]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        return;
      }
      
      try {
        const userData = JSON.parse(userStr);
        if (userData.name) {
          setUserName(userData.name);
        } else if (userData.email) {
          setUserName(userData.email.split('@')[0]);
        }
      } catch (e) {
        console.error('Invalid user data in localStorage:', e);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <DashboardLayout userName={userName}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !analysisId && !analysisData) {
    return (
      <DashboardLayout userName={userName}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.push('/analyses')}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
          >
            Return to Analyses
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={userName}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Detailed Analysis</h1>
          <button 
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'analysis'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analysis Results
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'recommendations'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recommendations
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            <AnalysisResults 
              activeTab={activeTab} 
              analysisId={analysisId || undefined} 
              directData={analysisData} 
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 