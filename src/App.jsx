import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import Alert from "./components/alert";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";

function App() {
  const [alert, setAlert] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const showAlert = (message, type) => {
    setAlert({
      msg: message,
      type: type,
    });
    setTimeout(() => {
      setAlert(null);
    }, 2000);
  };

  return (
    <div className="text-center h-[100%] bg-background">
      <Alert alert={alert} setAlert={setAlert} />
      <Router>
        <Routes>
          {/* <Route exact path="/dashboard" element={} /> */}
          <Route
            exact
            path="/"
            element={
              <Home
                showAlert={showAlert}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
              />
            }
          />
          <Route
            exact
            path="/login"
            element={<Login showAlert={showAlert} />}
          />
          <Route
            exact
            path="/sessions"
            element={
              <Sessions isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
            }
          />
          <Route path="/sessions/:sessionId" element={<SessionDetail isExpanded={isExpanded} setIsExpanded={setIsExpanded} />} />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
