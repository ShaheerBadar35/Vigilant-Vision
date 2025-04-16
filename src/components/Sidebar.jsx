import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import logo from "../assets/logo/logo.png"; 
import Home from "../assets/icons/Home.png"; 
import Alerts from "../assets/icons/Alerts.png"; 
import Settings from "../assets/icons/Settings.png"; 

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Vigilant Vision Logo" className="sidebar-logo" />
      </div>
      <div className="admin-panel">
        
      </div>
      <ul className="menu">
        <div className="Row-Menu">
          <img src={Home} alt="Home Icon" className = "Icon"/>
          <li><Link to="/my-library" className="menu-link">Home</Link></li>
        </div>
        <div className="Row-Menu">
          <img src={Alerts} alt ="Alerts Icon" className="Icon"/> 
          <li><Link to="/alerts" className="menu-link">Alerts</Link></li>
        </div>
        <div className="Row-Menu">
          <img src={Settings} alt ="Settings Icon" className="Icon"/>
          <li><Link to="/settings" className="menu-link">Settings</Link></li>
        </div>
        
        {/* <li><Link to="/settings" className="menu-link">Settings</Link></li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
