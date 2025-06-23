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
  const [showLinkExtension, setShowLinkExtension] = useState(false);
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

  const linkChromeExtension = async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        setError('Chrome extension not detected. Please install the AmpUp extension first.');
        return;
      }

      const result = await chrome.storage.local.get(['anonId']);
      if (!result.anonId) {
        setError('Chrome extension anonymous ID not found. Please use the extension first.');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/link-extension`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extension_anonymous_id: result.anonId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to link extension');
      }

      await response.json();
      
      // Update user data in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.anonymous_id = result.anonId;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      setShowLinkExtension(false);
      setError(null);
      
      // Refresh the dashboard data
      window.location.reload();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to link Chrome extension');
    }
  };

  const createTestData = async () => {
    try {
      const token = localStorage.getItem('token');
      const sampleUrls = [
        'https://example.com',
        'https://google.com', 
        'https://github.com',
        'https://stackoverflow.com',
        'https://youtube.com'
      ];
      
      for (const url of sampleUrls) {
        // Get or create anonymous ID like the extension does
        const userStr = localStorage.getItem('user');
        let anonId = 'test-user-123';
        if (userStr) {
          const userData = JSON.parse(userStr);
          anonId = userData.anonymous_id || 'test-user-123';
        }
        
        await fetch(`${API_BASE_URL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url: url,
            anonymous_id: anonId,
            include_content: true
          })
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Refresh the data
      window.location.reload();
    } catch (error) {
      console.error('Error creating test data:', error);
    }
  };



  // Check if Chrome extension is available and has different anonymous_id
  useEffect(() => {
    const checkExtensionLink = async () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          const result = await chrome.storage.local.get(['anonId']);
          const userStr = localStorage.getItem('user');
          
          if (result.anonId && userStr) {
            const userData = JSON.parse(userStr);
            console.log('Extension anon ID:', result.anonId);
            console.log('User account anon ID:', userData.anonymous_id);
            
            // Show link button if extension has different anonymous_id
            if (userData.anonymous_id !== result.anonId) {
              console.log('Anonymous IDs do not match, showing link button');
              setShowLinkExtension(true);
            } else {
              console.log('Anonymous IDs match, extension is already linked');
            }
          }
        } catch (error) {
          console.error('Error checking extension link:', error);
        }
      } else {
        console.log('Chrome extension not available');
      }
    };
    
    checkExtensionLink();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
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
            className="mt-4 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {showLinkExtension && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">Link Chrome Extension</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>We detected you have the AmpUp Chrome extension installed. Link it to see your analysis history here.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={linkChromeExtension}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Link Chrome Extension
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UsageStatsCard analyses={analyses} />
          <RecentScores analyses={analyses} />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout userName={userName}>
      <div>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold !text-transparent !bg-clip-text !bg-gradient-to-r !from-indigo-500 !to-purple-600">Dashboard</h1>
            {analyses.length === 0 && (
              <button
                onClick={createTestData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                Create Test Data
              </button>
            )}
          </div>
          <p className="text-gray-600">
            Welcome back, {userName}! {analyses.length > 0 
              ? `You've analyzed ${analyses.length} website${analyses.length !== 1 ? 's' : ''} so far.`
              : 'Ready to start analyzing websites with AmpUp?'
            }
          </p>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
} 