import React, { useState } from "react";
import SessionCard from "./SessionCard";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center p-12 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
    <div className="w-16 h-16 mb-4 text-white/60">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">No Sessions Found</h3>
    <p className="text-gray-300 text-center mb-6">
      Start exploring our robot services to begin your journey
    </p>
    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
      Explore Robot Services
    </button>
  </div>
);

const SessionsDisplay = ({ sessions, stats }) => {
  // Separate and sort sessions
  const activeSessions = sessions
    .filter((session) => ["ACTIVE", "QUEUED"].includes(session.state))
    .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

  const historySessions = sessions
    .filter((session) => ["DONE", "CANCEL", "ERROR"].includes(session.state))
    .sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime));

  // Check if there are any sessions at all
  if (sessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Stats Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">Session Overview</h2>
        <div className="flex flex-wrap justify-center items-start gap-2">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20 w-[15rem]">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Total</h3>
            <p className="text-2xl font-bold text-white">
              {stats.totalSessions}
            </p>
          </div>
          {stats.sessionsByState.map((stat) => (
            <div
              key={stat.state}
              className="bg-white/10 rounded-xl p-4 border border-white/20 w-[15rem]"
            >
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {stat.state}
              </h3>
              <p className="text-2xl font-bold text-white">{stat._count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sessions Section */}
      {activeSessions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-left">
            Your Active Sessions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      {historySessions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-left">History</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {historySessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsDisplay;
