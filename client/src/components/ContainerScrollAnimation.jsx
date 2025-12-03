"use client";

import React, { useRef } from "react";

export const ContainerScroll = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Track scroll manually with debug
  React.useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const element = containerRef.current;
      const rect = element.getBoundingClientRect();
      const containerHeight = element.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate progress based on element position in viewport
      const start = rect.top;
      const progress = Math.max(0, Math.min(1, (viewportHeight - start) / (containerHeight + viewportHeight)));
      
      console.log('Scroll Progress:', progress.toFixed(2), 'Top:', start.toFixed(0));
      setScrollProgress(progress);
    };

    // Find ALL possible scroll containers
    const scrollContainers = [
      ...document.querySelectorAll('[style*="overflow"]'),
      ...document.querySelectorAll('[style*="Overflow"]'),
      document.documentElement,
      window
    ];
    
    console.log('Found scroll containers:', scrollContainers.length);
    
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll, { passive: true });
    });
    
    handleScroll(); // Initial calculation
    
    return () => {
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  // Calculate transforms based on scroll progress (recalculated on each render)
  // Increased rotation and scale for more dramatic effect
  const scaleDimensions = isMobile ? [0.7, 0.9] : [1.2, 1];
  const rotate = 35 - (scrollProgress * 35); // 35 to 0 (more dramatic!)
  const scale = scaleDimensions[0] - (scrollProgress * (scaleDimensions[0] - scaleDimensions[1])); // 1.2 to 1
  const translate = scrollProgress * -150; // 0 to -150 (more movement)

  console.log('Rendering with:', { rotate: rotate.toFixed(1), scale: scale.toFixed(2), translate: translate.toFixed(0) });

  return (
    <div
      className="h-[50rem] md:h-[60rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
      style={{ marginTop: '-100px' }}
    >
      <div
        className="py-10 md:py-20 w-full relative"
        style={{
          perspective: "1500px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} scrollProgress={scrollProgress} />
        <Card rotate={rotate} scale={scale} scrollProgress={scrollProgress}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent, scrollProgress }) => {
  // Force re-render by using scrollProgress as key
  return (
    <div
      key={`header-${scrollProgress}`}
      style={{
        transform: `translateY(${translate}px)`,
        willChange: 'transform',
      }}
      className="max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  scrollProgress,
}) => {
  // Force re-render and log transform values
  console.log('Card transform:', `rotateX(${rotate.toFixed(1)}deg) scale(${scale.toFixed(2)})`);
  
  return (
    <div
      key={`card-${scrollProgress}`}
      style={{
        transform: `rotateX(${rotate}deg) scale(${scale})`,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center top',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4">
        {children}
      </div>
    </div>
  );
};

