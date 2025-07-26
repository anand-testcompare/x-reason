"use client";

import React, { useState } from 'react';
import { useCredentials } from '../context/CredentialsContext';

export function CredentialsModal() {
  const { needsCredentials, setCredentials, setNeedsCredentials } = useCredentials();
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  if (!needsCredentials) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!openaiKey && !geminiKey) {
      alert('Please provide at least one API key to continue.');
      return;
    }

    setCredentials({
      openaiApiKey: openaiKey || undefined,
      geminiApiKey: geminiKey || undefined,
    });
    
    setNeedsCredentials(false);
  };

  const handleSkip = () => {
    setNeedsCredentials(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">API Credentials Required</h2>
          <p className="text-gray-600 text-sm">
            To use this application, please provide at least one API key. Your keys are stored only in memory and will be cleared when you navigate away.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key (optional)
            </label>
            <input
              id="openai-key"
              type={showKeys ? "text" : "password"}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700 mb-1">
              Google Gemini API Key (optional)
            </label>
            <input
              id="gemini-key"
              type={showKeys ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AI..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="opacity-50">
            <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-400 mb-1">
              Anthropic API Key (coming soon)
            </label>
            <input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center">
            <input
              id="show-keys"
              type="checkbox"
              checked={showKeys}
              onChange={(e) => setShowKeys(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
            />
            <label htmlFor="show-keys" className="ml-2 block text-sm text-gray-700">
              Show API keys
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Security Notice:</strong> Your API keys are only stored in your browser's memory and will be automatically cleared when you leave the page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}