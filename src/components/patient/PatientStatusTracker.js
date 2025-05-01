import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglass, faBell, faUser, faCheckCircle, faHospital, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { getPatientById } from '../../services/api';
import PatientStatusNotification from './PatientStatusNotification';
import WebSocketService from '../../services/websocket';

const PatientStatusTracker = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdated, setStatusUpdated] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const response = await getPatientById(patientId);
        setPatient(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Unable to load your status information. Please try again later.');
        setLoading(false);
      }
    };

    fetchPatientData();

    // Connect to WebSocket for real-time updates
    WebSocketService.connect();

    // Subscribe to patient-specific updates
    const patientSubscription = WebSocketService.subscribe(
      `/topic/patient/${patientId}`,
      (data) => {
        console.log('Received patient update:', data);
        // Update patient data with new information
        setPatient(prevPatient => ({
          ...prevPatient,
          status: data.status,
          queuePosition: data.queuePosition
        }));
        setStatusUpdated(true);
        
        // Reset status updated flag after 5 seconds
        setTimeout(() => {
          setStatusUpdated(false);
        }, 5000);
      }
    );

    return () => {
      // Unsubscribe and disconnect when component unmounts
      if (patientSubscription) {
        WebSocketService.unsubscribe(`/topic/patient/${patientId}`);
      }
      WebSocketService.disconnect();
    };
  }, [patientId]);

  const getStatusStep = (status) => {
    switch (status) {
      case 'WAITING': return 1;
      case 'NOTIFIED': return 2;
      case 'SERVING': return 3;
      case 'SERVED': return 4;
      default: return 0;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
        return <Badge bg="secondary"><FontAwesomeIcon icon={faHourglass} className="me-1" /> Waiting</Badge>;
      case 'NOTIFIED':
        return <Badge bg="warning"><FontAwesomeIcon icon={faBell} className="me-1" /> Notified</Badge>;
      case 'SERVING':
        return <Badge bg="primary"><FontAwesomeIcon icon={faUser} className="me-1" /> Being Served</Badge>;
      case 'SERVED':
        return <Badge bg="success"><FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Served</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status, queuePosition) => {
    switch (status) {
      case 'WAITING':
        return `You are in position ${queuePosition} in the queue. Please wait for your turn.`;
      case 'NOTIFIED':
        return 'You will be called soon! Please prepare to be served.';
      case 'SERVING':
        return 'It is your turn now! Please proceed to the service desk.';
      case 'SERVED':
        return 'Thank you for your visit!';
      default:
        return 'Your status information is not available.';
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your status information...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!patient) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Patient information not found. Please check your registration details.</Alert>
      </Container>
    );
  }

  const statusStep = getStatusStep(patient.status);
  const progressValue = (statusStep / 4) * 100;

  return (
    <Container className="py-5">
      {/* Status notification component */}
      <PatientStatusNotification patientId={patientId} queueId={patient.queueId} />
      
      {statusUpdated && (
        <Alert variant="info" className="mb-4">
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Your status has been updated!
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Your Queue Status</h4>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h5>Patient Information</h5>
              <p className="mb-1"><strong>Name:</strong> {patient.name}</p>
              <p className="mb-1"><strong>ID:</strong> {patient.id}</p>
              <p className="mb-1"><strong>Queue:</strong> {patient.queueName}</p>
              <p className="mb-0"><strong>Position:</strong> {patient.queuePosition}</p>
            </Col>
            <Col md={6} className="text-md-end">
              <h5>Status</h5>
              <div className="mb-3">
                <h3>{getStatusBadge(patient.status)}</h3>
              </div>
              <p>{getStatusMessage(patient.status, patient.queuePosition)}</p>
            </Col>
          </Row>
          
          <h5 className="mb-3">Status Progress</h5>
          <ProgressBar now={progressValue} variant="primary" className="mb-3" />
          
          <Row className="text-center g-0">
            <Col xs={3}>
              <div className={`status-step ${statusStep >= 1 ? 'active' : ''}`}>
                <div className="status-icon">
                  <FontAwesomeIcon icon={faHourglass} className={statusStep >= 1 ? 'text-primary' : 'text-muted'} />
                </div>
                <div className="status-label">Waiting</div>
              </div>
            </Col>
            <Col xs={3}>
              <div className={`status-step ${statusStep >= 2 ? 'active' : ''}`}>
                <div className="status-icon">
                  <FontAwesomeIcon icon={faBell} className={statusStep >= 2 ? 'text-warning' : 'text-muted'} />
                </div>
                <div className="status-label">Notified</div>
              </div>
            </Col>
            <Col xs={3}>
              <div className={`status-step ${statusStep >= 3 ? 'active' : ''}`}>
                <div className="status-icon">
                  <FontAwesomeIcon icon={faUserMd} className={statusStep >= 3 ? 'text-primary' : 'text-muted'} />
                </div>
                <div className="status-label">Serving</div>
              </div>
            </Col>
            <Col xs={3}>
              <div className={`status-step ${statusStep >= 4 ? 'active' : ''}`}>
                <div className="status-icon">
                  <FontAwesomeIcon icon={faCheckCircle} className={statusStep >= 4 ? 'text-success' : 'text-muted'} />
                </div>
                <div className="status-label">Served</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0"><FontAwesomeIcon icon={faHospital} className="me-2" />Department Information</h5>
        </Card.Header>
        <Card.Body>
          <p className="mb-1"><strong>Department:</strong> {patient.departmentName || 'Not available'}</p>
          <p className="mb-1"><strong>Queue:</strong> {patient.queueName || 'Not available'}</p>
          <p className="mb-0"><strong>Current Position:</strong> {patient.queuePosition}</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PatientStatusTracker;
