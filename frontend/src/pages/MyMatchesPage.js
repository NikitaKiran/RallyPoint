import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MyMatches from '../components/MyMatches';

const MyMatchesPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Matches</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View all your scheduled and completed matches across tournaments
          </p>
        </div>

        <MyMatches />
      </div>
    </div>
  );
};

export default MyMatchesPage;
