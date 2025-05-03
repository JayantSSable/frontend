import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faQrcode, faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import api, { registerPatient, registerDeviceToken } from '../../services/api';
import { requestNotificationPermission } from '../../services/firebase';

const PatientRegistration = () => {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    qrCodeId: qrCodeId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    // Check if we have a valid QR code ID from the URL
    if (!qrCodeId || qrCodeId === 'undefined' || (qrCodeId.startsWith('direct-') && qrCodeId.includes('undefined'))) {
      console.log('Invalid or missing QR code ID');
      
      // Redirect to home page if we have an invalid QR code
      if (qrCodeId && qrCodeId.includes('undefined')) {
        console.log('Redirecting from invalid URL format');
        navigate('/', { replace: true });
        return;
      }
      
      // If no valid QR code, just keep the form empty
      setFormData(prevState => ({
        ...prevState,
        qrCodeId: ''
      }));
    } else {
      console.log('QR Code ID from URL:', qrCodeId);
      // Update the form data with the QR code ID from URL params
      setFormData(prevState => ({
        ...prevState,
        qrCodeId: qrCodeId
      }));
    }
  }, [qrCodeId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Extract queue ID if this is a direct queue reference
    let queueId = null;
    
    // Only try to extract queue ID if we have a valid qrCodeId that starts with direct-
    if (qrCodeId && qrCodeId.startsWith('direct-')) {
      // Format is direct-{queueId} - this is a direct reference to a queue ID
      const parts = qrCodeId.split('-');
      if (parts.length >= 2 && parts[1] && parts[1] !== 'undefined') {
        // Convert to a number to ensure it's a valid Long in the backend
        const parsedQueueId = parseInt(parts[1], 10);
        if (!isNaN(parsedQueueId)) {
          queueId = parsedQueueId;
          console.log('Using direct queue ID for registration:', queueId);
        } else {
          // If we can't parse the queue ID, show error
          setError('Invalid queue ID format');
          return;
        }
      }
    } else if (!qrCodeId) {
      // If we have no qrCodeId, show error
      setError('No queue specified. Please scan a valid QR code.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for API call
      const patientData = {
        ...formData,
        queueId: queueId // This will be null if not a direct reference
      };
      
      console.log('Submitting patient registration:', patientData);
      const response = await registerPatient(patientData);
      
      console.log('Registration successful:', response.data);
      
      // Request notification permission and register device token
      try {
        console.log('Requesting notification permission...');
        console.log('Patient ID for token registration:', response.data.id);
        
        // Ensure Firebase is initialized before requesting permission
        if (!window.firebase) {
          console.error('Firebase is not initialized, waiting for initialization...');
          // Wait for Firebase to initialize (max 5 seconds)
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (window.firebase) {
              console.log('Firebase is now initialized after waiting');
              break;
            }
            if (i === 9) {
              console.error('Timed out waiting for Firebase to initialize');
            }
          }
        } else {
          console.log('Firebase is already initialized');
        }
        
        // Use the improved Firebase service to get the FCM token
        console.log('Using the improved Firebase service to get FCM token');
        const fcmToken = await requestNotificationPermission();
        
        console.log('Final FCM token result:', fcmToken);
        
        if (fcmToken) {
          console.log('FCM token obtained, registering with backend...', fcmToken);
          try {
            // Directly use axios to ensure the request is made
            const tokenRegistrationData = {
              patientId: response.data.id,
              deviceToken: fcmToken
            };
            console.log('Sending token registration data:', tokenRegistrationData);
            
            // Use the centralized API service instead of direct axios call with hardcoded URL
            const tokenResponse = await api.post(
              `/patients/device-token`,
              tokenRegistrationData
            );
            
            console.log('Device token registration response:', tokenResponse.data);
            console.log('Device token registered successfully');
          } catch (tokenError) {
            console.error('Error registering device token with backend:', tokenError);
            if (tokenError.response) {
              console.error('Token registration error details:', {
                status: tokenError.response.status,
                data: tokenError.response.data
              });
            }
          }
        } else {
          console.error('Failed to obtain FCM token or permission denied');
        }
      } catch (notificationError) {
        console.error('Error setting up notifications:', notificationError);
        // Don't block the registration process if notifications fail
      }
      
      // Navigate to the patient status page
      navigate(`/patient-status/${response.data.id}`);
      
      // Reset form after successful registration
      setFormData({
        name: '',
        phoneNumber: '',
        email: ''
      });
    } catch (err) {
      let errorMessage = 'Error registering for the queue. Please try again later.';
      
      if (err.response) {
        console.error('Server error response:', err.response.status, err.response.data);
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      console.error('Error registering patient:', err);
    }
  };

  return (
    <Container className="py-5">
      {/* We no longer need to show notifications here since we redirect */}
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          {!qrCodeId && (
            <Alert variant="warning" className="mb-3">
              <strong>No Queue Selected:</strong> Please scan a valid QR code to join a specific queue.
            </Alert>
          )}
          
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0"><FontAwesomeIcon icon={faUser} className="me-2" />Patient Registration</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="patientName">
                  <Form.Label>Your Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Name is required.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="patientPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Phone number is required.
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    We'll use this to notify you when your turn is approaching.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="patientEmail">
                  <Form.Label>Email Address (Optional)</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Joining Queue...' : 'Join Queue'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center text-muted">
              After registration, you'll be redirected to a page where you can track your position in the queue.
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PatientRegistration;
