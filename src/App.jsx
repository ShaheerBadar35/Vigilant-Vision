// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/NewSidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Alerts from "./components/Alerts";
import Settings from "./components/settings"; // Assuming you have a Settings component
import AboutUs from "./components/AboutUs"; // Assuming you have a HomePage component
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app">
        {/* Sidebar */}
        <Sidebar />

        <div className="main-content">
          {/* Navbar (if you want it) */}
          {/* <Navbar /> */}

          {/* Routes */}
          <Routes>
            {/* Add a home page route */}
            <Route path="/" element={<AboutUs />} /> {/* Home page route */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
