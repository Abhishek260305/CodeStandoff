import { cn } from "../utils";
import React from "react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  return (
    <div 
      className={cn("relative group", containerClassName)}
      style={{
        padding: '2px',
        borderRadius: '22px',
        background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe, #00f2fe, #667eea)',
        backgroundSize: animate ? '200% 200%' : '100% 100%',
        animation: animate ? 'gradient-shift 8s ease infinite' : 'none',
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '24px',
          background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4), rgba(240, 147, 251, 0.4), rgba(79, 172, 254, 0.4), rgba(0, 242, 254, 0.4))',
          filter: 'blur(16px)',
          opacity: 0.6,
          zIndex: -1,
          transition: 'opacity 0.3s ease',
        }}
        className="group-hover:opacity-90"
      />

      {/* Content */}
      <div className={cn("relative z-10", className)} style={{ borderRadius: '20px' }}>
        {children}
      </div>

      {/* Keyframes for animation */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};
