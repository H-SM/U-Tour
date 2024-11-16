import { Building2, MapPin, Navigation, Search } from "lucide-react";
import React from "react";

const Destination = ({ from, to, onFromChange, onToChange, locations }) => {
  return (
    <div className="w-full flex justify-between bg-white/10 backdrop-blur-md rounded-3xl px-6 py-4 border border-white/20 gap-4">
      <div className="flex flex-col justify-start items-start w-7/12 mb-2">
        <h2 className="text-white text-[1.5rem] font-bold mb-3">
          Book Your Robot Tour Guide
        </h2>
        <div className="bg-white/10 border border-white/20 rounded-[1rem] p-4 shadow-lg w-full">
          <div className="space-y-4">
            {/* Current Location */}
            <div className="flex items-center space-x-3 border-b border-gray-100 pb-4 w-full">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-500" />
              </div>
              <select
                name="from"
                value={from}
                onChange={onFromChange}
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

            {/* Destination Search */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-500" />
              </div>
              <select
                name="to"
                value={to}
                onChange={onToChange}
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
        </div>
      </div>
      {/* Right side - Status Display */}
      <div className="flex h-full w-5/12 justify-start items-end pb-2">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 w-full h-fit">
          <div className="flex flex-col items-center justify-center h-fit py-3">
              <div className="w-full space-y-4 px-2">
                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-start space-x-3">
                  <Navigation className="w-5 h-5 text-emerald-400 text-left" />
                  <div className="flex flex-col items-start justify-start">
                    <p className="text-white font-bold text-left">Sessions done today</p>
                    <p className="text-white/80 text-sm ">3 sessions</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-start space-x-3">
                <Building2 className="w-5 h-5 text-blue-400 text-left" />
                  <div className="flex flex-col items-start justify-start">
                  <p className="text-white text-sm font-bold text-left">Available Robots</p>
                  <p className="text-white/80 text-sm">3 robots nearby</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Destination;
