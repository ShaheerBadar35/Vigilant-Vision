import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import './Analytics.css';
import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc  } from 'firebase/firestore';

const COLORS = ['#2563eb', '#7FB3FF', '#e0e3e7'];
const STATUS_LABELS = ['Completed', 'Assigned', 'Pending'];
const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const label = STATUS_LABELS[payload[0].payload.index];
        return (
        <div className="custom-tooltip" style={{
            backgroundColor: '#fff',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
        }}>
        <p style={{ margin: 0 }}><strong>{label}</strong>: {payload[0].value}</p>
        </div>
    );
  }
  return null;
};

const Analytics = () => {
    const [crowdData, setCrowdData] = useState([]);
    const [alertStats, setAlertStats] = useState({
        resolved: 0,
        assigned: 0,
        pending: 0
    });
    const [detectionDistribution, setDetectionDistribution] = useState([]);
    const [summary, setSummary] = useState([]);

    const [activityChartData, setActivityChartData] = useState([

]);

useEffect(() => {
    fetch('http://localhost:5000/api/suspicious-activity-types')
    .then(res => res.json())
    .then(data => setActivityChartData(data))
    .catch(err => console.error('Failed to fetch activity data:', err));
}, []);

useEffect(() => {
    axios.get('http://localhost:5000/api/detection-distribution')
    .then(res => setDetectionDistribution(res.data))
    .catch(err => console.error(err));
}, []);

 
useEffect(() => {
    axios.get('http://localhost:5000/api/crowd')
      .then(res => setCrowdData(res.data))
      .catch(err => console.error(err));
}, []);

  
useEffect(() => {
    const fetchAlerts = async () => {
        const snapshot = await getDocs(collection(db, 'alerts'));
        let resolved = 0, assigned = 0, pending = 0;
        snapshot.forEach(doc => {
            const status = doc.data().status;
            if (status === 'resolved') resolved++;
            else if (status === 'assigned') assigned++;
            else if (status === 'pending') pending++;
        });
        setAlertStats({ resolved, assigned, pending });
    };

    fetchAlerts();
}, []);

const totalAlerts = alertStats.resolved + alertStats.assigned + alertStats.pending;

const alertChartData = [
    { name: 'Resolved', value: alertStats.resolved, index: 0 },
    { name: 'Assigned', value: alertStats.assigned, index: 1 },
    { name: 'Pending', value: alertStats.pending, index: 2 }
];

useEffect(() => {
    const fetchData = async () => {
        const alertsSnapshot = await getDocs(collection(db, 'alerts'));
        const usersSnapshot = await getDocs(collection(db, 'user'));

        const users = {};
        const tasks = {};
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.volID && data.fullName) {
                users[data.volID] = data.fullName;
                tasks[data.volID] = { completed: 0, assigned: 0, generated: 0 };

            } else {
                console.warn("Missing volID or fullName in user:", data);
            }
        });

        alertsSnapshot.forEach(doc => {
            const alert = doc.data();
            const assignedTo = alert.assigned_to?.trim().toUpperCase();
            const cameraId = alert.camera_id?.trim().toUpperCase();

            if (assignedTo && tasks[assignedTo]) {
                if (alert.status === 'resolved') tasks[assignedTo].completed += 1;
                if (alert.status === 'assigned') tasks[assignedTo].assigned += 1;
            }

            if (cameraId && tasks[cameraId]) {
                tasks[cameraId].generated += 1;
            }
        });

     
        const formatted = Object.entries(tasks).map(([volunteer_id, counts]) => {
            const name = users[volunteer_id] || 'Unknown';
            if (name === 'Unknown') {
                console.warn(`Name not found for volID: ${volunteer_id}`);
            }
            return {
                volunteer_id,
                name,
                ...counts,
            };
        });

        formatted.sort((a, b) => a.volunteer_id.localeCompare(b.volunteer_id));

        setSummary(formatted);
    };

    fetchData();
}, []);

  return (
    <div className="analytics">
        <h2>Analytics</h2>

        {/* Crowd Chart */}
        <div className="chart-row">
            <div className="chart-card chart-crowd">
                <h3>Crowd Count Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                <LineChart data={crowdData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis tickCount={10} domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#4a43e3" strokeWidth={2} />
                </LineChart>
                </ResponsiveContainer>
            </div>
        {/*Suspicious Chart*/}
        <div className="chart-card chart-suspicious">
            <h3>Suspicious Activity Count</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityChartData}>
                    <XAxis dataKey="type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8ccec2" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/*Detections Pie Chart*/}
        <div className="chart-card chart-detection">
            <h3>Model Detections Distribution</h3>
            <div className="detection-chart-with-legend">
                <ResponsiveContainer width="60%" height={250}>
                    <PieChart>
                        <Pie
                            data={detectionDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label
                            dataKey="value"
                            nameKey="name"
                        >
                        {detectionDistribution.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                        />
                         ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} detections`, name]} />
                    </PieChart>
                </ResponsiveContainer>

                <div className="legend">
                    {detectionDistribution.map((entry, index) => (
                        <div className="legend-item" key={index}>
                            <span
                                className="legend-color"
                                style={{ backgroundColor: pieColors[index % pieColors.length] }}
                            ></span>
                            <span className="legend-label">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>

    <div className="volunteer-alert-row">
    <div className="volunteer-table">
    <h2>Volunteer Task Summary</h2>
    <table>
        <thead>
        <tr>
            <th>Volunteer ID</th>
            <th>Name</th>
            <th>Completed</th>
            <th>Assigned</th>
            <th>Generated</th>
        </tr>
        </thead>
        <tbody>
        {summary.map((v) => (
        <tr key={v.volunteer_id}>
            <td>{v.volunteer_id}</td>
            <td>{v.name}</td>
            <td>{v.completed}</td>
            <td>{v.assigned}</td>
            <td>{v.generated}</td>
        </tr>
        ))}
        </tbody>
        </table>
    </div>

    <div className="alert-status-chart">
        <h3>Alert Status</h3>

        <div className="alert-summary" style={{ marginTop: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
            <p><strong>Total Alerts</strong> {totalAlerts}</p>
            <p><strong>Completed</strong> {alertStats.resolved}</p>
            <p><strong>In-Progress</strong> {alertStats.assigned}</p>
            <p><strong>Remaining</strong> {alertStats.pending}</p>
    
        </div>

        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={alertChartData}
                    innerRadius={60}
                    outerRadius={120}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                    labelLine={false}
                >
                {alertChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="20"
                    fontWeight="bold"
                >
                {alertStats.resolved + alertStats.assigned}
                </text>
            </PieChart>
        </ResponsiveContainer>

        {/* Legend Section */}
            <div className="legend">
                {alertChartData.map((entry, index) => (
                    <div className="legend-item" key={index}>
                    <span
                        className="legend-color"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="legend-label">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
    </div>
  );
};

export default Analytics;


