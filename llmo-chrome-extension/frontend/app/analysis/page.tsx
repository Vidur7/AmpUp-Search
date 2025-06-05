import { Suspense } from 'react';
import AnalysisResults from './components/AnalysisResults';
import LoadingAnalysis from './components/LoadingAnalysis';

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Detailed Analysis Results
        </h1>
        <Suspense fallback={<LoadingAnalysis />}>
          <AnalysisResults />
        </Suspense>
      </div>
    </main>
  );
} 