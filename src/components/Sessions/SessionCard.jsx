import React, { useState } from "react";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";
import Modal from "../Modal";
import { useNavigate } from "react-router-dom";
import { locations, RESULT_STATUS } from "../../common/constant";

const SessionCard = ({ session }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStateColor = (state) => {
    switch (state) {
      case "QUEUED":
        return "text-yellow-500";
      case "ACTIVE":
        return "text-green-500";
      case "DONE":
        return "text-blue-500";
      case "CANCEL":
        return "text-red-500";
      case "ERROR":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const formatLocation = (locationValue) => {
    const foundLocation = locations.find(
      (location) => location.value === locationValue
    );
    return foundLocation ? foundLocation.label : locationValue;
  };

  const handleCancelSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/sessions/${session.id}/state`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state: "CANCEL" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel session");
      }
      const result = await response.json();
      if (result.status === RESULT_STATUS.SUCCESS) {
        window.location.reload();
      }
    } catch (err) {
      setError("Failed to cancel session. Please try again.");
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/sessions/${session.id}`);
  };

  const isBookedByFriend = session.bookingUserId !== session.userId;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 w-full mb-4">
      {isBookedByFriend && (
        <div className="absolute -top-3 right-2 px-3 py-1 bg-yellow-700 border border-yellow-500/40 rounded-full">
          <span className="text-yellow-200 text-sm font-medium flex items-center">
            <User className="w-3 h-3 mr-1" />
            Booked by a friend
          </span>
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col justify-start items-start">
          <h3 className="text-xl font-semibold mb-2 text-white text-left">
            {formatDate(session.departureTime)}
          </h3>
          <div
            className={`inline-flex items-center text-[0.8rem] font-bold px-3 py-1 rounded-full ${getStateColor(
              session.state
            )} bg-white`}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {session.state}
          </div>
        </div>
        <div className="text-right hidden sm:flex flex-col">
          <p className="text-sm text-gray-300">Session ID</p>
          <p className="font-mono text-sm text-white">
            {session.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-white text-left">
        <div className="space-y-3">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-3 text-green-500" />
            <div>
              <p className="text-sm text-gray-300">From</p>
              <p className="font-medium">{formatLocation(session.from)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-3 text-red-500" />
            <div>
              <p className="text-sm text-gray-300">To</p>
              <p className="font-medium">{formatLocation(session.to)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-3 text-blue-500" />
            <div>
              <p className="text-sm text-gray-300">Departure</p>
              <p className="font-medium">{formatTime(session.departureTime)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 mr-3 text-purple-500" />
            <div>
              <p className="text-sm text-gray-300">Tour Type</p>
              <p className="font-medium capitalize">{session.tourType}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {session.state === "QUEUED" && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Cancel Session"}
          </button>
        )}
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleViewDetails}
        >
          View Details
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cancel Session"
        description="Are you sure you want to cancel this session? This action cannot be undone."
        confirmText="Yes, cancel session"
        cancelText="No, keep it"
        onConfirm={handleCancelSession}
        isLoading={loading}
      />
    </div>
  );
};

export default SessionCard;
