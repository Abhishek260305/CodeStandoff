import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from './auth';
import { BackgroundGradient } from './components/BackgroundGradient';
import { TypewriterEffectSmooth } from './components/TypewriterEffect';
import { ContainerScroll } from './components/ContainerScrollAnimation';
import { IconTrophy, IconSword, IconCode } from '@tabler/icons-react';
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

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Battle-themed motivational phrases (changes on reload)
  const motivationalPhrases = [
    "What's on your battleground today?",
    "Ready to sharpen your code?",
    "Time to level up your skills",
    "Your next challenge awaits",
    "The arena is calling",
    "Forge your path to mastery",
    "Every bug is a battle won",
    "Code like a warrior",
    "Your keyboard is your weapon",
    "Time to conquer some algorithms",
    "The coding battlefield needs you",
    "Hone your skills, dominate the leaderboard",
    "Practice makes champions",
    "Ready for combat?",
    "Your opponents are training - are you?",
  ];

  const randomPhrase = useMemo(() => {
    return motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
  }, []);

  // Create words array for typewriter effect
  const greetingWords = useMemo(() => {
    const greeting = getTimeBasedGreeting();
    const firstName = user?.firstName || 'Coder';
    
    return [
      { text: greeting.split(' ')[0] }, // "Good"
      { text: greeting.split(' ')[1] || '' }, // "Morning/Afternoon/Evening"
      { text: firstName, className: "text-blue-500 dark:text-blue-500" },
    ].filter(word => word.text); // Remove empty words
  }, [user]);

  return (
    <div style={{
      minHeight: '100%',
      width: '100%',
      backgroundColor: '#262626',
      color: '#fff',
      paddingTop: '60px',
      paddingBottom: '60px',
    }}>
      <div style={{ 
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '80px',
        padding: '0 40px',
      }}>
        {/* Welcome Section with Typewriter */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {user && <TypewriterEffectSmooth words={greetingWords} />}
          
          <p style={{ 
            fontSize: '18px', 
            color: '#999', 
            fontWeight: '400',
            marginTop: '8px',
            fontStyle: 'italic',
          }}>
            {randomPhrase}
          </p>
        </div>

        {/* Gradient Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
          width: '100%',
          maxWidth: '1200px',
          gridAutoRows: '1fr',
        }}>
          {/* Training Card */}
          <BackgroundGradient 
            className="rounded-[22px] p-6 bg-zinc-900"
            containerClassName="h-full"
          >
            <div 
              onClick={() => navigate('/subject')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '20px',
                padding: '24px',
                height: '100%',
                minHeight: '320px',
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(76, 175, 80, 0.3)',
              }}>
                <IconTrophy size={40} color="#4caf50" />
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                color: '#4caf50', 
                marginBottom: '8px',
                fontWeight: '600',
                textAlign: 'center',
              }}>
                Training Mode
              </h2>
              <p style={{ 
                fontSize: '15px', 
                color: '#b0b0b0',
                textAlign: 'center',
                lineHeight: '1.6',
              }}>
                Practice coding problems at your own pace. Choose from various difficulty levels and improve your skills.
              </p>
            </div>
          </BackgroundGradient>

          {/* 1v1 Battle Card */}
          <BackgroundGradient 
            className="rounded-[22px] p-6 bg-zinc-900"
            containerClassName="h-full"
          >
            <div 
              onClick={() => navigate('/game')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '20px',
                padding: '24px',
                height: '100%',
                minHeight: '320px',
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 152, 0, 0.3)',
              }}>
                <IconSword size={40} color="#ff9800" />
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                color: '#ff9800', 
                marginBottom: '8px',
                fontWeight: '600',
                textAlign: 'center',
              }}>
                1v1 Battle
              </h2>
              <p style={{ 
                fontSize: '15px', 
                color: '#b0b0b0',
                textAlign: 'center',
                lineHeight: '1.6',
              }}>
                Challenge other players in real-time coding battles. Test your skills against competitors!
              </p>
            </div>
          </BackgroundGradient>

          {/* Playground Card */}
          <BackgroundGradient 
            className="rounded-[22px] p-6 bg-zinc-900"
            containerClassName="h-full"
          >
            <div 
              onClick={() => navigate('/test')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '20px',
                padding: '24px',
                height: '100%',
                minHeight: '320px',
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(33, 150, 243, 0.3)',
              }}>
                <IconCode size={40} color="#2196f3" />
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                color: '#2196f3', 
                marginBottom: '8px',
                fontWeight: '600',
                textAlign: 'center',
              }}>
                Playground
              </h2>
              <p style={{ 
                fontSize: '15px', 
                color: '#b0b0b0',
                textAlign: 'center',
                lineHeight: '1.6',
              }}>
                Experiment with code in a safe environment. Try different languages and test your ideas.
              </p>
            </div>
          </BackgroundGradient>
        </div>

        {/* Scroll Animation Section */}
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Unleash the power of <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                  Scroll Animations
                </span>
              </h1>
            </>
          }
        >
          <img
            src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1400&h=720&fit=crop"
            alt="hero"
            height={720}
            width={1400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
          />
        </ContainerScroll>
      </div>
    </div>
  );
};

export default HomePage;
