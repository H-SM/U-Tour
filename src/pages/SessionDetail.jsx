// pages/SessionDetails.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideNavbar from "../components/SideNavbar";
import Navbar from "../components/Navbar";
import ContextValue from "../context/EventContext";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import Loader from "../components/Loader";
import { Check, Share2, User } from "lucide-react";
import Modal from "../components/Modal";

const SessionDetail = ({ isExpanded, setIsExpanded }) => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [participant, setParticipant] = useState(null);
  const [booker, setBooker] = useState(null);
  const { checkAuth, signOutUser } = useFirebaseAuth();
  const navigate = useNavigate();
  const logoutUser = () => {
    signOutUser();
    setUserDetailsFirebase(null);
    navigate("/login");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const user = await checkAuth();
        if (!user) {
          //   navigate("/login");
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

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Fetch participant details
        const participantResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/users/${session.userId}`
        );
        const participantData = await participantResponse.json();
        setParticipant(participantData);

        // Only fetch booker if different from participant
        if (session.bookingUserId !== session.userId) {
          console.log(
            "Booking User ID:",
            session.bookingUserId,
            "User ID:",
            session.userId
          );
          const bookerResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/users/${session.bookingUserId}`
          );
          const bookerData = await bookerResponse.json();
          console.log("Booker details:", bookerData);
          setBooker(bookerData);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    if (session && session.userId && session.bookingUserId) {
      fetchUserDetails();
    }
  }, [session]);

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStateColor = (state) => {
    switch (state) {
      case "ACTIVE":
        return "text-emerald-500 border-emerald-500";
      case "QUEUED":
        return "text-yellow-500 border-yellow-500";
      case "DONE":
        return "text-blue-500 border-blue-500";
      case "CANCEL":
        return "text-red-500 border-red-500";
      default:
        return "text-gray-500 border-gray-500";
    }
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

      window.location.reload();
    } catch (err) {
      setError("Failed to cancel session. Please try again.");
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

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
          <div className="container mx-auto sm:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-[80vh] w-full">
                <Loader />
              </div>
            ) : (
              <>
                <div className="max-w-2xl mx-auto md:p-4 space-y-6">
                  {/* Main Session Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                      <div className="text-left space-y-1">
                        <div>
                          <span className="text-gray-300">Booking ID:</span>
                          <span className="ml-2 text-sm font-semibold">
                            {session.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-300">Created:</span>
                          <span className="ml-2 font-semibold">
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`${getStateColor(
                          session.state
                        )} px-4 py-1 rounded-full text-[0.9rem] bg-white border-[3px] font-bold mt-4 md:mt-0`}
                      >
                        {session.state}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <h1 className="text-2xl font-bold">Session Details</h1>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between w-full h-fit border-b-[1px] border-dashed mb-6">
                      {/* Date and Time */}
                      <div className="py-4 ml-4">
                        <div className="flex items-center text-lg text-left">
                          <span className="font-semibold">
                            {formatDate(session.departureTime)}
                          </span>
                        </div>
                        <div className="text-gray-100 text-left">
                          Departure at{" "}
                          <b>{formatTime(session.departureTime)}</b>
                        </div>
                      </div>

                      {/* Tour Type */}
                      <div className="text-left md:text-right py-4 mt-1 mr-4 ml-4 md:ml-0">
                        <div className="text-gray-100 text-md">Tour Type</div>
                        <div className="font-semibold capitalize">
                          {session.tourType}
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {(session.state === "ERROR" ||
                      session.state === "CANCEL") &&
                      session.message && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex flex-col sm:flex-row items-start justify-start">
                          <div className="flex w-[2rem] h-[2rem] my-1 text-red-500">
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                              <g
                                id="SVGRepo_tracerCarrier"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></g>
                              <g id="SVGRepo_iconCarrier">
                                <path
                                  d="M7.493 0.015 C 7.442 0.021,7.268 0.039,7.107 0.055 C 5.234 0.242,3.347 1.208,2.071 2.634 C 0.660 4.211,-0.057 6.168,0.009 8.253 C 0.124 11.854,2.599 14.903,6.110 15.771 C 8.169 16.280,10.433 15.917,12.227 14.791 C 14.017 13.666,15.270 11.933,15.771 9.887 C 15.943 9.186,15.983 8.829,15.983 8.000 C 15.983 7.171,15.943 6.814,15.771 6.113 C 14.979 2.878,12.315 0.498,9.000 0.064 C 8.716 0.027,7.683 -0.006,7.493 0.015 M8.853 1.563 C 9.967 1.707,11.010 2.136,11.944 2.834 C 12.273 3.080,12.920 3.727,13.166 4.056 C 13.727 4.807,14.142 5.690,14.330 6.535 C 14.544 7.500,14.544 8.500,14.330 9.465 C 13.916 11.326,12.605 12.978,10.867 13.828 C 10.239 14.135,9.591 14.336,8.880 14.444 C 8.456 14.509,7.544 14.509,7.120 14.444 C 5.172 14.148,3.528 13.085,2.493 11.451 C 2.279 11.114,1.999 10.526,1.859 10.119 C 1.618 9.422,1.514 8.781,1.514 8.000 C 1.514 6.961,1.715 6.075,2.160 5.160 C 2.500 4.462,2.846 3.980,3.413 3.413 C 3.980 2.846,4.462 2.500,5.160 2.160 C 6.313 1.599,7.567 1.397,8.853 1.563 M7.706 4.290 C 7.482 4.363,7.355 4.491,7.293 4.705 C 7.257 4.827,7.253 5.106,7.259 6.816 C 7.267 8.786,7.267 8.787,7.325 8.896 C 7.398 9.033,7.538 9.157,7.671 9.204 C 7.803 9.250,8.197 9.250,8.329 9.204 C 8.462 9.157,8.602 9.033,8.675 8.896 C 8.733 8.787,8.733 8.786,8.741 6.816 C 8.749 4.664,8.749 4.662,8.596 4.481 C 8.472 4.333,8.339 4.284,8.040 4.276 C 7.893 4.272,7.743 4.278,7.706 4.290 M7.786 10.530 C 7.597 10.592,7.410 10.753,7.319 10.932 C 7.249 11.072,7.237 11.325,7.294 11.495 C 7.388 11.780,7.697 12.000,8.000 12.000 C 8.303 12.000,8.612 11.780,8.706 11.495 C 8.763 11.325,8.751 11.072,8.681 10.932 C 8.616 10.804,8.460 10.646,8.333 10.580 C 8.217 10.520,7.904 10.491,7.786 10.530 "
                                  stroke="none"
                                  fill-rule="evenodd"
                                  fill="currentColor"
                                  data-darkreader-inline-fill=""
                                  data-darkreader-inline-stroke=""
                                ></path>
                              </g>
                            </svg>
                          </div>

                          <div className="text-left py-2 sm:py-0 sm:px-4">
                            <p className="text-red-100 font-semibold">
                              {session.message}
                            </p>
                            <p className="text-red-100 text-sm">
                              Please try again or contact support if the issue
                              persists.
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Location Details */}
                    <div className="space-y-4 mb-6 text-left">
                      {/* From Location */}
                      <div className="flex items-center space-x-3">
                        <div className="w-[2.4rem] text-orange-500">
                          <svg
                            viewBox="0 0 512 512"
                            version="1.1"
                            fill="currentColor"
                          >
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g
                              id="SVGRepo_tracerCarrier"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                              {" "}
                              <title>circle-dot-filled</title>{" "}
                              <g
                                id="Page-1"
                                stroke="none"
                                stroke-width="1"
                                fill="none"
                                fill-rule="evenodd"
                              >
                                {" "}
                                <g
                                  id="drop"
                                  fill="currentColor"
                                  transform="translate(42.666667, 42.666667)"
                                >
                                  {" "}
                                  <path
                                    d="M213.333333,3.55271368e-14 C331.15408,3.55271368e-14 426.666667,95.5125867 426.666667,213.333333 C426.666667,331.15408 331.15408,426.666667 213.333333,426.666667 C95.5125867,426.666667 3.55271368e-14,331.15408 3.55271368e-14,213.333333 C3.55271368e-14,95.5125867 95.5125867,3.55271368e-14 213.333333,3.55271368e-14 Z M213.333333,106.666667 C154.42296,106.666667 106.666667,154.42296 106.666667,213.333333 C106.666667,272.243707 154.42296,320 213.333333,320 C272.243707,320 320,272.243707 320,213.333333 C320,154.42296 272.243707,106.666667 213.333333,106.666667 Z"
                                    id="Combined-Shape"
                                  >
                                    {" "}
                                  </path>{" "}
                                </g>{" "}
                              </g>{" "}
                            </g>
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-200 text-md">From</div>
                          <div className="font-bold">
                            {session.from
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        </div>
                      </div>

                      {/* Line connector */}
                      <div className="ml-[1.1rem] w-[4px] rounded-lg h-10 bg-gray-200"></div>

                      {/* To Location */}
                      <div className="flex items-start space-x-3">
                        <div className="w-[2.4rem] text-green-500">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g
                              id="SVGRepo_tracerCarrier"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                              {" "}
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM14.1096 8.41878L15.592 9.90258C16.598 10.9095 17.1009 11.413 16.9836 11.9557C16.8662 12.4985 16.2003 12.7487 14.8684 13.2491L13.9463 13.5955C13.5896 13.7295 13.4113 13.7965 13.2736 13.9157C13.2134 13.9679 13.1594 14.027 13.1129 14.0918C13.0068 14.2397 12.9562 14.4236 12.855 14.7913C12.6249 15.6276 12.5099 16.0457 12.2359 16.202C12.1205 16.2679 11.9898 16.3025 11.8569 16.3023C11.5416 16.3018 11.2352 15.9951 10.6225 15.3818L10.1497 14.9086L8.531 16.5299C8.23835 16.823 7.76348 16.8234 7.47034 16.5308C7.17721 16.2381 7.17683 15.7632 7.46948 15.4701L9.08892 13.848C9.08871 13.8482 9.08914 13.8478 9.08892 13.848L8.64262 13.4C8.03373 12.7905 7.72929 12.4858 7.72731 12.1723C7.72645 12.0368 7.76164 11.9035 7.82926 11.786C7.98568 11.5145 8.40079 11.4 9.23097 11.1711C9.5993 11.0696 9.78346 11.0188 9.9315 10.9123C9.99792 10.8644 10.0583 10.8088 10.1114 10.7465C10.2298 10.6076 10.2956 10.4281 10.4271 10.069L10.7611 9.15753C11.2545 7.81078 11.5013 7.1374 12.0455 7.01734C12.5896 6.89728 13.0963 7.40445 14.1096 8.41878Z"
                                fill="currentColor"
                              ></path>{" "}
                            </g>
                          </svg>
                        </div>
                        <div>
                          <div className="text-gray-200 text-md">To</div>
                          <div className="font-bold">
                            {session.to
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-full max-h-[500px] rounded-3xl overflow-hidden bg-gray-600">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/directions?origin=${
                          session.from ? session.from : "UPES"
                        }&destination=${
                          session.to
                            ? session.to
                            : session.from
                            ? session.from
                            : "UPES"
                        }&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&mode=walking&zoom=18`}
                        className="h-full w-full min-h-[500px] border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    {/* Booker and Participant Details */}
                    <div className="w-full h-fit border-t border-gray-100 pt-4 mt-4">
                      <div className="bg-white/5 rounded-lg p-4 mb-4 ">
                        <h3 className="text-2xl font-bold text-left my-4">
                          Participant Details
                        </h3>
                        <div className="flex items-center justify-center gap-3">
                          {participant?.photoURL ? (
                            <img
                              src={participant.photoURL}
                              alt={participant.displayName}
                              className="w-[4rem] h-[4rem] md:w-[5rem] md:h-[5rem] rounded-full"
                            />
                          ) : (
                            <div className="w-[4rem] h-[4rem] md:w-[5rem] md:h-[5rem] rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-[1rem] md:text-[2rem] font-semibold text-white">
                                {participant?.displayName?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col justify-start items-start">
                            <p className="font-bold text-[1.2rem] md:text-[1.4rem]">
                              {participant?.displayName || "Unknown User"}
                            </p>
                            <p className="text-sm md:text-md text-gray-200 font-semibold">
                              {participant?.email || "No email available"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {booker && (
                        <div className="relative rounded-lg p-4 mb-4 bg-yellow-600/30 mt-8">
                          <div className="absolute -top-3 right-2 px-3 py-1 bg-yellow-700 border border-yellow-500/40 rounded-full">
                            <span className="text-yellow-200 text-sm font-medium flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              Booked by a friend
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-left my-4">
                            Booker Details
                          </h3>
                          <div className="flex items-center justify-center gap-3">
                            {booker?.photoURL ? (
                              <img
                                src={booker.photoURL}
                                alt={booker.displayName}
                                className="w-[4rem] h-[4rem] md:w-[5rem] md:h-[5rem] rounded-full"
                              />
                            ) : (
                              <div className="w-[4rem] h-[4rem] md:w-[5rem] md:h-[5rem] rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-[1rem] md:text-[2rem] font-semibold text-white">
                                  {booker?.displayName?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col justify-start items-start">
                              <p className="font-bold text-[1.2rem] md:text-[1.4rem]">
                                {booker?.displayName || "Unknown User"}
                              </p>
                              <p className="text-sm md:text-md text-gray-200 font-semibold">
                                {booker?.email || "No email available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Team Details (if applicable) */}
                    {session.team && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h3 className="text-2xl font-bold text-left my-4">
                          Team Details
                        </h3>
                        <div className="space-y-2 flex flex-col justify-between items-center mx-8">
                          <div className="flex justify-between items-center w-full h-fit">
                            <div className=" py-4 mt-1 mr-4 text-left">
                              <div className="text-gray-100 text-md">
                                Team Name
                              </div>
                              <div className="font-bold text-[1.2rem] capitalize">
                                {session.team.name}
                              </div>
                            </div>
                            <div className="text-right py-4 mt-1">
                              <div className="text-gray-100 text-md">
                                Team Size
                              </div>
                              <div className="font-semibold text-[1.2rem] capitalize">
                                {session.team.size} members
                              </div>
                            </div>
                          </div>

                          {session.team.notes && (
                            <div className="bg-white/5 py-4 rounded-lg w-full">
                              <span className="text-gray-400">Notes:</span>
                              <p className="mt-1 text-sm">
                                {session.team.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-6">
                      {session.state === "QUEUED" &&
                        userDetailsFirebase &&
                        (userDetailsFirebase.uid === session.bookingUserId ||
                          userDetailsFirebase.uid ===
                            session.bookingUserId) && (
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex-1"
                            onClick={() => setIsModalOpen(true)}
                          >
                            Cancel Session
                          </button>
                        )}
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 flex-1"
                        onClick={handleShare}
                      >
                        {showCopied ? (
                          <>
                            <Check size={16} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 size={16} />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
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
      </div>
    </div>
  );
};

export default SessionDetail;
