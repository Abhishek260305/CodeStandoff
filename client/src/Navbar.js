import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import './Navbar.css';
import { checkAuth, logout } from './auth';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Re-check auth whenever route changes
  useEffect(() => {
    const verifyAuth = async () => {
      const auth = await checkAuth();
      setIsAuthenticated(auth.authenticated);
      setUser(auth.user);
    };
    verifyAuth();
  }, [location.pathname]); // Re-check when route changes

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setIsAuthenticated(false);
      setUser(null);
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1>Coding Standoff</h1>
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <Link to="/home">Home</Link>
            <Link to="/subject">Training</Link>
            <Link to="/game">1v1 Game</Link>
            <Link to="/playground">Playground</Link>
            {user && <span style={{ color: '#fff', marginRight: '20px', fontSize: '14px' }}>Welcome, {user.username}</span>}
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #9f9ffa',
                color: '#fff',
                padding: '5px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginLeft: '20px'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
