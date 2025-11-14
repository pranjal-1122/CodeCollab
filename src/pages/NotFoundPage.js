import React from 'react';
import { Link } from 'react-router-dom'; // Import Link to navigate

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
      <h1 className="text-6xl font-bold text-indigo-400">404</h1>
      <h2 className="text-3xl font-semibold mt-4 mb-2">Page Not Found</h2>
      <p className="text-lg text-gray-300 mb-6">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        to="/" // Link to the homepage
        className="px-6 py-3 bg-indigo-600 rounded-lg text-lg font-medium hover:bg-indigo-500 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;