// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import HomePage from './HomePage';
import Signup from './Signup';
import Navbar from './Navbar';
import CodeEditor from './CodeEditor';

const App = () => {
  return (
    <Router>
      <Navbar /> {/* Navbar is outside of Routes so it stays on all pages */}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/playground" element={<CodeEditor />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
