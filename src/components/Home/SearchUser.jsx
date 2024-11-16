import React from "react";
import { MapPin, Clock, Mail, Users, User, Search, X } from "lucide-react";

const SearchUser = ({ isOpen, onClose, searchResults, onSelect }) => {
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

export default SearchUser;
