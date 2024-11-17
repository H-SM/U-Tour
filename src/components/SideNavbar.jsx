import {
  Home,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const SideNavbar = ({ isExpanded, setIsExpanded }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/sessions", icon: Calendar, label: "Sessions" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Navigation */}
      <nav
        className={`
      fixed top-0 left-0 h-full bg-slate-900 text-white z-40
      transition-all duration-300 ease-in-out
      ${isExpanded ? "w-64" : "w-20"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
            {isExpanded && !isMobileOpen && (
              <span className="text-xl font-bold">U Tour</span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-slate-800 hidden lg:block"
            >
              {isExpanded ? (
                <ChevronLeft size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-8 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-lg
              transition-colors duration-200
              ${isActive ? "bg-blue-900 text-white" : "hover:bg-slate-800"}
              ${!isExpanded && "justify-center"}
              mb-2
            `}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon size={24} />
                {isExpanded && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default SideNavbar;
