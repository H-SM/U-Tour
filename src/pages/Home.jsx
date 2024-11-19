import React, { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ContextValue from "../context/EventContext";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import Destination from "../components/Home/Destination";
import MapSection from "../components/Home/MapSection";
import Navbar from "../components/Navbar";
import InputForm from "../components/Home/InputForm";
import SideNavbar from "../components/SideNavbar";

const Dashboard = ({ showAlert, isExpanded, setIsExpanded }) => {
  const navigate = useNavigate();
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const { signOutUser, checkAuth } = useFirebaseAuth();

  const [bookingData, setBookingData] = useState({
    name: "",
    type: "single",
    from: "",
    to: "",
    departureDate: "",
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

          <main className="container mx-auto px-4 py-12 pb-[6rem]">
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
                <div className="flex xl:hidden w-full md:w-full">
                  <MapSection bookingData={bookingData} />
                </div>
                <InputForm
                  handleInputChange={handleInputChange}
                  bookingData={bookingData}
                  setBookingData={setBookingData}
                  showAlert={showAlert}
                />
              </div>
              {/* Map Section */}
              <div className="hidden xl:flex w-full md:w-full">
                <MapSection bookingData={bookingData} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
