// -------------old alerts page--------------------
// import React, { useEffect, useState } from "react";
// import "./Alerts.css";

// const Alerts = () => {
//   const [alerts, setAlerts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAlerts = async () => {
//       try {
//         const response = await fetch("http://127.0.0.1:5000/alerts"); // Ensure this is the correct API URL
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         const data = await response.json();
//         setAlerts(data);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching alerts:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchAlerts();
//   }, []);

//   const getAlertStyle = (alertType) => {
//     switch (alertType) {
//       case "Crowd":
//         return { backgroundColor: "rgba(255, 0, 0, 0.1)", color: "red" };
//       case "No-Mask":
//         return { backgroundColor: "rgba(255, 255, 0, 0.1)", color: "yellow" };
//       case "Smoking":
//         return { backgroundColor: "rgba(0, 0, 255, 0.1)", color: "blue" };
//       case "No-Queue":
//         return { backgroundColor: "rgba(0, 255, 0, 0.1)", color: "green" };
//       default:
//         return { backgroundColor: "rgba(0, 0, 0, 0.1)", color: "black" };
//     }
//   };

//   if (loading) {
//     return <div>Loading alerts...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <div className="alerts">
//       <h1>Alerts</h1>
//       <div className="alerts-content">
//         {alerts.length === 0 ? (
//           <div>No alerts to show.</div>
//         ) : (
//           alerts.map((alert) => (
//             <div
//               key={alert.camera_id}
//               className="alert-item"
//               style={getAlertStyle(alert.alert_type)} // Apply dynamic style based on alert type
//             >
//               <div className="alert-title">
//                 <strong>{alert.alert_type}</strong> alert in{" "}
//                 <strong>{alert.location_name}</strong>:{" "}
//                 <em>Detected {alert.detected_value} people</em>
//               </div>
//               <span className="alert-time">
//                 Timestamp: {new Date(alert.timestamp).toLocaleString()}
//               </span>
//               {alert.image && (
//                 <div className="alert-image">
//                   <img
//                     src={`data:image/jpeg;base64,${alert.image}`}
//                     alt="Alert"
//                     style={{ width: "200px", height: "auto" }}
//                   />
//                 </div>
//               )}
              
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default Alerts;


//-------------new alerts---------------
import React, { useState } from 'react';
import './Alerts.css';

const recentMessages = [
  "Ladis log ki jaga nhi hai.",
  "I'm just a chill guy.",
  "hello, mall mein aag laggyi hai.",
  "jaani jaga nhi hai mat jana.",
  "BHUT RUSH HAI!!!",
  "Pachtaoge jaake."
];

const notificationHistory = [
  {
    id: 1,
    sender: "Emma Ryan Jr.",
    avatar: "https://i.pravatar.cc/40?img=1",
    type: "Smoke",
    status: "Pending",
    date: "Feb 19th, 2023"
  },
  {
    id: 2,
    sender: "Adrian Daren",
    avatar: "https://i.pravatar.cc/40?img=2",
    type: "WebCam",
    status: "Done",
    date: "Feb 18th, 2023"
  },
  {
    id: 3,
    sender: "Roxanne Hills",
    avatar: "https://i.pravatar.cc/40?img=3",
    type: "Queue",
    status: "Done",
    date: "Apr 16th, 2023"
  }
];

const Alerts = () => {
  const [notification, setNotification] = useState('');

  const handleGenerate = () => {
    if (notification.trim() === '') return;
    alert(`Notification Generated: ${notification}`);
    setNotification('');
  };

  return (
    <div className="alerts-container">
      <h2>Generate Notifications</h2>
      <div className="notification-box">
        
        <input
          type="text"
          placeholder="Enter Notification..."
          value={notification}
          onChange={(e) => setNotification(e.target.value)}
          className="notification-input"
        />
        <button className="generate-button" onClick={handleGenerate}>
          Generate Notification
        </button>
      </div>
      <section className="recent-section">
        <h2>Recent Notification</h2>
        <div className="recent-list">
          {recentMessages.map((msg, index) => (
            <div key={index} className="recent-item">
              <span className="bell">🔔</span>
              <p>{msg}</p>
              <button className="edit-btn">Edit</button>
              <button className="delete-btn">🗑️</button>
            </div>
          ))}
        </div>
      </section>

      <section className="history-section">
        <h2>Notification History</h2>
        <div className="history-header">
          <input type="text" className="search-input" placeholder="search" />
        </div>
        <table className="history-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Sender</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notificationHistory.map(item => (
              <tr key={item.id}>
                <td><input type="checkbox" /></td>
                <td className="sender-cell">
                  <img src={item.avatar} alt={item.sender} />
                  <span>{item.sender}</span>
                </td>
                <td>{item.type}</td>
                <td>
                  <span className={`status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.date}</td>
                <td>
                  <button className="edit-btn">Edit</button>
                  <button className="delete-btn">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Alerts;

