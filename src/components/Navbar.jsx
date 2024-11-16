import React from "react";

const Navbar = ({ userDetailsFirebase, logoutUser }) => {
  return (
    <nav className="w-full bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex justify-end items-center">
        {/* <div className="h-full w-fit justify-center items-start text-start">
          <div className="text-white font-bold text-2xl">U Tour</div>
          <div className="text-white text-[0.8rem] px-1">Your robot tour</div>
        </div> */}
        <div className="flex items-center gap-4">
          <div className="hidden xs:flex flex-col items-end text-white">
            <div className="font-semibold">
              {userDetailsFirebase?.displayName}
            </div>
            <div className="text-sm opacity-60">
              {userDetailsFirebase?.email}
            </div>
          </div>
          {userDetailsFirebase?.photoURL ? (
            <img
              className="w-10 h-10 rounded-full"
              src={userDetailsFirebase?.photoURL}
              alt="Profile"
            />
          ) : (
            <svg
              className="w-10 h-10 text-gray-200/80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              alt="Profile"
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
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>{" "}
                <path
                  d="M4.271 18.3457C4.271 18.3457 6.50002 15.5 12 15.5C17.5 15.5 19.7291 18.3457 19.7291 18.3457"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>{" "}
                <path
                  d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>{" "}
              </g>
            </svg>
          )}
          <button
            onClick={logoutUser}
            className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
