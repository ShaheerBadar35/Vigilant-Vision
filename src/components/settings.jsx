import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [form, setForm] = useState({
    crowdThreshold: '',
    cooldownSeconds: '',
    maskDetection: 'mask',
    cameraLocation1: '',
    cameraLocation2: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/set_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: form.crowdThreshold,
          cooldown: form.cooldownSeconds,
          mask_mode: form.maskDetection,
          location_camera_1: form.cameraLocation1,
          location_camera_2: form.cameraLocation2
        })
      });
      const result = await response.json();
      alert("✅ Settings saved!");
      console.log(result);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("❌ Failed to save settings.");
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>
        <form className="settings-form">

          <div className="form-group tooltip-container">
            <label htmlFor="crowdThreshold">Crowd Detection Threshold</label>
            <input
              type="number"
              name="crowdThreshold"
              id="crowdThreshold"
              value={form.crowdThreshold}
              onChange={handleChange}
              placeholder="Enter max number of people"
            />
            <span className="tooltip-text">
              Maximum number of people on which alerts won’t be detected
            </span>
          </div>

          <div className="form-group tooltip-container">
            <label htmlFor="cooldownSeconds">Cooldown Seconds</label>
            <input
              type="number"
              name="cooldownSeconds"
              id="cooldownSeconds"
              value={form.cooldownSeconds}
              onChange={handleChange}
              placeholder="Enter cooldown in seconds"
            />
            <span className="tooltip-text">
              Number of seconds on which alerts won’t be sent
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="maskDetection">Mask or No Mask</label>
            <select
              name="maskDetection"
              id="maskDetection"
              value={form.maskDetection}
              onChange={handleChange}
            >
              <option value="mask">Detect Mask</option>
              <option value="no-mask">Detect No Mask</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cameraLocation1">Location for Camera 1</label>
            <input
              type="text"
              name="cameraLocation1"
              id="cameraLocation1"
              value={form.cameraLocation1}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cameraLocation2">Location for Camera 2</label>
            <input
              type="text"
              name="cameraLocation2"
              id="cameraLocation2"
              value={form.cameraLocation2}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </div>
          <button className="save-btn" onClick={handleSubmit}>Save Settings</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
