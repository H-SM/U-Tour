import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsGithub, BsGoogle } from "react-icons/bs";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import ContextValue from "../context/EventContext";

const Login = ({ showAlert }) => {
  const navigate = useNavigate();
  const { UserDetailsFirebase } = useContext(ContextValue);
  const { signUp, signIn, signInWithGoogle, signInWithGithub, forgotPassword } =
    useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    name: "",
    cpassword: "",
  });
  const [signup, setSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const migrateUser = async (email, firebaseUid) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/migrate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firebaseUid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Migration failed');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('User migration failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (signup) {
        if (credentials.password !== credentials.cpassword) {
          throw new Error("Passwords don't match");
        }
        // Sign up the user with Firebase
        const userCredential = await signUp(credentials.email, credentials.password, credentials.name);
        console.log(userCredential);
        // After successful signup, attempt to migrate user data
        try {
          const res = await migrateUser(credentials.email, userCredential.uid);
          console.log("Migration result:", res);
        } catch (migrationError) {
          // Still continue with signup even if migration fails
          console.error("Migration failed:", migrationError);
        }
        showAlert("Welcome to U Robot!", "success");
        navigate("/");
      } else {
        await signIn(credentials.email, credentials.password);
        showAlert("Welcome to U Robot!", "success");
        navigate("/");
      }
    } catch (error) {
      showAlert("Invalid Credentials! Please Try again...", "alert");
      console.error("Authentication failed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      console.log("Google sign-in result:", result);
      await migrateUser(result.email, result.uid);
      showAlert("Welcome to U Robot!", "success");
      navigate("/");
    } catch (error) {
      console.error("Google sign-in failed:", error.message);
      showAlert("Failed Google sign-in! Please Try again...", "alert");
    }
  };

  const handleGithubSignIn = async () => {
    try {
      const result = await signInWithGithub();
      await migrateUser(result.email, result.uid);
      showAlert("Welcome to U Robot!", "success");
      navigate("/");
    } catch (error) {
      console.error("Github sign-in failed:", error.message);
      showAlert("Failed Github sign-in! Please Try again...", "alert");
    }
  };

  const handleForgotPassword = async () => {
    if (credentials.email) {
      try {
        await forgotPassword(credentials.email);
        showAlert("Password reset email sent!", "success");
      } catch (error) {
        console.error("Password reset failed:", error.message);
        showAlert("Failed to send reset email. Please try again.", "alert");
      }
    } else {
      showAlert("Please enter your email address", "alert");
    }
  };

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-b from-primary to-primary-grad px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 
            className="font-black text-transparent text-4xl md:text-5xl bg-gradient-to-r from-border-gradient-left to-border-gradient-right bg-clip-text"
            style={{
              textShadow: `
                0 0 20px rgba(255, 255, 255, 0.05),
                0 0 30px rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            U TOUR
          </h1>
        </div>
        
        <div className="bg-gradient-to-r from-border-gradient-left to-border-gradient-right p-[2px] rounded-xl shadow-2xl">
          <div className="bg-background-primary rounded-xl p-6 md:p-8 text-white/80">
            <h2 className="text-xl md:text-2xl font-bold text-text mb-6">
              {signup ? "Create a new account" : "Login to your account"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {signup && (
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm text-text">
                    Your name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="w-full p-2.5 border-2 border-border-secondary bg-transparent rounded-lg focus:ring-2 focus:ring-border-gradient-right"
                    placeholder="Your name"
                    onChange={onChange}
                    minLength={3}
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block mb-2 text-sm text-text">
                  Your email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="w-full p-2.5 border-2 border-border-secondary bg-transparent rounded-lg focus:ring-2 focus:ring-border-gradient-right"
                  placeholder="email@example.com"
                  onChange={onChange}
                  required
                />
              </div>
              
              <div className="relative">
                <label htmlFor="password" className="block mb-2 text-sm text-text">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder={showPassword ? "password" : "••••••••"}
                  className="w-full p-2.5 border-2 border-border-secondary bg-transparent rounded-lg focus:ring-2 focus:ring-border-gradient-right"
                  onChange={onChange}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-[55%] text-text-inactive hover:text-text"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 20 18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.933 10.909A4.357 4.357 0 0 1 1 9c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 19 9c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M2 17 18 1m-5 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 20 14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13c4.97 0 9-2.686 9-6s-4.03-6-9-6-9 2.686-9 6 4.03 6 9 6Z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {signup && (
                <div>
                  <label htmlFor="cpassword" className="block mb-2 text-sm text-text">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="cpassword"
                    id="cpassword"
                    placeholder="••••••••"
                    className="w-full p-2.5 border-2 border-border-secondary bg-transparent rounded-lg focus:ring-2 focus:ring-border-gradient-right"
                    onChange={onChange}
                    minLength={6}
                    required
                  />
                </div>
              )}
              
              {!signup && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-2.5 bg-background-secondary hover:bg-chart-background rounded-lg text-white transition duration-150"
              >
                {signup ? "Sign up" : "Log in"}
              </button>
            </form>
            
            <div className="my-6">
              <div className="relative flex items-center justify-center">
                <div className="flex-grow border-t border-gray-300/30"></div>
                <span className="px-3 text-text bg-transparent">OR</span>
                <div className="flex-grow border-t border-gray-300/30"></div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  className="flex-1 py-2 rounded-md bg-transparent ring-1 ring-primary-white hover:bg-white/10"
                >
                  <BsGoogle className="mx-auto" />
                </button>
                <button
                  onClick={handleGithubSignIn}
                  className="flex-1 py-2 rounded-md bg-transparent ring-1 ring-primary-white hover:bg-white/10"
                >
                  <BsGithub className="mx-auto" />
                </button>
              </div>
            </div>
            
            <div className="text-center text-sm text-text">
              <p>
                {signup
                  ? "Already have an account? "
                  : "Don't have an account yet? "}
                <span
                  onClick={() => setSignup(!signup)}
                  className="font-medium text-primary-600 hover:underline cursor-pointer"
                >
                  {signup ? "Log in" : "Sign up"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
