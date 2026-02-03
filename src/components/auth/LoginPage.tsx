import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Illustration Side */}
        <div className="hidden lg:block relative bg-blue-600 p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-90" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-6">
              Welcome to Eurekka Admin
            </h2>
            <p className="text-blue-100 mb-12">
              Manage your courses, books, and content all in one place.
            </p>
            <img
              src="https://raw.githubusercontent.com/undraw/undraw/master/illustrations/svg_animations/secure_login.svg"
              alt="Login Illustration"
              className="w-full max-w-md mx-auto"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <p className="text-sm text-blue-100 text-center">
              © 2025 Eurekka. All rights reserved.
            </p>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8 lg:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h3>
              <p className="text-gray-600">Use your Auth0 credentials to access the admin panel</p>
            </div>

            <button
              onClick={() => loginWithRedirect()}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign in with Auth0
                </>
              )}
            </button>

            <div className="mt-8 text-center text-sm text-gray-600 lg:hidden">
              © 2025 Eurekka. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}