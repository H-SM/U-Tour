import React, { useState } from "react";

const Destination = ({ from, to, onFromChange, onToChange, locations }) => {
  return (
    <div className="w-full flex justify-between bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 ">
      <h2 className="text-white text-3xl font-bold mb-8">
        Book Your Robot Tour Guide
      </h2>
      <div className="flex flex-col items-start justify-start w-11/12">
        <div className="space-y-2 w-full px-4">
          <label className="text-white text-sm font-medium">From</label>
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

        <div className="space-y-2 w-full px-4">
          <label className="text-white text-sm font-medium">To</label>
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
  );
};

export default Destination;
