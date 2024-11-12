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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (signup) {
        if (credentials.password !== credentials.cpassword) {
          throw new Error("Passwords don't match");
        }
        await signUp(credentials.email, credentials.password, credentials.name);
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
      await signInWithGoogle();
      showAlert("Welcome to U Robot!", "success");
      navigate("/");
    } catch (error) {
      console.error("Google sign-in failed:", error.message);
      showAlert("Failed Google sign-in! Please Try again...", "alert");
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signInWithGithub();
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
    <div className="h-full w-full flex flex-col justify-start items-start text-text bg-gradient-to-b from-primary to-primary-grad">
      <div className="relative overflow-x-hidden overflow-y-auto w-full h-[100vh] flex flex-col justify-start items-center pb-[8rem]">
        <section className="mt-[3rem]">
          <div className="relative flex flex-col items-center justify-center px-6 py-8 h-fit lg:py-0">
            <div className="flex items-center mb-6">
              <div
                className="font-black textbackground text-transparent text-[4rem] bg-gradient-to-r from-border-gradient-left to-border-gradient-right bg-clip-text"
                style={{
                  textShadow: `
      0 0 20px rgba(255, 255, 255, 0.1),
      0 0 30px rgba(255, 255, 255, 0.1)
    `,
                }}
              >
                U ROBOT
              </div>
            </div>
            <div className="flex flex-col justify-center items-center w-fit h-fit p-[2px] bg-gradient-to-r from-border-gradient-left to-border-gradient-right rounded-[1.2rem] gap-[2px] shadow-2xl shadow-border-gradient-left/20">
              <div className="z-10 w-[35rem] h-fit bg-background-primary rounded-[1.1rem] flex flex-wrap justify-evenly items-center py-[2rem] gap-y-[2rem]">
                <div className="p-6 space-y-4 md:space-y-6 sm:p-8 w-[35rem]">
                  <h1 className="text-xl font-bold leading-tight tracking-tight font-natosans md:text-2xl text-text">
                    {signup ? "Create a new account" : "Login to your account"}
                  </h1>
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 md:space-y-6"
                  >
                    {signup && (
                      <div className="w-full h-[5rem]">
                        <label
                          htmlFor="name"
                          className="block mb-2 text-sm font-medium text-text"
                        >
                          Your name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          className="border-[2px] border-border-secondary bg-transparent transition ease-in-out duration-150 outline-none sm:text-sm rounded-lg focus-visible:bg-white/10 focus-visible:ring-2 focus:ring-border-gradient-right focus:border-none block w-full p-2.5"
                          placeholder="Your name"
                          onChange={onChange}
                          minLength={3}
                          required
                        />
                      </div>
                    )}
                    <div className="w-full h-[5rem]">
                      <label
                        htmlFor="email"
                        className="block mb-2 text-sm font-medium text-text"
                      >
                        Your email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="border-[2px] border-border-secondary bg-transparent transition ease-in-out duration-150 outline-none sm:text-sm rounded-lg focus-visible:bg-white/10 focus-visible:ring-2 focus:ring-border-gradient-right focus:border-none block w-full p-2.5"
                        placeholder="email@example.com"
                        onChange={onChange}
                        required
                      />
                    </div>
                    <div className="relative w-full h-[5rem]">
                      <label
                        htmlFor="password"
                        className="block mb-2 text-sm font-medium text-text"
                      >
                        Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        placeholder={showPassword ? "password" : "••••••••"}
                        className="border-[2px] border-border-secondary bg-transparent transition ease-in-out duration-150 outline-none sm:text-sm rounded-lg focus-visible:bg-white/10 focus-visible:ring-2 focus:ring-border-gradient-right focus:border-none block w-full p-2.5"
                        onChange={onChange}
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-[45%] text-[#fff] focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg
                            className="w-6 h-6 text-text-inactive hover:text-text transition ease-in-out duration-150"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 18"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M1.933 10.909A4.357 4.357 0 0 1 1 9c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 19 9c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M2 17 18 1m-5 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 text-text-inactive hover:text-text transition ease-in-out duration-150"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 14"
                          >
                            <g
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            >
                              <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                              <path d="M10 13c4.97 0 9-2.686 9-6s-4.03-6-9-6-9 2.686-9 6 4.03 6 9 6Z" />
                            </g>
                          </svg>
                        )}
                      </button>
                    </div>
                    {signup && (
                      <div className="w-full h-[5rem]">
                        <label
                          htmlFor="cpassword"
                          className="block mb-2 text-sm font-medium text-text"
                        >
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="cpassword"
                          id="cpassword"
                          placeholder="••••••••"
                          className="border-[2px] border-border-secondary bg-transparent transition ease-in-out duration-150 outline-none sm:text-sm rounded-lg focus-visible:bg-white/10 focus-visible:ring-2 focus:ring-border-gradient-right focus:border-none block w-full p-2.5"
                          onChange={onChange}
                          minLength={6}
                          required
                        />
                      </div>
                    )}
                    {!signup && (
                      <div className="flex items-center justify-center w-full">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full text-white bg-background-secondary hover:bg-chart-background hover:ring-2 hover:outline-none hover:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center transition ease-in-out duration-150"
                    >
                      {signup ? "Sign up" : "Log in"}
                    </button>
                  </form>
                  <div className="my-6 mx-2">
                    <div className="relative">
                      <div className="absolute inset-0 flex justify-between items-center">
                        <div className="w-[45%] border-t border-gray-300/30" />
                        <div className="w-[45%] border-t border-gray-300/30" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-transparent px-2 text-text">
                          OR
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="inline-flex w-full justify-center rounded-md bg-transparent px-4 py-2 text-gray-500 shadow-sm ring-1 ring-primary-white ring-opacity-10 hover:bg-white/10 transition ease-in-out"
                      >
                        <BsGoogle />
                      </button>
                      <button
                        type="button"
                        onClick={handleGithubSignIn}
                        className="inline-flex w-full justify-center rounded-md bg-transparent px-4 py-2 text-gray-500 shadow-sm ring-1 ring-primary-white ring-opacity-10 hover:bg-white/10 transition ease-in-out"
                      >
                        <BsGithub />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-light flex flex-row items-center justify-center gap-1 font-natosans text-text">
                    <p>
                      {signup
                        ? "Already have an account? "
                        : "Don't have an account yet? "}
                    </p>
                    <p
                      onClick={() => setSignup(!signup)}
                      className="font-medium text-primary-600 hover:underline hover:cursor-pointer select-none"
                    >
                      {signup ? "Log in" : "Sign up"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
