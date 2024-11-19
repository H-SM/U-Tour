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
import { useNavigate } from "react-router-dom";

const FIXED_HOURS = [
  // { value: "05:00", label: "5 AM" },
  // { value: "06:00", label: "6 AM" },
  // { value: "07:00", label: "7 AM" },
  // { value: "08:00", label: "8 AM" },
  { value: "09:00", label: "9 AM" },
  { value: "10:00", label: "10 AM" },
  { value: "11:00", label: "11 AM" },
  { value: "12:00", label: "12 PM" },
  { value: "13:00", label: "1 PM" },
  { value: "14:00", label: "2 PM" },
  { value: "15:00", label: "3 PM" },
  { value: "16:00", label: "4 PM" },
  { value: "17:00", label: "5 PM" },
  // { value: "18:00", label: "6 PM" },
];

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
  const [bookedHours, setBookedHours] = useState([]);
  const [useLoggedInUser, setUseLoggedInUser] = useState(false);
  const navigate = useNavigate();
  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    console.log("Booking Data:", bookingData);
  }, [bookingData]);

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
      "departureDate",
      "type",
    ];
    if (bookingData.type === "team") {
      requiredFields.push("teamSize", "teamName");
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
      // Convert time string to full ISO date string using the selected date
      const [hours, minutes] = bookingData.departureTime.split(":");
      const departureDate = new Date(bookingData.departureDate);
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
                name: bookingData.teamName,
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
        departureDate: today,
        email: "",
        teamSize: 1,
        teamName: "",
        teamNotes: "",
      });
      setSelectedUser(null);
      setUseLoggedInUser(false);
      navigate(`/sessions/${result.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      showAlert("Failed to create session. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchBookedHours = async () => {
      if (!bookingData.departureDate) return;

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/tours/booked-hours`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ date: bookingData.departureDate }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch booked hours");
        }

        const data = await response.json();
        setBookedHours(data);
      } catch (error) {
        console.error("Error fetching booked hours:", error);
        showAlert("Failed to fetch available hours", "error");
      }
    };

    fetchBookedHours();
  }, [bookingData.departureDate]);

  const getMinDate = () => {
    const now = new Date();
    
    // If current time is after 5 PM, set min date to tomorrow
    if (now.getHours() >= 17) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Otherwise, use today's date
    return now.toISOString().split('T')[0];
  };

  const getAvailableHours = () => {
    const MAX_SINGLE_SIZE = 10;
    const MAX_TEAM_SIZE = 10;
    const now = new Date();
    const selectedDate = new Date(bookingData.departureDate);

    // Check if the selected date is today
    const isToday =
      now.getFullYear() === selectedDate.getFullYear() &&
      now.getMonth() === selectedDate.getMonth() &&
      now.getDate() === selectedDate.getDate();

    return FIXED_HOURS.filter((hour) => {
      const hourValue = new Date(`2000-01-01T${hour.value}`).getHours();

      if (isToday) {
        const hourDateTime = new Date(selectedDate);
        hourDateTime.setHours(hourValue, 0, 0, 0);

        // Check if current time is within 5 minutes of next hour
        const isNearNextHour =
          now.getMinutes() >= 55 && now.getHours() + 1 === hourValue;

        // Filter out hours that have already passed or are too close to passing
        if (hourDateTime <= now || isNearNextHour) {
          return false;
        }
      }
      const bookedHour = bookedHours.find((b) => b.hour === hourValue);

      if (!bookedHour) return true; // No bookings for this hour

      if (bookingData.type === "single") {
        return bookedHour.totalSize < MAX_SINGLE_SIZE;
      }

      // For team bookings, check remaining capacity
      const remainingCapacity = MAX_TEAM_SIZE - bookedHour.totalSize;
      return remainingCapacity >= parseInt(bookingData.teamSize || 1);
    });
  };

  const modifiedHandleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "departureDate") {
      // Reset departure time when date changes
      setBookingData((prev) => ({
        ...prev,
        [name]: value,
        departureTime: "", // Clear previous time selection
      }));
    } else {
      handleInputChange(event);
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
              Individual
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
              autoComplete="off"
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
              autoComplete="off"
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
            {/* Team Name Input */}
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-2 w-full">
                <label className="text-white text-sm font-medium">
                  Team Name
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={bookingData.teamName}
                  onChange={handleInputChange}
                  placeholder="Enter team name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="space-y-2 w-fit">
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

        {/* Date and Time Selection - Modified */}
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-2 w-1/2">
            <label className="text-white text-sm font-medium">
              Departure Date
            </label>
            <input
              type="date"
              name="departureDate"
              value={bookingData.departureDate}
              onChange={modifiedHandleInputChange}
              min={getMinDate()}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div className="space-y-2 w-1/2">
            <label className="text-white text-sm font-medium">
              Departure Time
            </label>
            <select
              name="departureTime"
              value={bookingData.departureTime}
              onChange={handleInputChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white disabled:opacity-60"
              disabled={bookingData.departureDate === ""}
            >
              <option value="">Select Time</option>
              {getAvailableHours().map((hour) => (
                <option key={hour.value} value={hour.value}>
                  {hour.label}
                </option>
              ))}
            </select>
          </div>
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
