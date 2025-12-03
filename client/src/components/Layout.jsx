import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarBody, SidebarLink } from "./Sidebar";
import {
  IconHome,
  IconTrophy,
  IconSword,
  IconCode,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { logout } from "../auth";

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false); // Start with sidebar closed
  const navigate = useNavigate();
  const hoverTimeoutRef = React.useRef(null);

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Debounce: wait 300ms before opening
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Debounce: wait 200ms before closing
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate("/login");
    }
  };

  const links = [
    {
      label: "Home",
      href: "/home",
      icon: <IconHome />,
    },
    {
      label: "Training",
      href: "/subject",
      icon: <IconTrophy />,
    },
    {
      label: "1v1 Game",
      href: "/game",
      icon: <IconSword />,
    },
    {
      label: "Playground",
      href: "/test",
      icon: <IconCode />,
    },
  ];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Sidebar 
        open={open} 
        setOpen={setOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarBody style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '4px',
          }}>
            {open ? <Logo /> : <LogoIcon />}
            
            {/* Navigation Section */}
            <div style={{ 
              marginTop: '8px',
              paddingBottom: '16px',
            }}>
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            
            {/* Divider */}
            <div style={{
              height: '1px',
              backgroundColor: '#2a2a2a',
              margin: '16px 0',
              opacity: open ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }} />
            
            <SidebarLink
              link={{
                label: "Profile",
                href: "#",
                icon: <IconUser />,
              }}
            />
          </div>
          
          {/* Bottom Section - Logout (Always at bottom) */}
          <div style={{ 
            paddingTop: '12px',
            paddingBottom: '8px',
            borderTop: '1px solid #2a2a2a',
          }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: open ? 'flex-start' : 'center',
                gap: '12px',
                padding: '10px 12px',
                width: '100%',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2a1a1a';
                e.currentTarget.style.borderColor = '#3a2a2a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <IconLogout style={{ 
                color: '#ef4444', 
                width: '20px', 
                height: '20px',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }} />
              {open && (
                <span style={{
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                }}>
                  Logout
                </span>
              )}
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#262626',
        width: '100%',
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          height: '100%',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Logo = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        marginTop: '8px',
        marginBottom: '24px',
        borderRadius: '8px',
        border: '1px solid #2a2a2a',
        backgroundColor: '#1f1f1f',
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#e0e0e0',
        letterSpacing: '0.5px',
      }}>
        CS
      </div>
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#b0b0b0',
        letterSpacing: '0.2px',
      }}>
        Coding Standoff
      </span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        marginTop: '8px',
        marginBottom: '24px',
        borderRadius: '8px',
        border: '1px solid #2a2a2a',
        backgroundColor: '#1f1f1f',
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#e0e0e0',
        letterSpacing: '0.5px',
      }}>
        CS
      </div>
    </div>
  );
};

export default Layout;

