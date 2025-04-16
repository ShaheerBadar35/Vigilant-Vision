import React, { useState } from "react";
import { FaHome, FaBell, FaCog, FaUserFriends, FaSignOutAlt, } from "react-icons/fa";
import "./NewSidebar.css";
import logo from "../assets/logo/logo.png"; 
import { Link, useLocation } from "react-router-dom";


const Sidebar = () => {
  
  const location = useLocation();

  const menuItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/my-library" },
    { icon: <FaBell />, label: "Alerts", badge: 3, path: "/alerts" },
    { icon: <FaCog />, label: "Settings", path: "" },
    { icon: <FaUserFriends />, label: "About Us", path: "/" },
  ];

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Vigilant Vision Logo" className="sidebar-logo" />
      </div>

      {/* Admin Panel */}
      <div className="admin-panel">
        <div className="admin-header"> 
          <h2>Admin’s Panel</h2>
        </div>
        <p>1 member</p>
      </div>
       
      <div className="admin-dropdown">
        <div className="member">Maryam Shahid</div>
      </div>

      <ul className="menu">
        {menuItems.map((item) => (
          <Link to={item.path} key={item.label} className="menu-link">
            <li className={location.pathname === item.path ? "active" : ""}>
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </li>
          </Link>
        ))}
      </ul>

      {/* Signout Section */}
      <div className="signout">
        <p>Sign Out</p>
        <button className="signout-button">
          <FaSignOutAlt className="signout-icon" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

