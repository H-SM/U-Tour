import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import './App.css'

import Home from "./pages/Home";
import Alert from "./components/alert";
import Login from "./pages/Login";
import SampleHome from "./pages/SampleHome";

function App() {
  const [alert, setAlert] = useState(null);

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
            <Route exact path="/" element={<SampleHome  showAlert={showAlert}/>} />
            <Route exact path="/login" element={<Login showAlert={showAlert}/>} />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </Router>
      </div>
  )
}

export default App
