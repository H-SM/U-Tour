import React, { useContext, useEffect, useState } from "react";
import ContextValue from "../context/EventContext";
import { useNavigate } from "react-router-dom";
import SessionsDisplay from "../components/Sessions/SessionsDisplay";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import SideNavbar from "../components/SideNavbar";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";

const Sessions = ({ isExpanded, setIsExpanded }) => {
  // Initialize data as null instead of empty array
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { userDetailsFirebase, setUserDetailsFirebase } = useContext(ContextValue);
  const { checkAuth, signOutUser } = useFirebaseAuth();
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  const logoutUser = () => {
    signOutUser();
    setUserDetailsFirebase(null);
    navigate("/login");
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

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);

      if (!userDetailsFirebase?.uid) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/users/${userDetailsFirebase.uid}/get-combined`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const sessionData = await response.json();

        // Validate the required data exists
        if (!sessionData.stats || !sessionData.recentSessions) {
          throw new Error("Invalid data format received");
        }

        setData(sessionData);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load sessions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userDetailsFirebase?.uid) {
      fetchSessions();
    }
  }, [userDetailsFirebase]);

  // Only render SessionsDisplay when we have valid data
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <SideNavbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      {/* Main Content Wrapper */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? "lg:ml-64" : "lg:ml-20"}
        `}
      >
        <div className="w-full min-h-screen backdrop-blur-sm">
          {/* Navigation Bar */}
          <Navbar
            userDetailsFirebase={userDetailsFirebase}
            logoutUser={logoutUser}
          />
          <main className="container mx-auto px-4 py-12 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-[80vh] w-full">
                <Loader />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center min-h-screen">
                <div>Error: {error}</div>
              </div>
            ) : !data || !data.stats || !data.recentSessions ? (
              <div className="flex items-center justify-center min-h-screen">
                <div>No sessions found.</div>
              </div>
            ) : (
              <SessionsDisplay
                sessions={data.recentSessions}
                stats={data.stats}
                userDetails={data.user}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
