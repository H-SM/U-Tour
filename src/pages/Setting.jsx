import React, { useContext, useEffect, useState } from "react";
import {
  updateProfile,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";
import ContextValue from "../context/EventContext";
import { useNavigate } from "react-router-dom";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import SideNavbar from "../components/SideNavbar";
import Navbar from "../components/Navbar";
import { SendHorizontal, UserCircleIcon } from "lucide-react";
import CloudinaryUploadWidget from "../components/Settings/CloudinaryUpload";

const Setting = ({ isExpanded, setIsExpanded, showAlert }) => {
  const { userDetailsFirebase, setUserDetailsFirebase } =
    useContext(ContextValue);
  const { checkAuth, signOutUser, forgotPassword } = useFirebaseAuth();
  const navigate = useNavigate();

  // Form states
  const [displayName, setDisplayName] = useState(
    userDetailsFirebase?.displayName || ""
  );
  const [email, setEmail] = useState(userDetailsFirebase?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(userDetailsFirebase?.photoURL || "");
  const [loading, setLoading] = useState(false);

  // Update profile information
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {};
      if (displayName !== userDetailsFirebase?.displayName) {
        updates.displayName = displayName;
      }
      if (photoURL !== userDetailsFirebase?.photoURL) {
        updates.photoURL = photoURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(auth.currentUser, updates);
        setUserDetailsFirebase({
          ...userDetailsFirebase,
          ...updates,
        });
        showAlert("Profile updated successfully!", "success");
      }
    } catch (error) {
      showAlert("Failed to update profile: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (userDetailsFirebase.email) {
      try {
        await forgotPassword(userDetailsFirebase.email);
        showAlert("Password reset email sent!", "success");
      } catch (error) {
        console.error("Password reset failed:", error.message);
        showAlert("Failed to send reset email. Please try again.", "alert");
      }
    } else {
      showAlert("Please enter your email address", "alert");
    }
  };

  // Update email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentPassword) {
        throw new Error("Current password is required to update email");
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update email
      await updateEmail(auth.currentUser, email);
      setUserDetailsFirebase({
        ...userDetailsFirebase,
        email: email,
      });
      showAlert("Email updated successfully!", "success");
      setCurrentPassword("");
    } catch (error) {
      showAlert("Failed to update email: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentPassword || !newPassword) {
        throw new Error("Both current and new passwords are required");
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);
      showAlert("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      showAlert("Failed to update password: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    signOutUser();
    setUserDetailsFirebase(null);
    navigate("/login");
  };

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const user = await checkAuth();
        if (!user) {
          navigate("/login");
        }
        setPhotoURL(user?.photoURL || "");
        setDisplayName(user?.displayName || "");
      } catch (error) {
        console.error("Authentication error:", error);
        showAlert("Authentication error: " + error.message, "error");
      }
    };
    authenticateUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <SideNavbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <div className="w-full min-h-screen backdrop-blur-sm">
          <Navbar
            userDetailsFirebase={userDetailsFirebase}
            logoutUser={logoutUser}
          />

          <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">
              Account Settings
            </h1>

            {/* Profile Information Form */}
            <form
              onSubmit={handleUpdateProfile}
              className="mb-8 bg-white/10 p-6 rounded-lg"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-2 rounded bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Profile Picture
                  </label>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 py-4 rounded bg-white/5 border border-white/20 text-white">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        className="w-[15vh] h-[15vh] rounded-full object-fill"
                        alt="pfp"
                      />
                    ) : (
                      <UserCircleIcon
                        className="h-[15vh] w-[15vh] text-white/80"
                        aria-hidden="true"
                      />
                    )}
                      <CloudinaryUploadWidget
                        showAlert={showAlert}
                        setPhotoURL={setPhotoURL}
                      />
                  </div>
                  {/* <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full p-2 rounded bg-white/5 border border-white/20 text-white"
                  /> */}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  Update Profile
                </button>
              </div>
            </form>

            {/* Email Update Form */}
            <form
              onSubmit={handleUpdateEmail}
              className="mb-8 bg-white/10 p-6 rounded-lg"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Update Email
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    New Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 rounded bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  Update Email
                </button>
              </div>
            </form>

            {/* Password Update Form */}
            <form
              onSubmit={handleUpdatePassword}
              className="mb-8 bg-white/10 p-6 rounded-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Update Password
                </h2>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <SendHorizontal className="w-4 h-4" />
                  <span>Forgot Password</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 rounded bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 rounded bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
