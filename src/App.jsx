import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/NewSidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Alerts from "./components/Alerts";
import Analytics from './components/Analytics';
import Settings from "./components/settings"; 
import AboutUs from "./components/AboutUs"; 
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app">
        <Sidebar />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<AboutUs />} /> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} /> 
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
