'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

// Chrome extension types
declare global {
  interface Window {
    chrome?: {
      storage: {
        local: {
          get: (keys: string[]) => Promise<{[key: string]: any}>;
          set: (items: {[key: string]: any}) => Promise<void>;
        };
      };
    };
  }
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anonymousId, setAnonymousId] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Generate a random anonymous ID if not in extension
    const getAnonymousId = async () => {
      try {
        // PRIORITY 1: Check if we're in Chrome extension environment
        if (typeof window !== 'undefined' && window.chrome?.storage) {
          try {
            const result = await window.chrome.storage.local.get(['anonId']);
            if (result.anonId) {
              console.log('Using Chrome extension anonymous_id:', result.anonId);
              setAnonymousId(result.anonId);
              return;
            }
                     } catch {
             console.log('Not in extension context or no stored ID');
           }
        }
        
        // PRIORITY 2: Check localStorage for existing web anonymous_id
        const storedId = localStorage.getItem('web_anonymous_id');
        if (storedId) {
          console.log('Using stored web anonymous_id:', storedId);
          setAnonymousId(storedId);
          return;
        }
        
        // PRIORITY 3: Generate new web anonymous_id and store it
        const newId = uuidv4();
        localStorage.setItem('web_anonymous_id', newId);
        console.log('Generated new web anonymous_id:', newId);
        setAnonymousId(newId);
        
      } catch (err) {
        console.error('Error getting anonymous ID:', err);
        const fallbackId = uuidv4();
        setAnonymousId(fallbackId);
      }
    };

    getAnonymousId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!anonymousId) {
      setError('Anonymous ID not generated. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Signup request
      const signupData = {
        email,
        password,
        anonymous_id: anonymousId,
        is_premium: false,
      };

      const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
        credentials: 'include',
      });

      if (!signupResponse.ok) {
        const data = await signupResponse.json().catch(() => ({}));
        const errorMessage = data.detail || data.message || data.error || `HTTP ${signupResponse.status}: Failed to create account`;
        throw new Error(errorMessage);
      }

      const signupResult = await signupResponse.json();
      
      // Signup now returns JWT token directly! Store it immediately
      console.log('Signup successful with JWT token received');
      localStorage.setItem('token', signupResult.access_token);
      localStorage.setItem('user', JSON.stringify(signupResult.user));
      
      // Update extension's anonymous_id if the backend assigned a different one
      if (signupResult.user && signupResult.user.anonymous_id !== anonymousId) {
        console.log(`Backend assigned different anonymous_id: ${signupResult.user.anonymous_id}, updating extension`);
        if (typeof window !== 'undefined' && window.chrome?.storage) {
          try {
            await window.chrome.storage.local.set({ anonId: signupResult.user.anonymous_id });
            console.log('Extension anonymous_id updated successfully');
          } catch (error) {
            console.warn('Could not update extension anonymous_id:', error);
          }
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            AmpUp
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignUp}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 