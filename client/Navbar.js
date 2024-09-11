import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1>Coding Standoff</h1>
      </div>
      <div className="navbar-right">
        <Link to="/home">Home</Link> {/* Navigates to Home */}
        <Link to="/playground">Training</Link> {/* Navigates to Playground */}
        <Link to="/help">Help</Link> {/* Add this route if needed */}
      </div>
    </nav>
  );
}

export default Navbar;
