// pages/SessionDetails.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideNavbar from "../components/SideNavbar";
import Navbar from "../components/Navbar";
import ContextValue from "../context/EventContext";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import Loader from "../components/Loader";

const SessionDetail = ({ isExpanded, setIsExpanded }) => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const { checkAuth, signOutUser } = useFirebaseAuth();
  const { navigate } = useNavigate();
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
    const fetchSessionDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/sessions/${sessionId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch session details");
        }
        const data = await response.json();
        setSession(data.session);
        console.log("Session details:", data.session);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

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
          <div className="container mx-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center h-[80vh] w-full">
                <Loader />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Session Details
                </h1>
                <pre className="bg-white/10 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
