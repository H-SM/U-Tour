import React from "react";
import { User, Mail, Loader2 } from "lucide-react";

const SearchUser = ({ isOpen, onClose, searchResults, onSelect, isLoading }) => {
  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
      {isLoading ? (
        <div className="p-4 flex items-center justify-center text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span>Searching users...</span>
        </div>
      ) : searchResults.length !== 0 && (
        <ul className="divide-y divide-gray-100">
          {searchResults.map((user) => (
            <li
              key={user.uid}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                onSelect(user);
                onClose();
              }}
            >
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={getInitials(user.displayName) || user.email?.[0].toUpperCase()}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {user.displayName ? (
                    <>
                      <p className="text-sm text-left font-medium text-gray-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-900 truncate flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchUser;