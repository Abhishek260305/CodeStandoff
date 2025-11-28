import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from './auth';
import './HomePage.css';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 50px)',
      backgroundColor: '#2d2d2d',
      color: '#fff',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
            Welcome to CodeStandoff
          </h1>
          {user && (
            <p style={{ fontSize: '18px', color: '#ccc' }}>
              Hello, {user.firstName} {user.lastName}! Ready to code?
            </p>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '40px'
        }}>
          <div
            onClick={() => navigate('/subject')}
            style={{
              backgroundColor: '#3d3d3d',
              padding: '30px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #666',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4d4d4d';
              e.currentTarget.style.borderColor = '#9f9ffa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3d3d3d';
              e.currentTarget.style.borderColor = '#666';
            }}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '15px', color: '#4ade80' }}>
              Training Mode
            </h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Practice coding problems at your own pace. Choose from various difficulty levels and improve your skills.
            </p>
          </div>

          <div
            onClick={() => navigate('/game')}
            style={{
              backgroundColor: '#3d3d3d',
              padding: '30px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #666',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4d4d4d';
              e.currentTarget.style.borderColor = '#9f9ffa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3d3d3d';
              e.currentTarget.style.borderColor = '#666';
            }}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '15px', color: '#fbbf24' }}>
              1v1 Battle
            </h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Challenge other players in real-time coding battles. Test your skills against competitors!
            </p>
          </div>

          <div
            onClick={() => navigate('/playground')}
            style={{
              backgroundColor: '#3d3d3d',
              padding: '30px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #666',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4d4d4d';
              e.currentTarget.style.borderColor = '#9f9ffa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3d3d3d';
              e.currentTarget.style.borderColor = '#666';
            }}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '15px', color: '#60a5fa' }}>
              Playground
            </h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Experiment with code in a safe environment. Try different languages and test your ideas.
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#3d3d3d',
          borderRadius: '8px',
          border: '1px solid #666'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>Quick Stats</h3>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#999', fontSize: '14px' }}>Username</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{user?.username || 'Loading...'}</p>
            </div>
            <div>
              <p style={{ color: '#999', fontSize: '14px' }}>Email</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{user?.email || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
