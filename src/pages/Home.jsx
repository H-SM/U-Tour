import React, { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Settings, Calendar, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import ContextValue from "../context/EventContext";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import Destination from "../components/Home/Destination";
import MapSection from "../components/Home/MapSection";
import Navbar from "../components/Navbar";
import InputForm from "../components/Home/InputForm";

const Dashboard = ({ showAlert }) => {
  const navigate = useNavigate();
  const { userDetailsFirebase, setUserDetailsFirebase } = useContext(ContextValue);
  const { signOutUser, checkAuth } = useFirebaseAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    name: "",
    type: "single",
    from: "",
    to: "",
    departureTime: "",
    email: "",
    teamSize: 1,
    teamNotes: "",
  });

  const locations = [
    { value: "Bidholi-magic-stand", label: "Main Gate" },
    { value: "hubble", label: "The Hubble" },
    { value: "aditya-block", label: "Aditya Block" },
    { value: "upes-cricket-ground", label: "Cricket Ground" },
  ];

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/sessions', icon: Calendar, label: 'Sessions' },
  ];

  const logoutUser = () => {
    signOutUser();
    setUserDetailsFirebase(null);
    navigate("/login");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const user = await checkAuth();
        if (!user) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };
    authenticateUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
            {isExpanded && !isMobileOpen && <span className="text-xl font-bold">U Tour</span>}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-slate-800 hidden lg:block"
            >
              {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
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
                  ${isActive ? 'bg-blue-900 text-white' : 'hover:bg-slate-800'}
                  ${!isExpanded && 'justify-center'}
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

      {/* Main Content Wrapper */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'lg:ml-64' : 'lg:ml-20'}
        `}
      >
        <div className="w-full min-h-screen backdrop-blur-sm">
          {/* Navigation Bar */}
          <Navbar
            userDetailsFirebase={userDetailsFirebase}
            logoutUser={logoutUser}
          />
          
          <main className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Booking Form */}
              <div className="w-full flex flex-col gap-4 justify-start items-star">
                <Destination
                  from={bookingData.from}
                  to={bookingData.to}
                  onFromChange={(e) => handleInputChange(e)}
                  onToChange={(e) => handleInputChange(e)}
                  locations={locations}
                />
                <InputForm
                  handleInputChange={handleInputChange}
                  bookingData={bookingData}
                  setBookingData={setBookingData}
                  showAlert={showAlert}
                />
              </div>
              {/* Map Section */}
              <MapSection bookingData={bookingData} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;