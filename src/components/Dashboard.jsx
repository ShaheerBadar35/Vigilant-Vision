import React, { useState } from "react";
import "./Dashboard.css";
import { FaVideo, FaBroadcastTower } from "react-icons/fa";
import Select from "react-select";
{/*

const ModelSelector = ({ selectedClasses, setSelectedClasses, title }) => {
  const models = ["Crowd", "Queue", "Smoke", "Mask"];

  const handleClassToggle = (className) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((cls) => cls !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const selectAllModels = () => {
    setSelectedClasses(models);
  };

  return (
    <div className="classes-section">
      <label className="label">{title}<button className="select-all-button" onClick={selectAllModels}>
          Select All
        </button></label>
      <div className="class-buttons">
        {models.map((className) => (
          <button
            key={className}
            className={`class-button ${
              selectedClasses.includes(className) ? "selected" : ""
            }`}
            onClick={() => handleClassToggle(className)}
          >
            {className}
          </button>
        ))}
      </div>
    </div>
  );
};


const MyLibrary = () => {
  const [selectedClassesCol1, setSelectedClassesCol1] = useState([]);
  const [selectedClassesCol2, setSelectedClassesCol2] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]); // Track selected models
  const [confidenceValue, setConfidenceValue] = useState(0.0);
  const [selectedInputType, setSelectedInputType] = useState(null); // Use null for react-select
  const [file, setFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // Track if processing is active
  const [startLiveFeed, setStartLiveFeed] = useState(false);
  const [isLiveFeedRunning, setIsLiveFeedRunning] = useState(false);
  const [detectionThreshold, setDetectionThreshold] = useState(1); // New state for detection threshold

  const models = ["Crowd", "Queue", "Smoke", "Mask"]; // Define all models

  // Define options for the dropdown with icons
  const inputOptions = [
    {
      value: "video",
      label: (
        <div style={{ display: "flex", alignItems: "center" }}>
          <FaVideo style={{ marginRight: "8px" }} />
          Video
        </div>
      ),
    },
    {
      value: "livefeed",
      label: (
        <div style={{ display: "flex", alignItems: "center" }}>
          <FaBroadcastTower style={{ marginRight: "8px" }} />
          Live Feed
        </div>
      ),
    },
  ];

  const handleClassToggle = (className) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((cls) => cls !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const selectAllModels = () => {
    setSelectedClasses(models); // Select all models
  };

  const handleSliderChange = (event) => {
    setConfidenceValue(event.target.value);
  };

  const handleInputTypeChange = (selectedOption) => {
    setSelectedInputType(selectedOption);
    setStartLiveFeed(false);
    setIsLiveFeedRunning(false); // Reset state on input change
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleStartProcessing = async () => {
    if (selectedInputType.value === "livefeed" && selectedClasses.length === 0) {
      alert("Please select at least one model for live feed processing.");
      return;
    }

    if (selectedInputType.value === "video" && !file) {
      alert("Please upload a video file.");
      return;
    }

    setIsProcessing(true); // Set processing state to true

    if (selectedInputType.value === "video") {
      const formData = new FormData();
      formData.append("file", file); // Add file if it's a video
      selectedClasses.forEach((cls) =>
        formData.append("models", cls.toLowerCase())
      );
      formData.append("threshold", detectionThreshold);

      try {
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          setResponseMessage(`Processing completed: ${JSON.stringify(data.results)}`);
        } else {
          setResponseMessage(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Error connecting to the backend:", error);
        setResponseMessage("Error connecting to the backend.");
      }
    }

    if (selectedInputType.value === "livefeed") {
      setStartLiveFeed(true); // Activate live feed processing
    }
    setIsProcessing(false); // Set processing state to false after completion
  };

  const handleLiveFeedToggle = async () => {
    const action = isLiveFeedRunning ? "stop" : "start";

    const response = await fetch("http://localhost:5000/webcam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        models: selectedClasses.map((cls) => cls.toLowerCase()),
        threshold: detectionThreshold,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setIsLiveFeedRunning(!isLiveFeedRunning);
      alert(data.message);
    } else {
      alert(`Error: ${data.error}`);
    }
  };

  return (
    <div className="my-library-container">
      <div className="input-section">
        <div className="feed-section"> 
        
          <div className="label">Input-1</div>
          <Select
            options={inputOptions}
            value={selectedInputType}
            onChange={handleInputTypeChange}
            className="dropdown"
            placeholder="Select input type..."
            
          />
          {selectedInputType?.value === "video" && (
            <input type="file" accept="video/*" onChange={handleFileChange} />
          )}
        </div>
        <ModelSelector
          selectedClasses={selectedClassesCol1}
          setSelectedClasses={setSelectedClassesCol1}
          title="Models"
        />
        <button
          className="start-processing-button"
          onClick={
            selectedInputType?.value === "livefeed"
              ? handleLiveFeedToggle
              : handleStartProcessing
          }
        >
          {isLiveFeedRunning ? "Processing..." : "Start Processing"}
        </button>
      </div>
      <div className="input-section">
        <div className="feed-section"> 
        <div className="label">Input-2</div>
        <Select
          options={inputOptions}
          value={selectedInputType}
          onChange={handleInputTypeChange}
          className="dropdown"
          placeholder="Select input type..."
        />
        {selectedInputType?.value === "video" && (
          <input type="file" accept="video/*" onChange={handleFileChange} />
        )}
      </div>
      <ModelSelector
          selectedClasses={selectedClassesCol2}
          setSelectedClasses={setSelectedClassesCol2}
          title="Models"
        />
      <button
          className="start-processing-button"
          onClick={
            selectedInputType?.value === "livefeed"
              ? handleLiveFeedToggle
              : handleStartProcessing
          }
        >
          {isLiveFeedRunning ? "Processing..." : "Start Processing"}
        </button>
      </div>

      {selectedInputType?.value === "livefeed" && selectedClasses.length > 0 && (
        <div className="livefeed-container">
          <img
            src={`http://localhost:5000/webcam?models=${selectedClasses
              .map((cls) => cls.toLowerCase())
              .join(",")}`}
            style={{ width: "100%", border: "1px solid black" }}
          />
        </div>
      )}

      {responseMessage && (
        <div className="response-message">{responseMessage}</div>
      )}
    </div>
  );
};

export default MyLibrary;*/}
{/*
import React, { useState } from "react";
import "./MyLibrary.css";
import { FaVideo, FaBroadcastTower } from "react-icons/fa";
import Select from "react-select";
*/}

