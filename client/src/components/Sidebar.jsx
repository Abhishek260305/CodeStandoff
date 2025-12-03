import { cn } from "../utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {children}
      </div>
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      {/* Mobile sidebar temporarily hidden - using desktop version for all screen sizes */}
      {/* <MobileSidebar {...props} /> */}
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, animate } = useSidebar();
  return (
    <motion.div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: animate ? (open ? "240px" : "70px") : "240px",
        padding: '20px 12px',
        flexShrink: 0,
        position: 'relative',
        backgroundColor: '#18181b',
        borderRight: '1px solid #27272a',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
      }}
      initial={false}
      animate={{
        width: animate ? (open ? "240px" : "70px") : "240px",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}) => {
  const { open, animate } = useSidebar();
  const isActive = window.location.pathname === link.href;
  
  return (
    <a
      href={link.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'flex-start' : 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '8px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        marginBottom: '4px',
        backgroundColor: isActive ? '#242424' : 'transparent',
        border: isActive ? '1px solid #3a3a3a' : '1px solid transparent',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#222222';
          e.currentTarget.style.borderColor = '#2a2a2a';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
      {...props}
    >
      {React.cloneElement(link.icon, {
        style: { 
          color: isActive ? '#ffffff' : '#999999', 
          width: '20px', 
          height: '20px',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }
      })}

      <motion.span
        initial={false}
        animate={{
          width: animate ? (open ? "auto" : "0px") : "auto",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
        style={{
          color: isActive ? '#ffffff' : '#b0b0b0',
          fontSize: '14px',
          fontWeight: isActive ? 500 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          display: open || !animate ? "inline-block" : "none",
        }}
      >
        {link.label}
      </motion.span>

      {/* Subtle active indicator */}
      {isActive && open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            right: '12px',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
          }}
        />
      )}
    </a>
  );
};

