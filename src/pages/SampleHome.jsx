import React, { useContext, useEffect, useState } from "react";
import { MapPin, Clock, Mail, Users, User, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContextValue from "../context/EventContext";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import Destination from "../components/Destination";

// Custom Dropdown Component
const SearchDropdown = ({ isOpen, onClose, searchResults, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
      {searchResults.length === 0 ? (
        <div className="p-4 text-gray-500">No users found.</div>
      ) : (
        <ul>
          {searchResults.map((user) => (
            <li
              key={user.uid}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => {
                onSelect(user);
                onClose();
              }}
            >
              <User className="w-4 h-4" />
              <span>{user.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SampleHome = ({ showAlert }) => {
  const navigate = useNavigate();
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const { signOutUser, checkAuth } = useFirebaseAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const [isLoading, setIsLoading] = useState(false);

  const locations = [
    { value: "main-gate", label: "Main Gate" },
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

  const handleUserSearch = async (query) => {
    try {
      const results = [
        { uid: "1", displayName: "Test User", email: "test@example.com" },
      ];
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      showAlert("Error searching users", "error");
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setBookingData((prev) => ({
      ...prev,
      name: user.displayName,
      email: user.email,
    }));
    setIsSearchOpen(false);
  };

  const createSession = async () => {
    if (Object.values(bookingData).some((value) => value === "")) {
      showAlert("Please fill in all required fields.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const sessionData = {
        bookingUserId: userDetailsFirebase.uid,
        userId: selectedUser?.uid || userDetailsFirebase.uid,
        isBookedByFirebaseUser: true,
        isUserFirebaseUser: true,
        state: "QUEUED",
        to: bookingData.to,
        from: bookingData.from,
        departureTime: new Date(bookingData.departureTime).toISOString(),
        tourType: bookingData.type,
        team:
          bookingData.type === "team"
            ? {
                name: bookingData.name,
                size: parseInt(bookingData.teamSize),
                notes: bookingData.teamNotes,
                contactId: selectedUser?.uid || userDetailsFirebase.uid,
                isFirebaseContact: true,
              }
            : null,
      };

      console.log("Creating session:", sessionData);
      showAlert("Session created successfully!", "success");

      setBookingData({
        name: "",
        type: "single",
        from: "",
        to: "",
        departureTime: "",
        email: "",
        teamSize: 1,
        teamNotes: "",
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error creating session:", error);
      showAlert("Failed to create session. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const user = await checkAuth();
        if (user) {
          setBookingData((prev) => ({
            ...prev,
            name: user.displayName,
            email: user.email,
          }));
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
        <nav className="w-full bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-white font-bold text-2xl">U Robot</div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end text-white">
                <div className="font-semibold">
                  {userDetailsFirebase?.displayName}
                </div>
                <div className="text-sm opacity-60">
                  {userDetailsFirebase?.email}
                </div>
              </div>
              <img
                className="w-10 h-10 rounded-full"
                src={userDetailsFirebase?.photoURL || "/api/placeholder/40/40"}
                alt="Profile"
              />
              <button
                onClick={logoutUser}
                className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Booking Form */}
            <div className="w-full flex flex-col gap-4 justify-start items-star">
              <div className="w-full flex justify-between bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 ">
                <Destination
                  from={bookingData.from}
                  to={bookingData.to}
                  onFromChange={(e) => handleInputChange(e)}
                  onToChange={(e) => handleInputChange(e)}
                  locations={locations}
                />
              </div>
              <div className="w-full  bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <h2 className="text-white text-3xl font-bold mb-8">
                  Book Your Robot Tour Guide
                </h2>

                <div className="space-y-6">
                  {/* Tour Type Selection */}
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

                  {/* User Search */}
                  <div className="space-y-2 relative">
                    <label className="text-white text-sm font-medium">
                      Search User
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        onChange={(e) => handleUserSearch(e.target.value)}
                        onFocus={() => setIsSearchOpen(true)}
                        value={selectedUser ? selectedUser.displayName : ""}
                      />
                      {selectedUser && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setSelectedUser(null)}
                        >
                          <X
                            size={18}
                            className="text-white opacity-50 hover:opacity-100"
                          />
                        </button>
                      )}
                    </div>
                    <SearchDropdown
                      isOpen={isSearchOpen}
                      onClose={() => setIsSearchOpen(false)}
                      searchResults={searchResults}
                      onSelect={handleUserSelect}
                    />
                  </div>

                  {/* Location Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium">
                        From
                      </label>
                      <select
                        name="from"
                        value={bookingData.from}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Select location</option>
                        {locations.map((loc) => (
                          <option key={loc.value} value={loc.value}>
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium">
                        To
                      </label>
                      <select
                        name="to"
                        value={bookingData.to}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Select destination</option>
                        {locations.map((loc) => (
                          <option key={loc.value} value={loc.value}>
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Team Details (conditional) */}
                  {bookingData.type === "team" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-white text-sm font-medium">
                          Team Size
                        </label>
                        <input
                          type="number"
                          name="teamSize"
                          value={bookingData.teamSize}
                          onChange={handleInputChange}
                          min="2"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-white text-sm font-medium">
                          Team Notes
                        </label>
                        <textarea
                          name="teamNotes"
                          value={bookingData.teamNotes}
                          onChange={handleInputChange}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                          rows="3"
                        />
                      </div>
                    </div>
                  )}

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">
                      Departure Time
                    </label>
                    <input
                      type="time"
                      name="departureTime"
                      value={bookingData.departureTime}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={createSession}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 text-white font-medium rounded-lg 
                    bg-gradient-to-r from-blue-500 to-indigo-600
                    hover:opacity-90 transition-opacity
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoading ? "Creating Session..." : "Book Robot Guide"}
                  </button>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="w-full md:w-1/2 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden">
              <div className="w-full h-full min-h-[500px]">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/directions?origin=${
                    bookingData.from ? bookingData.from : "UPES"
                  }&destination=${
                    bookingData.to
                      ? bookingData.to
                      : bookingData.from
                      ? bookingData.from
                      : "UPES"
                  }&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&mode=walking&zoom=18`}
                  className="h-full w-full min-h-[500px] border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SampleHome;
