import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Alert, Container, Row, Col, ProgressBar, Badge, ListGroup, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUsers, faCheckCircle, faBell, faHourglass, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getPatientById, getQueueDetails } from '../../services/api';
import WebSocketService from '../../services/websocket';

const PatientStatus = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [queueDetails, setQueueDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waitTime, setWaitTime] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Convert patient id to number
      const patientId = parseInt(id, 10);
      if (isNaN(patientId)) {
        setError('Invalid patient ID');
        setLoading(false);
        return;
      }
      const patientResponse = await getPatientById(patientId);
      setPatient(patientResponse.data);
      
      // Ensure queueId is a number
      const queueId = parseInt(patientResponse.data.queueId, 10);
      if (isNaN(queueId)) {
        setError('Invalid queue ID');
        setLoading(false);
        return;
      }
      const queueResponse = await getQueueDetails(queueId);
      setQueueDetails(queueResponse.data);
      
      // Calculate estimated wait time
      if (patientResponse.data.queuePosition && queueResponse.data.waitingPatients) {
        const position = patientResponse.data.queuePosition;
        const waitingAhead = queueResponse.data.waitingPatients.filter(
          p => p.queuePosition < position
        ).length;
        
        // Estimate 5 minutes per patient
        const estimatedMinutes = waitingAhead * 5;
        setWaitTime(estimatedMinutes);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error fetching data. Please try again later.');
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Subscribe to patient updates via WebSocket
    const patientSubscription = WebSocketService.subscribeToPatient(id, (data) => {
      console.log('Received patient update via WebSocket:', data);
      fetchData();
    });
    
    return () => {
      // Unsubscribe when component unmounts
      if (patientSubscription) {
        WebSocketService.unsubscribe(`/topic/patient/${id}`);
      }
    };
  }, [id]);
  
  // Separate useEffect for queue subscription to avoid dependency issues
  useEffect(() => {
    // Only subscribe to queue updates if we have a queueId
    if (!patient || !patient.queueId) return;
    
    console.log(`Subscribing to queue updates for queue ${patient.queueId}`);
    const queueSubscription = WebSocketService.subscribeToQueue(patient.queueId, (data) => {
      console.log('Received queue update via WebSocket:', data);
      fetchData();
    });
    
    return () => {
      // Unsubscribe when component unmounts or queueId changes
      if (queueSubscription) {
        WebSocketService.unsubscribe(`/topic/queue/${patient.queueId}`);
      }
    };
  }, [patient?.queueId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
        return <Badge bg="secondary" className="fs-6">Waiting</Badge>;
      case 'NOTIFIED':
        return <Badge bg="warning" className="fs-6">Get Ready! Your turn is approaching</Badge>;
      case 'SERVING':
        return <Badge bg="primary" className="fs-6">It's Your Turn Now!</Badge>;
      case 'SERVED':
        return <Badge bg="success" className="fs-6">Served</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger" className="fs-6">Cancelled</Badge>;
      default:
        return <Badge bg="secondary" className="fs-6">Unknown</Badge>;
    }
  };

  const getProgressValue = (status) => {
    switch (status) {
      case 'WAITING':
        return 25;
      case 'NOTIFIED':
        return 50;
      case 'SERVING':
        return 75;
      case 'SERVED':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your queue status...</p>
      </Container>
    );
  }

  if (error || !patient || !queueDetails) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error || 'Error loading your queue status. Please try again later.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white text-center">
              <h2>Your Queue Status</h2>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <h3>{queueDetails.name}</h3>
                <p className="text-muted">{queueDetails.departmentName}</p>
              </div>

              <div className="mb-4">
                <ProgressBar 
                  animated 
                  now={getProgressValue(patient.status)} 
                  variant={patient.status === 'SERVED' ? 'success' : 'primary'} 
                  className="mb-3"
                />
                
                <div className="d-flex justify-content-between">
                  <span>In Queue</span>
                  <span>Notified</span>
                  <span>Being Served</span>
                  <span>Completed</span>
                </div>
              </div>

              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Your Information</Card.Title>
                      <Card.Text>
                        <strong>Name:</strong> {patient.name}<br />
                        <strong>Position in Queue:</strong> {patient.queuePosition}<br />
                        <strong>Joined At:</strong> {new Date(patient.joinedAt).toLocaleString()}<br />
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 bg-light">
                    <Card.Body className="text-center">
                      <Card.Title>Current Status</Card.Title>
                      <div className="my-3">
                        {getStatusBadge(patient.status)}
                      </div>
                      {patient.status === 'WAITING' && waitTime && (
                        <Card.Text>
                          Estimated wait time: <strong>{waitTime} minutes</strong>
                        </Card.Text>
                      )}
                      {patient.status === 'NOTIFIED' && (
                        <div className="alert alert-warning">
                          Please proceed to the {queueDetails.departmentName} department.
                          Your turn is coming up soon!
                        </div>
                      )}
                      {patient.status === 'SERVING' && (
                        <div className="alert alert-primary">
                          It's your turn now! Please proceed to the service counter.
                        </div>
                      )}
                      {patient.status === 'SERVED' && (
                        <div className="alert alert-success">
                          You have been served. Thank you for your visit!
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    Queue Status: {queueDetails.name}
                  </Card.Title>
                  <Row className="mb-3">
                    <Col xs={4} className="text-center border-end">
                      <div className="fs-4 fw-bold text-primary">
                        {queueDetails.currentPatient ? 1 : 0}
                      </div>
                      <div>
                        <FontAwesomeIcon icon={faUser} className="me-1" />
                        Currently Serving
                      </div>
                    </Col>
                    <Col xs={4} className="text-center border-end">
                      <div className="fs-4 fw-bold text-secondary">
                        {queueDetails.waitingPatients?.length || 0}
                      </div>
                      <div>
                        <FontAwesomeIcon icon={faHourglass} className="me-1" />
                        Waiting
                      </div>
                    </Col>
                    <Col xs={4} className="text-center">
                      <div className="fs-4 fw-bold text-success">
                        {queueDetails.servedPatients?.length || 0}
                      </div>
                      <div>
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                        Served
                      </div>
                    </Col>
                  </Row>
                  
                  {/* Currently Serving */}
                  {queueDetails.currentPatient && (
                    <div className="mb-3">
                      <h6 className="border-bottom pb-2">
                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                        Currently Serving:
                      </h6>
                      <div className="ps-3 py-2 bg-light rounded">
                        <strong>{queueDetails.currentPatient.name}</strong>
                        <Badge bg="primary" className="ms-2">SERVING</Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Waiting Patients */}
                  {queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 && (
                    <div className="mb-3">
                      <h6 className="border-bottom pb-2">
                        <FontAwesomeIcon icon={faHourglass} className="me-2 text-secondary" />
                        Waiting Patients:
                      </h6>
                      <ListGroup variant="flush" className="border rounded">
                        {queueDetails.waitingPatients.slice(0, 5).map((waitingPatient) => (
                          <ListGroup.Item key={waitingPatient.id} className={waitingPatient.id === patient.id ? 'bg-light fw-bold' : ''}>
                            {waitingPatient.name}
                            {waitingPatient.id === patient.id && (
                              <Badge bg="info" className="ms-2">YOU</Badge>
                            )}
                            <Badge bg="secondary" className="ms-2">Position: {waitingPatient.queuePosition}</Badge>
                          </ListGroup.Item>
                        ))}
                        {queueDetails.waitingPatients.length > 5 && (
                          <ListGroup.Item className="text-muted text-center">
                            + {queueDetails.waitingPatients.length - 5} more patients waiting
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button variant="outline-primary" onClick={fetchData} size="sm">
                    <FontAwesomeIcon icon={faSpinner} className="me-2" />
                    Refresh Queue Status
                  </Button>
                </Card.Footer>
              </Card>

              {patient.status === 'WAITING' && (
                <Alert variant="info">
                  <Alert.Heading>Keep this page open</Alert.Heading>
                  <p>
                    You will be notified here when your turn is approaching. You can also close this page
                    and return later using the same link.
                  </p>
                </Alert>
              )}
            </Card.Body>
            <Card.Footer className="text-center text-muted">
              Queue ID: {queueDetails.id} | Patient ID: {patient.id}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PatientStatus;
