import React, { useContext, useState } from "react";
import ContextValue from "./../../context/EventContext";
import { MapPin, Clock, Mail, Users, User, Search, X } from "lucide-react";
import SearchUser from "./SearchUser";

const InputForm = ({
  handleInputChange,
  bookingData,
  setBookingData,
  showAlert,
}) => {
  const { userDetailsFirebase } =
    useContext(ContextValue);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSearch = async (query) => {
    setBookingData((prev) => ({ ...prev, name: query }));
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

  return (
    <div className="w-full  bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
      <div className="space-y-6">
        {/* Tour Type Selection */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Tour Type</label>
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

        {/* User Name */}
        <div className="space-y-2 relative">
          <label className="text-white text-sm font-medium">Name</label>
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
          <SearchUser
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            searchResults={searchResults}
            onSelect={handleUserSelect}
          />
        </div>

        {/* User Email */}
        <div className="space-y-2 relative">
          <label className="text-white text-sm font-medium">Email</label>
          <div className="relative">
            <input
              type="email"
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
          <SearchUser
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            searchResults={searchResults}
            onSelect={handleUserSelect}
          />
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
  );
};

export default InputForm;
