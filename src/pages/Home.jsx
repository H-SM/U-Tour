import React, { useContext, useEffect, useState } from "react";
import { MapPin, Clock, Mail, Users, User, Navigation } from "lucide-react";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import ContextValue from "../context/EventContext";
import axios from "axios";

const Home = ({ showAlert }) => {
  const navigate = useNavigate();
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const { signOutUser } = useFirebaseAuth();
  const API_URL = process.env.REACT_APP_API_URL;
  const [bookingData, setBookingData] = useState({
    name: "",
    type: "single",
    from: "",
    to: "",
    departureTime: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (Object.values(bookingData).some((value) => value === "")) {
      showAlert("Please fill in all fields before booking.", "warning");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/mail/send-mail`, {
        to: bookingData.to,
        from: bookingData.from,
        departureTime: bookingData.departureTime,
        name: bookingData.name,
        tourType: bookingData.type,
        email: bookingData.email,
      });

      if (response.data.status === "success") {
        showAlert(
          "Booking confirmed! Check your email for details.",
          "success"
        );
        // Optionally reset the form or navigate to a confirmation page
        setBookingData({
          name: "",
          type: "single",
          from: "",
          to: "",
          departureTime: "",
          email: "",
        });
      } else {
        showAlert("Booking failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      showAlert("An error occurred. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const { checkAuth } = useFirebaseAuth();

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const user = await checkAuth();
        if (user) {
          console.log(user);
          setBookingData({
            name: user.displayName,
            type: "single",
            from: "",
            to: "",
            departureTime: "",
            email: user.email,
          });
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
        <nav className="w-full bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-white font-bold text-2xl">U Robot</div>
            <div className="flex flex-row-reverse justify-end items-center  h-[3rem] gap-2">
              <div className="w-[2.8rem] h-[3rem] rounded-full flex justify-center items-center">
                <img
                  className="w-[2.8rem] rounded-full object-contain"
                  src={
                    userDetailsFirebase && userDetailsFirebase.photoURL
                      ? userDetailsFirebase.photoURL
                      : "https://avatars.githubusercontent.com/u/98532264?s=400&u=0cf330740554169402dccc6d6925c21d8850cf03&v=4"
                  }
                  alt=""
                />
              </div>
              <div className="hidden md:flex flex-col justify-center items-end text-white">
                <div className="font-black text-[1.125rem] leading-1">
                  {userDetailsFirebase && userDetailsFirebase.displayName}
                </div>
                <div className="font-extrabold opacity-60 text-[0.75rem] leading-none">
                  {userDetailsFirebase && userDetailsFirebase.email}
                </div>
              </div>
              <div className="h-full w-fit flex justify-center items-center mr-[0.5rem]">
                <button
                  className="rounded-lg  px-3 py-1 text-sm font-semibold text-primary-white bg-transparent transition ease-in-out duration-150 hover:bg-blue-700/50 border border-blue-700 border-1 mt-2 text-white"
                  onClick={logoutUser}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Form Section */}
            <div className="w-full md:w-1/2 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <h2 className="text-white text-3xl font-bold mb-8">
                Book Your Robot Tour Guide
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">
                    Tour Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange({
                          target: { name: "type", value: "single" },
                        })
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        bookingData.type === "single"
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      <User size={18} />
                      Single Person
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange({
                          target: { name: "type", value: "team" },
                        })
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        bookingData.type === "team"
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      <Users size={18} />
                      Team
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={bookingData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name or team name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">
                      From
                    </label>
                    <select
                      name="from"
                      value={bookingData.from}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select location</option>
                      <option value="Main Gate">Main Gate</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">To</label>
                    <select
                      name="to"
                      value={bookingData.to}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select destination</option>
                      <option value="9th-block">9th Block</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">
                    Departure Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="departureTime"
                      value={bookingData.departureTime}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Clock
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                      size={18}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={bookingData.email}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                    />
                    <Mail
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                      size={18}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full flex justify-center items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isLoading && "opacity-70"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg
                      width="4rem"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 200 60"
                    >
                      <circle
                        fill="currentColor"
                        stroke="currentColor"
                        stroke-width="15"
                        r="15"
                        cx="40"
                        cy="30"
                      >
                        <animate
                          attributeName="opacity"
                          calcMode="spline"
                          dur="2"
                          values="1;0;1;"
                          keySplines=".5 0 .5 1;.5 0 .5 1"
                          repeatCount="indefinite"
                          begin="-.4"
                        ></animate>
                      </circle>
                      <circle
                        fill="currentColor"
                        stroke="currentColor"
                        stroke-width="15"
                        r="15"
                        cx="100"
                        cy="30"
                      >
                        <animate
                          attributeName="opacity"
                          calcMode="spline"
                          dur="2"
                          values="1;0;1;"
                          keySplines=".5 0 .5 1;.5 0 .5 1"
                          repeatCount="indefinite"
                          begin="-.2"
                        ></animate>
                      </circle>
                      <circle
                        fill="currentColor"
                        stroke="currentColor"
                        stroke-width="15"
                        r="15"
                        cx="160"
                        cy="30"
                      >
                        <animate
                          attributeName="opacity"
                          calcMode="spline"
                          dur="2"
                          values="1;0;1;"
                          keySplines=".5 0 .5 1;.5 0 .5 1"
                          repeatCount="indefinite"
                          begin="0"
                        ></animate>
                      </circle>
                    </svg>
                  ) : (
                    "Book Robot Guide"
                  )}
                </button>
              </form>
            </div>

            {/* Map Section */}
            <div className="w-full md:w-1/2 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden">
              <div className="w-full h-full min-h-[600px] bg-slate-800 relative">
                {/* <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/50 flex flex-col items-center gap-4">
                    <MapPin size={48} />
                    <p className="text-lg">Map Component Goes Here</p>
                  </div>
                </div> */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d766.3298335390363!2d77.9669056671879!3d30.416124086975763!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3908d523ca353cf3%3A0xc481116cc08ab6c!2s9th%20Block%2C%20UPES!5e0!3m2!1sen!2sin!4v1729265456400!5m2!1sen!2sin"
                  style={{ border: "0", width: "100%", height: "100%" }}
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
