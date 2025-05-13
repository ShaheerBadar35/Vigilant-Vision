import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { FaVideo, FaBroadcastTower } from "react-icons/fa";
import Select from "react-select";

const ModelSelector = ({ selectedClasses, setSelectedClasses, title }) => {
  const models = ["Crowd", "Queue", "Smoke", "Mask", "Anamoly"];

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

// const inputOptions = [
//   {
//     value: "video",
//     label: (
//       <div style={{ display: "flex", alignItems: "center" }}>
//         <FaVideo style={{ marginRight: "8px" }} />
//         Video
//       </div>
//     ),
//   },
//   {
//     value: "livefeed",
//     label: (
//       <div style={{ display: "flex", alignItems: "center" }}>
//         <FaBroadcastTower style={{ marginRight: "8px" }} />
//         Live Feed
//       </div>
//     ),
//   },
// ];

const inputOptions = [
  { value: "video", label: "Video", icon: <FaVideo style={{ marginRight: "8px" }} /> },
  { value: "livefeed", label: "Live Feed", icon: <FaBroadcastTower style={{ marginRight: "8px" }} /> },
];


const MyLibrary = () => {
  // Has loaded flags
  const [hasLoaded1, setHasLoaded1] = useState(false);
  const [hasLoaded2, setHasLoaded2] = useState(false);
  const [hasLoadedSC1, setHasLoadedSC1] = useState(false);
  const [hasLoadedSC2, setHasLoadedSC2] = useState(false);
  const [hasLoadedRM1, setHasLoadedRM1] = useState(false);
  const [hasLoadedRM2, setHasLoadedRM2] = useState(false);

  // Persistent States
  const [input1Type, setInput1Type] = useState(null);
  const [input2Type, setInput2Type] = useState(null);
  const [selectedClasses1, setSelectedClasses1] = useState([]);
  const [selectedClasses2, setSelectedClasses2] = useState([]);
  const [responseMessage1, setResponseMessage1] = useState("");
  const [responseMessage2, setResponseMessage2] = useState("");

  // Non-persistent States
  const [input1File, setInput1File] = useState(null);
  const [input2File, setInput2File] = useState(null);
  const [isProcessing1, setIsProcessing1] = useState(false);
  const [isProcessing2, setIsProcessing2] = useState(false);
  const [detectionThreshold, setDetectionThreshold] = useState(1);

  // Load from sessionStorage
useEffect(() => {
  const val = sessionStorage.getItem("input1Type");
  if (val) setInput1Type(inputOptions.find(opt => opt.value === val));
  setHasLoaded1(true);
}, []);
useEffect(() => {
  const val = sessionStorage.getItem("input2Type");
  if (val) setInput2Type(inputOptions.find(opt => opt.value === val));
  setHasLoaded2(true);
}, []);

  useEffect(() => {
    const val = sessionStorage.getItem("selectedClasses1");
    if (val) setSelectedClasses1(JSON.parse(val));
    setHasLoadedSC1(true);
  }, []);
  useEffect(() => {
    const val = sessionStorage.getItem("selectedClasses2");
    if (val) setSelectedClasses2(JSON.parse(val));
    setHasLoadedSC2(true);
  }, []);
  useEffect(() => {
    const val = sessionStorage.getItem("responseMessage1");
    if (val) setResponseMessage1(JSON.parse(val));
    setHasLoadedRM1(true);
  }, []);
  useEffect(() => {
    const val = sessionStorage.getItem("responseMessage2");
    if (val) setResponseMessage2(JSON.parse(val));
    setHasLoadedRM2(true);
  }, []);

  // Save to sessionStorage after initial load
useEffect(() => {
  if (hasLoaded1) sessionStorage.setItem("input1Type", input1Type?.value || "");
}, [input1Type, hasLoaded1]);
useEffect(() => {
  if (hasLoaded2) sessionStorage.setItem("input2Type", input2Type?.value || "");
}, [input2Type, hasLoaded2]);
  useEffect(() => {
    if (hasLoadedSC1) sessionStorage.setItem("selectedClasses1", JSON.stringify(selectedClasses1));
  }, [selectedClasses1, hasLoadedSC1]);
  useEffect(() => {
    if (hasLoadedSC2) sessionStorage.setItem("selectedClasses2", JSON.stringify(selectedClasses2));
  }, [selectedClasses2, hasLoadedSC2]);
  useEffect(() => {
    if (hasLoadedRM1) sessionStorage.setItem("responseMessage1", JSON.stringify(responseMessage1));
  }, [responseMessage1, hasLoadedRM1]);
  useEffect(() => {
    if (hasLoadedRM2) sessionStorage.setItem("responseMessage2", JSON.stringify(responseMessage2));
  }, [responseMessage2, hasLoadedRM2]);

  const handleFileChange = (e, input) => {
    const file = e.target.files[0];
    input === 1 ? setInput1File(file) : setInput2File(file);
  };

  const handleInputChange = (selectedOption, input) => {
    input === 1 ? setInput1Type(selectedOption) : setInput2Type(selectedOption);
  };

  const handleStopProcessing = async (input) => {
    const setIsProcessing = input === 1 ? setIsProcessing1 : setIsProcessing2;
    const setResponseMessage = input === 1 ? setResponseMessage1 : setResponseMessage2;

    setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:5000/webcam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stop",
          feed_id: `feed${input}`,
        }),
      });

      const result = await response.json();
      setResponseMessage(result.message || "Feed stopped.");
    } catch (error) {
      console.error(error);
      setResponseMessage("Error stopping feed.");
    } finally {
      setIsProcessing(false);
    }
  };


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
        selectedModels.forEach((model) =>
          formData.append(`models_file${input}`, model.toLowerCase())
        );

        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setResponseMessage(response.ok
          ? `Processing completed: ${JSON.stringify(data.results)}`
          : `Error: ${data.error || "Unknown error"}`);
      } else {
        const response = await fetch("http://localhost:5000/webcam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      console.error(error);
      setResponseMessage("Error connecting to backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Select Field</h2>
      <div className="selection-container">
        {[1, 2].map((input) => {
          const inputType = input === 1 ? input1Type : input2Type;
          const selectedClasses = input === 1 ? selectedClasses1 : selectedClasses2;
          const setSelectedClasses = input === 1 ? setSelectedClasses1 : setSelectedClasses2;
          const isProcessing = input === 1 ? isProcessing1 : isProcessing2;
          return (
            <div key={input} className="input-section">
              <div className="feed-section">
                <div className="label">Input-{input}</div>
                  {/* <Select
                    options={inputOptions.map(opt => ({
                      value: opt.value,
                      label: (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {opt.icon}
                          {opt.label}
                        </div>
                      )
                    }))}
                    value={inputOptions.find(opt => opt.value === inputType?.value)}
                    onChange={(opt) => handleInputChange(opt, input)}
                    className="dropdown"
                    placeholder="Select input type..."
                  /> */}
                <Select
                  options={inputOptions.map(opt => ({
                    value: opt.value,
                    label: (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {opt.icon}
                        {opt.label}
                      </div>
                    )
                  }))}
                  value={inputOptions.find(opt => opt.value === inputType?.value)}
                  onChange={(opt) => handleInputChange(opt, input)}
                  className="dropdown"
                  placeholder="Select input type..."
                />
                {inputType?.value === "video" && (
                  <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, input)} />
                )}
              </div>
              <ModelSelector
                selectedClasses={selectedClasses}
                setSelectedClasses={setSelectedClasses}
                title="Models"
              />
              <button
                className="start-processing-button"
                onClick={() => {
                  (input === 1 ? isProcessing1 : isProcessing2)
                    ? handleStopProcessing(input)
                    : handleStartProcessing(input);
                }}
              >
                {/* {(input === 1 ? isProcessing1 : isProcessing2)
                  ? "Stop"
                  : "Start Processing"} */}
                  {isProcessing ? "Stop" : "Start Processing"}
              </button>
              <div className="response-message">
                {input === 1 ? responseMessage1 : responseMessage2}
              </div>
              {inputType?.value === "livefeed" && isProcessing && (
                <img
                  src={`http://localhost:5000/video_feed${input}`}
                  alt={`Live Feed ${input}`}
                  style={{ width: "480px", marginTop: "10px", border: "2px solid #ccc", borderRadius: "8px" }}
                />
              )}              
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyLibrary;



