import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Table, Badge, Alert, Form, Modal, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowLeft, faCheckCircle, faUser, faUsers, faArrowUp, faArrowDown, faBell } from '@fortawesome/free-solid-svg-icons';
import { QRCodeSVG } from 'qrcode.react';
import { getQueueDetails, updatePatientStatus, updatePatientQueuePosition } from '../../services/api';
import WebSocketService from '../../services/websocket';
import PatientStatusDropdown from './PatientStatusDropdown';

const QueueDetails = () => {
  const { id } = useParams();
  const [queueDetails, setQueueDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPosition, setNewPosition] = useState('');

  const fetchQueueDetails = async () => {
    try {
      setLoading(true);
      // Convert id to number to ensure correct type is passed to API
      const queueId = parseInt(id, 10);
      if (isNaN(queueId)) {
        setError('Invalid queue ID');
        setLoading(false);
        return;
      }
      
      console.log('Fetching queue details for ID:', queueId);
      const response = await getQueueDetails(queueId);
      
      if (!response || !response.data) {
        console.error('Empty response or missing data:', response);
        setError('Received empty response from server');
        setLoading(false);
        return;
      }
      
      console.log('Queue details received:', response.data);
      setQueueDetails(response.data);
      setLoading(false);
    } catch (err) {
      // More detailed error handling
      let errorMessage = 'Error fetching queue details. Please try again later.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', err.response.status, err.response.data);
        if (err.response.status === 404) {
          errorMessage = `Queue with ID ${id} not found. It may have been deleted.`;
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data.message || err.response.statusText}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request error:', err.message);
        errorMessage = `Request error: ${err.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch with retry mechanism
    const fetchWithRetry = async (retries = 3, delay = 1000) => {
      try {
        await fetchQueueDetails();
      } catch (error) {
        if (retries > 0) {
          console.log(`Retrying queue details fetch. Attempts remaining: ${retries}`);
          setTimeout(() => fetchWithRetry(retries - 1, delay * 1.5), delay);
        }
      }
    };
    
    fetchWithRetry();

    // Subscribe to queue updates via WebSocket
    const subscription = WebSocketService.subscribeToQueue(id, (data) => {
      if (data === 'queue-updated') {
        fetchQueueDetails();
      } else {
        // Handle patient status update notification
        fetchQueueDetails();
      }
    });

    return () => {
      // Unsubscribe when component unmounts
      if (subscription) {
        WebSocketService.unsubscribe(`/topic/queue/${id}`);
      }
    };
  }, [id]);

  const handleStatusChange = async (patientId, newStatus) => {
    try {
      console.log(`Changing patient ${patientId} status to ${newStatus}`);
      await updatePatientStatus(patientId, newStatus);
      setUpdateSuccess(true);
      fetchQueueDetails();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Error updating patient status. Please try again later.');
      console.error('Error updating patient status:', err);
    }
  };
  
  const handleMarkAsServed = async (patientId) => {
    handleStatusChange(patientId, 'SERVED');
  };

  const handleCallNext = async (patientId) => {
    handleStatusChange(patientId, 'SERVING');
  };

  const handleUpdatePosition = async () => {
    if (!selectedPatient || !newPosition || isNaN(parseInt(newPosition, 10))) {
      setError('Please enter a valid position number');
      return;
    }
    
    try {
      await updatePatientQueuePosition(selectedPatient.id, parseInt(newPosition, 10));
      setUpdateSuccess(true);
      setShowPositionModal(false);
      fetchQueueDetails();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Error updating patient position. Please try again later.');
    }
  };

  const openPositionModal = (patient) => {
    setSelectedPatient(patient);
    setNewPosition(patient.queuePosition.toString());
    setShowPositionModal(true);
  };

  const handleMarkAsNotified = async (patientId) => {
    handleStatusChange(patientId, 'NOTIFIED');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
        return <Badge bg="secondary">Waiting</Badge>;
      case 'NOTIFIED':
        return <Badge bg="warning">Notified</Badge>;
      case 'SERVING':
        return <Badge bg="primary">Serving</Badge>;
      case 'SERVED':
        return <Badge bg="success">Served</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading queue details...</div>;
  }

  if (!queueDetails) {
    return <Alert variant="danger">Queue not found or error loading data.</Alert>;
  }

  return (
    <div className="container py-4">
      {/* Position Update Modal */}
      <Modal show={showPositionModal} onHide={() => setShowPositionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Patient Position</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPatient && (
            <>
              <p>Update queue position for patient: <strong>{selectedPatient.name}</strong></p>
              <p>Current position: <strong>{selectedPatient.queuePosition}</strong></p>
              <Form>
                <Form.Group>
                  <Form.Label>New Position</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPositionModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdatePosition}>
            Update Position
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/queues" className="btn btn-outline-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Queues
          </Link>
          <h1 className="d-inline-block">{queueDetails.name}</h1>
        </div>
        <Link to={`/admin/queues/edit/${id}`}>
          <Button variant="primary">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit Queue
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {updateSuccess && <Alert variant="success">Patient status updated successfully!</Alert>}

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Queue Information</Card.Title>
              <Card.Text>
                <strong>Department:</strong> {queueDetails.departmentName}<br />
                <strong>Description:</strong> {queueDetails.description || 'No description'}<br />
              </Card.Text>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body className="text-center">
              <Card.Title>QR Code</Card.Title>
              <div className="my-3">
                {queueDetails.qrCodeImage ? (
                  <img 
                    src={`data:image/png;base64,${queueDetails.qrCodeImage}`} 
                    alt="Queue QR Code" 
                    style={{ maxWidth: '100%' }} 
                  />
                ) : (
                  <QRCodeSVG 
                    value={`http://localhost:3000/join-queue/${queueDetails.qrCodeId}`} 
                    size={200} 
                    level="H" 
                  />
                )}
              </div>
              <Card.Text>
                Scan this QR code to join the queue
              </Card.Text>
              <div className="d-grid">
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    // Check if we have a valid QR code ID
                    if (queueDetails.qrCodeId && queueDetails.qrCodeId !== 'undefined') {
                      // Use the existing QR code ID
                      const url = `http://localhost:3000/join-queue/${queueDetails.qrCodeId}`;
                      console.log('Using existing QR code ID for registration:', queueDetails.qrCodeId);
                      window.open(url, '_blank');
                    } else {
                      // Generate a direct queue ID based URL
                      // Format: direct-{queueId} - this will be handled specially in the registration component
                      const directId = `direct-${queueDetails.id}`;
                      console.log('Using direct queue ID for registration:', directId);
                      const url = `http://localhost:3000/join-queue/${directId}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  Open Registration Page
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>Queue Statistics</Card.Title>
              <div className="d-flex justify-content-between my-3">
                <div className="text-center">
                  <div className="fs-1 fw-bold text-primary">
                    {queueDetails.waitingPatients?.length || 0}
                  </div>
                  <div>Waiting</div>
                </div>
                <div className="text-center">
                  <div className="fs-1 fw-bold text-success">
                    {queueDetails.servedPatients?.length || 0}
                  </div>
                  <div>Served</div>
                </div>
                <div className="text-center">
                  <div className="fs-1 fw-bold text-info">
                    {(queueDetails.waitingPatients?.length || 0) + 
                     (queueDetails.servedPatients?.length || 0) + 
                     (queueDetails.currentPatient ? 1 : 0)}
                  </div>
                  <div>Total</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <FontAwesomeIcon icon={faUser} className="me-2" />
              Current Patient
            </Card.Header>
            <Card.Body>
              {queueDetails.currentPatient ? (
                <div>
                  <Row className="align-items-center">
                    <Col>
                      <h5>{queueDetails.currentPatient.name}</h5>
                      <p className="mb-0">
                        <strong>Queue Position:</strong> {queueDetails.currentPatient.queuePosition}<br />
                        <strong>Joined At:</strong> {new Date(queueDetails.currentPatient.joinedAt).toLocaleString()}<br />
                        <strong>Status:</strong> {getStatusBadge(queueDetails.currentPatient.status)}
                      </p>
                    </Col>
                    <Col xs="auto">
                      <div className="d-flex gap-2">
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Mark this patient as served</Tooltip>}
                        >
                          <Button 
                            variant="success" 
                            onClick={() => handleMarkAsServed(queueDetails.currentPatient.id)}
                          >
                            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                            Mark as Served
                          </Button>
                        </OverlayTrigger>
                        <PatientStatusDropdown 
                          patient={queueDetails.currentPatient}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-0">No patient is currently being served.</p>
                  {queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 && (
                    <Button 
                      variant="primary" 
                      className="mt-3"
                      onClick={() => handleCallNext(queueDetails.waitingPatients[0].id)}
                    >
                      Call Next Patient
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="bg-secondary text-white">
              <FontAwesomeIcon icon={faUsers} className="me-2" />
              Waiting Patients
            </Card.Header>
            <Card.Body>
              {queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 ? (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Name</th>
                      <th>Joined At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueDetails.waitingPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td>{patient.queuePosition}</td>
                        <td>{patient.name}</td>
                        <td>{new Date(patient.joinedAt).toLocaleString()}</td>
                        <td>{getStatusBadge(patient.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Call this patient next</Tooltip>}
                            >
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleCallNext(patient.id)}
                              >
                                <FontAwesomeIcon icon={faUser} />
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Notify patient</Tooltip>}
                            >
                              <Button 
                                variant="info" 
                                size="sm"
                                onClick={() => handleMarkAsNotified(patient.id)}
                              >
                                <FontAwesomeIcon icon={faBell} />
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Change position in queue</Tooltip>}
                            >
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => openPositionModal(patient)}
                              >
                                <FontAwesomeIcon icon={faArrowUp} />
                              </Button>
                            </OverlayTrigger>
                            
                            <PatientStatusDropdown 
                              patient={patient}
                              onStatusChange={handleStatusChange}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  <p className="mb-0">No patients are waiting in the queue.</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-success text-white">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Recently Served Patients
            </Card.Header>
            <Card.Body>
              {queueDetails.servedPatients && queueDetails.servedPatients.length > 0 ? (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Name</th>
                      <th>Joined At</th>
                      <th>Served At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueDetails.servedPatients.slice(0, 5).map((patient) => (
                      <tr key={patient.id}>
                        <td>{patient.queuePosition}</td>
                        <td>{patient.name}</td>
                        <td>{new Date(patient.joinedAt).toLocaleString()}</td>
                        <td>{patient.servedAt ? new Date(patient.servedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  <p className="mb-0">No patients have been served yet.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QueueDetails;
