import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import HomePage from './HomePage';
import Signup from './Signup';
import Layout from './components/Layout';
import CodeEditor from './CodeEditor';
import Training from './Training';
import GamePage from './GamePage';
import RankRating from './RankRating';
import QuestionsPage from './QuestionsPage';
import Coding from './1v1';
import Subject from './subject';
import QuestionDetail from './QuestionDetails';
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
      <Routes>
        {/* Public routes without layout */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes with Layout */}
        <Route path="/home" element={<ProtectedRoute><Layout><HomePage /></Layout></ProtectedRoute>} />
        <Route path="/questions" element={<ProtectedRoute><Layout><QuestionsPage /></Layout></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><Layout><Training /></Layout></ProtectedRoute>} />
        <Route path="/playground" element={<ProtectedRoute><Layout><CodeEditor /></Layout></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute><Layout><CodeEditor /></Layout></ProtectedRoute>} />
        <Route path="/coding" element={<ProtectedRoute><Layout><Coding /></Layout></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><Layout><GamePage /></Layout></ProtectedRoute>} />
        <Route path="/subject" element={<ProtectedRoute><Layout><Subject /></Layout></ProtectedRoute>} /> 
        <Route path="/details/:id" element={<ProtectedRoute><Layout><QuestionDetail /></Layout></ProtectedRoute>} />
        {/* <Route path="/chat" element={<ProtectedRoute><Layout><Chatbox /></Layout></ProtectedRoute>} /> */}
        <Route path="/rank-rating" element={<ProtectedRoute><Layout><RankRating /></Layout></ProtectedRoute>} />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
