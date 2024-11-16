import React, {
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import ContextValue from "./../../context/EventContext";
import { MapPin, Clock, Mail, Users, User, Search, X } from "lucide-react";
import SearchUser from "./SearchUser";
import debounce from "lodash/debounce";

const InputForm = ({
  handleInputChange,
  bookingData,
  setBookingData,
  showAlert,
}) => {
  const { userDetailsFirebase } = useContext(ContextValue);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchField, setActiveSearchField] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const nameSearchRef = useRef(null);
  const emailSearchRef = useRef(null);
  const [useLoggedInUser, setUseLoggedInUser] = useState(false);

  useEffect(() => {
    if (useLoggedInUser && userDetailsFirebase) {
      setBookingData((prev) => ({
        ...prev,
        name: userDetailsFirebase.displayName || "",
        email: userDetailsFirebase.email || "",
      }));
      setSelectedUser(userDetailsFirebase);
    }
  }, [useLoggedInUser, userDetailsFirebase]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeSearchField &&
        nameSearchRef.current &&
        emailSearchRef.current &&
        !nameSearchRef.current.contains(event.target) &&
        !emailSearchRef.current.contains(event.target)
      ) {
        setActiveSearchField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeSearchField]);

  const handleKeyDown = (event) => {
    if (!searchResults.length || !activeSearchField) return;

    if (event.key === "Enter" || event.key === "Tab") {
      setActiveSearchField(null);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/users/search`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          }
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = await response.json();
        setSearchResults(data.users);
        setIsSearchOpen(true);
      } catch (error) {
        console.error("Error searching users:", error);
        showAlert("Error searching users", "error");
      } finally {
        setLoadingSearch(false);
      }
    }, 400),
    []
  );

  const handleUserSearch = (event) => {
    const { value, name } = event.target;

    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSearchQuery(value);
    setActiveSearchField(name);
    if (name === "name" || name === "email") {
      setSearchQuery(value);

      if (value.length >= 3) {
        debouncedSearch(value);
      } else {
        setSearchResults([]);
      }
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchQuery(""); // Clear search query
    setBookingData((prev) => ({
      ...prev,
      name: user.displayName,
      email: user.email,
    }));
    setIsSearchOpen(false);
    setActiveSearchField(null);
  };

  const clearSelection = (field) => {
    setSelectedUser(null);
    setBookingData((prev) => ({
      ...prev,
      [field]: "",
    }));
    setActiveSearchField(null);
  };

  const createSession = async () => {
    console.log("Creating session...", bookingData);
    // Define required fields based on tour type
    const requiredFields = [
      "name",
      "email",
      "from",
      "to",
      "departureTime",
      "type",
    ];
    if (bookingData.type === "team") {
      requiredFields.push("teamSize");
    }

    // Check only the required fields
    const missingFields = requiredFields.filter((field) => !bookingData[field]);

    if (missingFields.length > 0) {
      showAlert(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
        "warning"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Convert time string to full ISO date string
      const today = new Date();
      const [hours, minutes] = bookingData.departureTime.split(":");
      const departureDate = new Date(today);
      departureDate.setHours(parseInt(hours, 10));
      departureDate.setMinutes(parseInt(minutes, 10));
      departureDate.setSeconds(0);
      departureDate.setMilliseconds(0);

      const sessionData = {
        bookingUserId: userDetailsFirebase.uid,
        userEmail: bookingData.email,
        userName: bookingData.name,
        to: bookingData.to,
        from: bookingData.from,
        departureTime: departureDate.toISOString(),
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

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/sessions/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sessionData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const result = await response.json();
      console.log("Session created:", result);
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
      setUseLoggedInUser(false);
    } catch (error) {
      console.error("Error creating session:", error);
      showAlert("Failed to create session. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
      <div className="space-y-6">
        {/* Tour Type Selection */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Tour Type</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() =>
                handleInputChange({ target: { name: "type", value: "single" } })
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
                handleInputChange({ target: { name: "type", value: "team" } })
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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useLoggedInUser"
            checked={useLoggedInUser}
            onChange={(e) => setUseLoggedInUser(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor="useLoggedInUser" className="text-white text-sm">
            Same as logged in user
          </label>
        </div>

        {/* User Name */}
        <div className="space-y-2 relative" ref={nameSearchRef}>
          <label className="text-white text-sm font-medium">Name</label>
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="Search users..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-60"
              onChange={handleUserSearch}
              value={bookingData.name}
              onKeyDown={handleKeyDown}
              autocomplete="off"
              disabled={useLoggedInUser}
            />
            {bookingData.name && !useLoggedInUser && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => clearSelection("name")}
              >
                <X
                  size={18}
                  className="text-white opacity-50 hover:opacity-100"
                />
              </button>
            )}
          </div>
          {activeSearchField === "name" && (
            <SearchUser
              isOpen={true}
              onClose={() => setActiveSearchField(null)}
              searchResults={searchResults}
              onSelect={handleUserSelect}
              isLoading={loadingSearch}
            />
          )}
        </div>

        {/* User Email */}
        <div className="space-y-2 relative" ref={emailSearchRef}>
          <label className="text-white text-sm font-medium">Email</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-60"
              value={bookingData.email}
              onChange={handleUserSearch}
              onKeyDown={handleKeyDown}
              autocomplete="off"
              disabled={useLoggedInUser}
            />
            {bookingData.email && !useLoggedInUser && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => clearSelection("email")}
              >
                <X
                  size={18}
                  className="text-white opacity-50 hover:opacity-100"
                />
              </button>
            )}
            {activeSearchField === "email" && (
              <SearchUser
                isOpen={true}
                onClose={() => setActiveSearchField(null)}
                searchResults={searchResults}
                onSelect={handleUserSelect}
                isLoading={loadingSearch}
              />
            )}
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
  );
};

export default InputForm;
