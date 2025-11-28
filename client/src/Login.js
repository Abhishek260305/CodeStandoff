import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
import { API_BASE_URL } from './auth';
import './loginstyle.css';

const Login = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const validateForm = () => {
    const newErrors = {};

    if (!formData.usernameOrEmail) newErrors.usernameOrEmail = 'Username or Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include cookies in request
          body: JSON.stringify({
            usernameOrEmail: formData.usernameOrEmail,
            password: formData.password,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setMessage('Login successful');
          console.log('Login successful, redirecting...');
          
          // Store token in localStorage as backup (cookie should work, but this is a fallback)
          // The server sets it in cookie, but we'll also store it locally for cross-origin issues
          if (result.token) {
            localStorage.setItem('authToken', result.token);
          }
          
          // Small delay to ensure cookie is set before redirect
          setTimeout(() => {
            navigate('/home');
          }, 100);
        } else {
          const result = await response.json();
          setMessage(result.message || 'Error logging in');
        }
      } catch (error) {
        setMessage('Error logging in');
      }
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleForgotPassword = () => {
    console.log('Forgot Password clicked');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <div className="full-width-input">
              <input
                type="text"
                name="usernameOrEmail"
                placeholder="Username or Email"
                value={formData.usernameOrEmail}
                onChange={handleChange}
              />
              {errors.usernameOrEmail && <p className="error">{errors.usernameOrEmail}</p>}
            </div>
            <div className="full-width-input">
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="error">{errors.password}</p>}
            </div>
            <div className="form-row">
              <div className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>
              <span className="forgot-password" onClick={handleForgotPassword}>Forgot Password?</span>
            </div>
            <input id="login" type="submit" value="Login" />
          </form>
          {message && <p className="message">{message}</p>}
          <div className="login-footer">
            <div className="signup-link-container">
              <p>Don't have an account? <span className="signup-link" onClick={() => navigate('/signup')}>Sign up</span></p> {/* Use navigate for signup */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
