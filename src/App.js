import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/admin/AdminDashboard';

// Hospital Components
import HospitalList from './components/admin/HospitalList';
import HospitalForm from './components/admin/HospitalForm';
import HospitalDetails from './components/admin/HospitalDetails';

// Department Components
import DepartmentList from './components/admin/DepartmentList';
import DepartmentForm from './components/admin/DepartmentForm';

// Queue Components
import QueueList from './components/admin/QueueList';
import QueueForm from './components/admin/QueueForm';
import QueueDetails from './components/admin/QueueDetails';

// Patient Components
import PatientRegistration from './components/patient/PatientRegistration';
import PatientStatus from './components/patient/PatientStatus';
import PatientStatusTracker from './components/patient/PatientStatusTracker';

// Display Components
import QueueDisplay from './components/display/QueueDisplay';

// Services
import WebSocketService from './services/websocket';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

function App() {
  useEffect(() => {
    // Initialize Firebase
    try {
      // Firebase configuration from environment variables
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
      };

      console.log('Initializing Firebase with config:', firebaseConfig);
      
      // Initialize Firebase and make it globally available
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      
      // Make Firebase available globally
      window.firebase = { app, messaging };
      
      console.log('Firebase initialized successfully and attached to window object');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
    
    // Connect to WebSocket when the app loads with better error handling
    const connectWebSocket = async () => {
      try {
        await WebSocketService.connect(
          () => console.log('WebSocket connected successfully'),
          (error) => console.error('WebSocket connection error:', error)
        );
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
      }
    };
    
    connectWebSocket();

    // Disconnect when the app unmounts
    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Hospital Routes */}
            <Route path="/admin/hospitals" element={<HospitalList />} />
            <Route path="/admin/hospitals/new" element={<HospitalForm />} />
            <Route path="/admin/hospitals/:id" element={<HospitalDetails />} />
            <Route path="/admin/hospitals/:id/edit" element={<HospitalForm />} />
            <Route path="/admin/hospitals/:hospitalId/departments/new" element={<DepartmentForm />} />
            
            {/* Department Routes */}
            <Route path="/admin/departments" element={<DepartmentList />} />
            <Route path="/admin/departments/new" element={<DepartmentForm />} />
            <Route path="/admin/departments/edit/:id" element={<DepartmentForm />} />
            
            {/* Queue Routes */}
            <Route path="/admin/queues" element={<QueueList />} />
            <Route path="/admin/queues/new" element={<QueueForm />} />
            <Route path="/admin/queues/edit/:id" element={<QueueForm />} />
            <Route path="/admin/queues/:id" element={<QueueDetails />} />
            
            {/* Patient Routes */}
            <Route path="/join-queue/:qrCodeId" element={<PatientRegistration />} />
            <Route path="/patient-status/:id" element={<PatientStatus />} />
            <Route path="/patient-tracker/:patientId" element={<PatientStatusTracker />} />
            
            {/* Display Routes */}
            <Route path="/display/queue/:id" element={<QueueDisplay />} />
            
            {/* Default Route */}
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
