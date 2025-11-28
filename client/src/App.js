import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import HomePage from './HomePage';
import Signup from './Signup';
import Navbar from './Navbar';
import CodeEditor from './CodeEditor';
import Training from './Training';
import GamePage from './GamePage'; // Import GamePage
import RankRating from './RankRating';
import QuestionsPage from './QuestionsPage';
import Coding from './1v1';
import Subject from './subject';
import QuestionDetail from './QuestionDetails';
import Chatbox from './Chatbox';
import ProtectedRoute from './ProtectedRoute';
import { refreshCsrfToken } from './api';

const App = () => {
  // Fetch CSRF token on app initialization
  useEffect(() => {
    // Fetch CSRF token when app loads
    refreshCsrfToken().catch(error => {
      console.warn('Failed to fetch CSRF token on app load:', error);
      // Non-critical error, app can still function
    });
  }, []);

  return (
    <Router>
      <Navbar /> {/* Navbar is outside of Routes so it stays on all pages */}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Protected Routes - require authentication */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
          <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
          <Route path="/playground" element={<ProtectedRoute><CodeEditor /></ProtectedRoute>} />
          <Route path="/coding" element={<ProtectedRoute><Coding /></ProtectedRoute>} />
          <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
          <Route path="/subject" element={<ProtectedRoute><Subject /></ProtectedRoute>} /> 
          <Route path="/details/:id" element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chatbox /></ProtectedRoute>} /> 
          <Route path="/rank-rating" element={<ProtectedRoute><RankRating /></ProtectedRoute>} />
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