const ModelSelector = ({ selectedClasses, setSelectedClasses, title }) => {
  const models = ["Crowd", "Queue", "Smoke", "Mask"];

  const handleClassToggle = (className) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((cls) => cls !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const selectAllModels = () => {
    setSelectedClasses(models);
  };

  return (
    <div className="classes-section">
      <label className="label">
        {title}
        <button className="select-all-button" onClick={selectAllModels}>
          Select All
        </button>
      </label>
      <div className="class-buttons">
        {models.map((className) => (
          <button
            key={className}
            className={`class-button ${
              selectedClasses.includes(className) ? "selected" : ""
            }`}
            onClick={() => handleClassToggle(className)}
          >
            {className}
          </button>
        ))}
      </div>
    </div>
  );
};

const inputOptions = [
  {
    value: "video",
    label: (
      <div style={{ display: "flex", alignItems: "center" }}>
        <FaVideo style={{ marginRight: "8px" }} />
        Video
      </div>
    ),
  },
  {
    value: "livefeed",
    label: (
      <div style={{ display: "flex", alignItems: "center" }}>
        <FaBroadcastTower style={{ marginRight: "8px" }} />
        Live Feed
      </div>
    ),
  },
];

const MyLibrary = () => {
  const [input1Type, setInput1Type] = useState(null);
  const [input2Type, setInput2Type] = useState(null);
  const [input1File, setInput1File] = useState(null);
  const [input2File, setInput2File] = useState(null);
  const [selectedClasses1, setSelectedClasses1] = useState([]);
  const [selectedClasses2, setSelectedClasses2] = useState([]);
  const [isProcessing1, setIsProcessing1] = useState(false);
  const [isProcessing2, setIsProcessing2] = useState(false);
  const [responseMessage1, setResponseMessage1] = useState("");
  const [responseMessage2, setResponseMessage2] = useState("");

  const [isLiveFeedRunning, setIsLiveFeedRunning] = useState(false);
  const [detectionThreshold, setDetectionThreshold] = useState(1);

  const handleFileChange = (e, input) => {
    const file = e.target.files[0];
    if (input === 1) setInput1File(file);
    else setInput2File(file);
  };

  const handleInputChange = (selectedOption, input) => {
    if (input === 1) setInput1Type(selectedOption);
    else setInput2Type(selectedOption);
  };

  // const handleStartProcessing = async (input) => {
  //   const inputType = input === 1 ? input1Type : input2Type;
  //   const file = input === 1 ? input1File : input2File;
  //   const selectedModels = input === 1 ? selectedClasses1 : selectedClasses2;
  //   const setIsProcessing = input === 1 ? setIsProcessing1 : setIsProcessing2;
  //   const setResponseMessage = input === 1 ? setResponseMessage1 : setResponseMessage2;
  
  //   if (!inputType) return alert(`Select input type for Input-${input}`);
  //   if (inputType.value === "video" && !file) return alert("Upload a video file");
  //   if (inputType.value === "livefeed" && selectedModels.length === 0)
  //     return alert("Select at least one model");
  
  //   setIsProcessing(true);
  
  //   if (inputType.value === "video") {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     selectedModels.forEach((cls) => formData.append("models", cls.toLowerCase()));
  //     formData.append("threshold", detectionThreshold);
  
  //     try {
  //       const response = await fetch("http://localhost:5000/upload", {
  //         method: "POST",
  //         body: formData,
  //       });
  
  //       const data = await response.json();
  //       setResponseMessage(
  //         response.ok
  //           ? `Processing completed: ${JSON.stringify(data.results)}`
  //           : `Error: ${data.error}`
  //       );
  //     } catch (error) {
  //       console.error("Error connecting to the backend:", error);
  //       //setResponseMessage("Error connecting to the backend.");
  //       setIsProcessing(false);
  //       return alert("Error connecting to backend");
  //     }
  //   }
  
  //   // Optional: Handle livefeed per input if needed
  //   if (inputType.value === "livefeed") {
  //     // Your livefeed toggle or request here
  //   }
  
  //   setIsProcessing(false);
  // };

  const handleStartProcessing = async (input) => {
    const inputType = input === 1 ? input1Type : input2Type;
    const file = input === 1 ? input1File : input2File;
    const selectedModels = input === 1 ? selectedClasses1 : selectedClasses2;
    const setIsProcessing = input === 1 ? setIsProcessing1 : setIsProcessing2;
    const setResponseMessage = input === 1 ? setResponseMessage1 : setResponseMessage2;
  
    if (!inputType) return alert(`Select input type for Input-${input}`);
    if (inputType.value === "video" && !file) return alert("Upload a video file");
    if (selectedModels.length === 0) return alert("Select at least one model");
  
    setIsProcessing(true);
  
    try {
      if (inputType.value === "video") {
        const formData = new FormData();
        formData.append(`file${input}`, file);
        selectedModels.forEach((model) => {
          formData.append(`models_file${input}`, model.toLowerCase());
        });
  
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
  
        const data = await response.json();
  
        if (response.ok) {
          setResponseMessage(`Processing completed: ${JSON.stringify(data.results)}`);
        } else {
          setResponseMessage(`Error: ${data.error || 'Unknown error occurred'}`);
        }
      } else if (inputType.value === "livefeed") {
        const response = await fetch("http://localhost:5000/webcam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "start",
            feed_id: `feed${input}`,
            models: selectedModels.map((m) => m.toLowerCase()),
            threshold: detectionThreshold,
          }),
        });
  
        const result = await response.json();
        setResponseMessage(result.message || "Live feed started.");
      }
    } catch (error) {
      console.error("Error connecting to the backend:", error);
      setResponseMessage("Error connecting to the backend.");
      return alert("Error connecting to backend");
    } finally {
      setIsProcessing(false); // Ensure we always reset processing state
    }
  };


  return (
    <div className="dashboard-container">
      <h2>Select Field</h2>
    <div className="selection-container">
      {[1, 2].map((input) => {
        const inputType = input === 1 ? input1Type : input2Type;
        const selectedClasses =
          input === 1 ? selectedClasses1 : selectedClasses2;
        const setSelectedClasses =
          input === 1 ? setSelectedClasses1 : setSelectedClasses2;

        return (
          <div key={input} className="input-section">
            <div className="feed-section">
              <div className="label">Input-{input}</div>
              <Select
                options={inputOptions}
                value={inputType}
                onChange={(opt) => handleInputChange(opt, input)}
                className="dropdown"
                placeholder="Select input type..."
              />
              {inputType?.value === "video" && (
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, input)}
                />
              )}
            </div>
            <ModelSelector
              selectedClasses={selectedClasses}
              setSelectedClasses={setSelectedClasses}
              title="Models"
            />
            <button
              className="start-processing-button"
              onClick={() => handleStartProcessing(input)}
            >
              {input === 1
                ? isProcessing1
                  ? "Stop"
                  : "Start Processing"
                : isProcessing2
                ? "Stop"
                : "Start Processing"}
          
              
            </button>
            {input === 1 && responseMessage1 && (
                <div className="response-message">{responseMessage1}</div>
            )}
            {input === 2 && responseMessage2 && (
                <div className="response-message">{responseMessage2}</div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
};

export default MyLibrary;
