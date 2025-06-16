'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import AnalysisResults from './components/AnalysisResults';

export default function AnalysisPage() {
  const [userName, setUserName] = useState<string>('User');
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations'>('analysis');
  const router = useRouter();

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
            <AnalysisResults activeTab={activeTab} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 