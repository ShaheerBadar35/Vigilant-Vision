/*
import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [form, setForm] = useState({
    crowdThreshold: '',
    cooldownSeconds: '',
    maskDetection: 'mask',
    cameraLocation1: '',
    cameraLocation2: '',
  });

  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

useEffect(() => {
  const savedSettings = JSON.parse(sessionStorage.getItem('settingsForm'));
  if (savedSettings) {
    setForm(savedSettings);
  }
  setHasLoadedSettings(true);
}, []);

useEffect(() => {
  if (hasLoadedSettings) {
    sessionStorage.setItem('settingsForm', JSON.stringify(form));
  }
}, [form, hasLoadedSettings]);



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

      // ✅ Save to localStorage
      sessionStorage.setItem('settingsForm', JSON.stringify(form));

      
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
      <h2>Settings</h2>
      <div className="settings-content">
        
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
              min="0"
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
              min="0"
              step="10"
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
*/

/*
import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [form, setForm] = useState({
    crowdThreshold: '',
    cooldownSeconds: '',
    maskDetection: 'mask',
    cameraLocation1: '',
    cameraLocation2: '',
  });

  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

useEffect(() => {
  const savedSettings = JSON.parse(sessionStorage.getItem('settingsForm'));
  if (savedSettings) {
    setForm(savedSettings);
  }
  setHasLoadedSettings(true);
}, []);

useEffect(() => {
  if (hasLoadedSettings) {
    sessionStorage.setItem('settingsForm', JSON.stringify(form));
  }
}, [form, hasLoadedSettings]);



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

      // ✅ Save to localStorage
      sessionStorage.setItem('settingsForm', JSON.stringify(form));

      
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
      <h2>Settings</h2>
      <div className="settings-content">
        <div className="selection-container">
        <h3>Model Configuration</h3>
        
        <form className="settings-form">
          <p>Select the active detection model (Mask or No-Mask) and set maximum crowd threshold for triggering alerts.</p>
          

          <div className="form-group tooltip-container">
            <label htmlFor="crowdThreshold">Crowd Detection Threshold</label>
            <input
              type="number"
              name="crowdThreshold"
              id="crowdThreshold"
              value={form.crowdThreshold}
              onChange={handleChange}
              placeholder="Enter max number of people"
              min="0"
            />
            <span className="tooltip-text">
              Maximum number of people on which alerts won’t be detected
            </span>
          </div>

          
          <div className="form-group">
            <label htmlFor="maskDetection">Detection Model</label>
            <select
              name="maskDetection"
              id="maskDetection"
              value={form.maskDetection}
              onChange={handleChange}
            >
              <option value="mask">Detect Mask</option>
              <option value="no-mask">Detect No-Mask</option>
            </select>
          </div>
          
          </form>
        </div>

        <form className='selection-container'>
          <h3>Alert Configuration</h3>
          <div className='settings-form'>
            <p>Define the cooldown duration (in seconds) to avoid repeated alerts within a short time frame.</p>

          <div className="form-group tooltip-container">
            <label htmlFor="cooldownSeconds">Cooldown Seconds</label>
            <input
              type="number"
              name="cooldownSeconds"
              id="cooldownSeconds"
              value={form.cooldownSeconds}
              onChange={handleChange}
              placeholder="Enter cooldown in seconds"
              min="0"
              step="10"
            />
            <span className="tooltip-text">
              Number of seconds on which alerts won’t be sent
            </span>
          </div>
          </div>
        </form>

        <form className='selection-container'>
        <h3>WebCamera Location</h3>
          <div className='settings-form'>
            <p>Enter location of each webcam for easy alert identification.</p>
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
           </div>
        </form>
        <div className='save-btn-container'>
          <button className="save-btn" onClick={handleSubmit}>Save</button>
          </div>
        
      </div>
    </div>
  );
};


export default Settings;
*/

import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [form, setForm] = useState({
    crowdThreshold: '',
    cooldownSeconds: '',
    maskDetection: 'mask',
    cameraLocation1: '',
    cameraLocation2: '',
  });

  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('model'); // model or location

  useEffect(() => {
    const savedSettings = JSON.parse(sessionStorage.getItem('settingsForm'));
    if (savedSettings) {
      setForm(savedSettings);
    }
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (hasLoadedSettings) {
      sessionStorage.setItem('settingsForm', JSON.stringify(form));
    }
  }, [form, hasLoadedSettings]);

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
      sessionStorage.setItem('settingsForm', JSON.stringify(form));
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
      <h2>Settings</h2>
      <p>Set or update settings for your surveillance system. </p>
      <p></p>

      
      <div className="settings-navbar">
        <button
          className={activeTab === 'model' ? 'active' : ''}
          onClick={() => setActiveTab('model')}
        >
          Model
        </button>
        <button
          className={activeTab === 'location' ? 'active' : ''}
          onClick={() => setActiveTab('location')}
        >
          Location
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'model' && (
          <>
            <div className="selection-container">
              <h3>Model Configuration</h3>
              <form className="settings-form">
                <p>Select the active detection model (Mask or No-Mask) and set maximum crowd threshold for triggering alerts.</p>

                <div className="form-group tooltip-container">
                  <label htmlFor="crowdThreshold">Crowd Detection Threshold</label>
                  <input
                    type="number"
                    name="crowdThreshold"
                    id="crowdThreshold"
                    value={form.crowdThreshold}
                    onChange={handleChange}
                    placeholder="Enter max number of people"
                    min="0"
                  />
                  <span className="tooltip-text">
                    Maximum number of people on which alerts won’t be detected
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="maskDetection">Detection Model</label>
                  <select
                    name="maskDetection"
                    id="maskDetection"
                    value={form.maskDetection}
                    onChange={handleChange}
                  >
                    <option value="mask">Detect Mask</option>
                    <option value="no-mask">Detect No-Mask</option>
                  </select>
                </div>
              </form>
            </div>

            <form className='selection-container'>
              <h3>Alert Configuration</h3>
              <div className='settings-form'>
                <p>Define the cooldown duration (in seconds) to avoid repeated alerts within a short time frame.</p>

                <div className="form-group tooltip-container">
                  <label htmlFor="cooldownSeconds">Cooldown Seconds</label>
                  <input
                    type="number"
                    name="cooldownSeconds"
                    id="cooldownSeconds"
                    value={form.cooldownSeconds}
                    onChange={handleChange}
                    placeholder="Enter cooldown in seconds"
                    min="0"
                    step="10"
                  />
                  <span className="tooltip-text">
                    Number of seconds on which alerts won’t be sent
                  </span>
                </div>
              </div>
            </form>
          </>
        )}

        {activeTab === 'location' && (
          <form className='selection-container'>
            <h3>WebCamera Location</h3>
            <div className='settings-form'>
              <p>Enter location of each webcam for easy alert identification.</p>
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
            </div>
          </form>
        )}

        <div className='save-btn-container'>
          <button className="save-btn" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;









