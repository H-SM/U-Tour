import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContextValue from "../context/EventContext";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import Destination from "../components/Home/Destination";
import SearchUser from "../components/Home/SearchUser";
import MapSection from "../components/Home/MapSection";
import Navbar from "../components/Navbar";
import InputForm from "../components/Home/InputForm";

const SampleHome = ({ showAlert }) => {
  const navigate = useNavigate();
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const { signOutUser, checkAuth } = useFirebaseAuth();

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
        if (user) {
          // setBookingData((prev) => ({
          //   ...prev,
          //   name: user.displayName,
          //   email: user.email,
          // }));
        } else {
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
  );
};

export default SampleHome;
