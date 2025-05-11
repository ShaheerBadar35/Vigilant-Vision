//---FIRESTORE IMPLEMENTAION---
//-------------new alerts---------------
import React, { useState,useEffect  } from 'react';
import './Alerts.css';
import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc  } from 'firebase/firestore';

const AlertsHistory = [
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
  const [Alerts, setAlerts] = useState('');
  const [alertText, setAlertText] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 🔹 New loading state
  const [adminAlerts, setAdminAlerts] = useState([]);
  const [selectedAlertToDelete, setSelectedAlertToDelete] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [nonAdminAlerts, setNonAdminAlerts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertType, setAlertType] = useState('');


  const handleGenerate = () => {
    if (alertText.trim() === '') {
      alert('Enter an action');
      return;
    }
    setShowLocationPopup(true);
  };

  const handleLocationSubmit = async () => {
    if (location.trim() === '') {
      alert('Enter a location');
      return;
    }

    setIsLoading(true); // 🔹 Show loader

    try {
      await addDoc(collection(db, 'alerts'), {
        alert_type: "Test",
        camera_id: "Admin",
        detected_value: null,
        location_name: location,
        status: "pending",
        timestamp: Timestamp.now(),
        action: alertText
      });

      // Small timeout to simulate loader effect (optional)
      setTimeout(() => {
        alert('✅ Alert logged successfully!');
        setAlertText('');
        setLocation('');
        setShowLocationPopup(false);
        setIsLoading(false); // 🔹 Hide loader
      }, 500);
      fetchAdminAlerts();
    } catch (error) {
      console.error('Error writing alert:', error);
      alert('❌ Failed to log alert.');
      setIsLoading(false);
    }
  };

  const fetchAdminAlerts = async () => {
    try {
      const q = query(collection(db, 'alerts'), where('camera_id', '==', 'Admin'));
      const querySnapshot = await getDocs(q);
      const alertsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching admin alerts:', error);
    }
  };

  const fetchNonAdminAlerts = async () => {
    try {
      const q = query(collection(db, 'alerts'), where('camera_id', '!=', 'Admin'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNonAdminAlerts(data);
    } catch (error) {
      console.error("Error fetching non-admin alerts:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedAlertToDelete) return;
  
    setIsDeleting(true); // Show loader
  
    try {
      await deleteDoc(doc(db, 'alerts', selectedAlertToDelete.id));
  
      setAdminAlerts(prev => prev.filter(alert => alert.id !== selectedAlertToDelete.id));
      setNonAdminAlerts(prev => prev.filter(alert => alert.id !== selectedAlertToDelete.id));
  
      setShowDeletePopup(false);
      setSelectedAlertToDelete(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert.');
    }
  
    setIsDeleting(false); // Hide loader
  };
  

  useEffect(() => {
    fetchAdminAlerts();
    fetchNonAdminAlerts();
  }, []);

  return (
    <div className="alerts-container">
      <h2>Generate Alerts</h2>
      <div className="Alerts-box">
        <input
          type="text"
          placeholder="Enter Action..."
          value={alertText}
          onChange={(e) => setAlertText(e.target.value)}
          className="Alerts-input"
        />
        <button className="generate-button" onClick={handleGenerate} style={{ marginLeft: "10px" }}>
          Generate Alerts
        </button>
      </div>
    
    

      {showLocationPopup && (
  <div className="popup-overlay">
    <div className="popup">
      <h3>Enter Location</h3>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location name"
      />

      {/* Alert Type Dropdown */}
      <select
        value={alertType}
        onChange={(e) => setAlertType(e.target.value)}
        className="alert-type-dropdown"
      >
        <option value="">Select Alert Type</option>
        <option value="crowd">Crowd</option>
        <option value="queue">Queue</option>
        <option value="smoke">Smoke</option>
        <option value="mask">Mask</option>
        <option value="suspicious">Suspicious Activity</option>
        <option value="general">General</option>
      </select>

      <div className="popup-buttons">
        <button onClick={handleLocationSubmit} disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'OK'}
        </button>
        <button onClick={() => !isLoading && setShowLocationPopup(false)}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      <section className="recent-section">
        <h2>Admin Generated Alerts</h2>
        <div className="recent-list">
          {adminAlerts.map((alert, index) => (
            <div key={alert.id || index} className="recent-item">
              <span className="bell">🔔</span>
              <p>{alert.action}</p>
              <button className="edit-btn">Edit</button>
              <button className="delete-btn"
              >
              🗑️
            </button>              
            </div>
          ))}
        </div>
      </section>
      <section className="history-section">
        <h2>Alerts History</h2>
        <div className="history-header">
          <input type="text" className="search-input" placeholder="search" />
        </div>
        <table className="history-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {nonAdminAlerts.map((item) => (
              <tr key={item.id}>
                <td>{item.action}</td>
                <td>{item.alert_type}</td>
                <td>
                  <span className={`status ${item.status?.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.timestamp?.seconds
                    ? new Date(item.timestamp.seconds * 1000).toLocaleString()
                    : item.timestamp}
                </td>
                <td>{item.location_name}</td>
                <td>
                  <button className="edit-btn">Edit</button>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      setSelectedAlertToDelete(item);
                      setShowDeletePopup(true);
                    }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {showDeletePopup && (
      <div className="popup-overlay">
        <div className="popup">
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete this alert?</p>
          <div className="popup-buttons">
            <button onClick={handleDelete} className="delete-btn" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => {
                if (!isDeleting) {
                  setShowDeletePopup(false);
                  setSelectedAlertToDelete(null);
                }
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}      
    </div>
  );
};

export default Alerts;

