import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Table, Badge, Alert, Form, Modal, InputGroup, OverlayTrigger, Tooltip, Container, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowLeft, faCheckCircle, faUser, faUsers, faArrowUp, faArrowDown, faBell, faClock, faHospital, faQrcode, faClipboard, faUserClock, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
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

  useEffect(() => {
    console.log('QueueDetails component mounted, fetching initial data for queue:', id);
    
    // Initial data fetch with retry
    fetchWithRetry();

    // Subscribe to queue updates via WebSocket
    console.log(`Subscribing to WebSocket updates for queue ${id}`);
    const subscription = WebSocketService.subscribeToQueue(id, (data) => {
      console.log('Received queue update via WebSocket:', data);
      
      // Always fetch fresh data regardless of message type
      fetchQueueDetails();
    });

    return () => {
      // Unsubscribe when component unmounts
      console.log(`Unsubscribing from WebSocket updates for queue ${id}`);
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
  
  // Calculate estimated wait time based on number of patients and average service time
  const calculateEstimatedWaitTime = (position) => {
    const avgServiceTime = 5; // Average minutes per patient
    return position * avgServiceTime;
  };
  
  return (
    <Container fluid className="py-4">
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
          <h2 className="mb-1">
            <FontAwesomeIcon icon={faClipboard} className="me-2 text-primary" />
            {queueDetails?.name || 'Queue Details'}
          </h2>
          {queueDetails?.department && (
            <p className="text-muted mb-0">
              <FontAwesomeIcon icon={faHospital} className="me-2" />
              {queueDetails.department.name} Department
            </p>
          )}
        </div>
        <div>
          <Link to="/admin/queues" className="btn btn-outline-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Queues
          </Link>
          <Link to={`/admin/queues/edit/${id}`} className="btn btn-primary">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit Queue
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {updateSuccess && <Alert variant="success">Patient status updated successfully!</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading queue details...</p>
        </div>
      ) : queueDetails ? (
        <Row>
          <Col lg={4}>
            {/* Queue Stats Card */}
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Queue Statistics
              </Card.Header>
              <Card.Body>
                <Row className="text-center mb-4">
                  <Col xs={4}>
                    <div className="queue-stat-circle bg-secondary">
                      <h3>{queueDetails.waitingPatients?.length || 0}</h3>
                    </div>
                    <p className="mt-2 mb-0">Waiting</p>
                  </Col>
                  <Col xs={4}>
                    <div className="queue-stat-circle bg-primary">
                      <h3>{queueDetails.servingPatients?.length || (queueDetails.currentPatient ? 1 : 0)}</h3>
                    </div>
                    <p className="mt-2 mb-0">Serving</p>
                  </Col>
                  <Col xs={4}>
                    <div className="queue-stat-circle bg-success">
                      <h3>{queueDetails.servedPatients?.length || 0}</h3>
                    </div>
                    <p className="mt-2 mb-0">Served</p>
                  </Col>
                </Row>
                
                <div className="mb-3">
                  <p className="mb-1"><strong>Average Wait Time:</strong></p>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faClock} className="me-2 text-warning" />
                    <span>~{queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 ? calculateEstimatedWaitTime(1) : '0'} minutes per patient</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="mb-1"><strong>Queue Status:</strong></p>
                  <ProgressBar className="mb-2">
                    <ProgressBar variant="secondary" now={queueDetails.waitingPatients?.length || 0} key={1} />
                    <ProgressBar variant="primary" now={queueDetails.servingPatients?.length || (queueDetails.currentPatient ? 1 : 0)} key={2} />
                    <ProgressBar variant="success" now={queueDetails.servedPatients?.length || 0} key={3} />
                  </ProgressBar>
                  <div className="d-flex justify-content-between small">
                    <span>Created: {new Date(queueDetails.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(queueDetails.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <hr />
                
                <p className="text-muted">{queueDetails.description}</p>
              </Card.Body>
            </Card>

            {/* QR Code Card */}
            <Card className="mb-4">
              <Card.Header className="bg-info text-white">
                <FontAwesomeIcon icon={faQrcode} className="me-2" />
                Queue Registration
              </Card.Header>
              <Card.Body className="text-center">
                <div className="qr-container mb-3">
                  {!queueDetails.qrCodeId || queueDetails.qrCodeId === 'undefined' ? (
                    <div className="alert alert-warning">
                      <FontAwesomeIcon icon={faQrcode} className="me-2" />
                      No QR code has been generated for this queue yet. Edit the queue to generate one.
                    </div>
                  ) : (
                    <QRCodeSVG 
                      value={`${window.location.origin}/#/join-queue/${queueDetails.qrCodeId}`} 
                      size={180} 
                      level="H"
                      className="pulse-animation"
                    />
                  )}
                </div>
                <p className="mb-3">
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  Scan this QR code to join the queue
                </p>
                <div className="d-grid">
                  <Button 
                    variant="outline-primary"
                    onClick={() => {
                      // Check if we have a valid QR code ID
                      if (queueDetails.qrCodeId && queueDetails.qrCodeId !== 'undefined') {
                        // Use the existing QR code ID
                        // Use hash routing to prevent redirect issues in production
                        const url = `${window.location.origin}/#/join-queue/${queueDetails.qrCodeId}`;
                        console.log('Using existing QR code ID for registration:', queueDetails.qrCodeId);
                        console.log('Opening registration URL:', url);
                        window.open(url, '_blank');
                      } else {
                        // Generate a direct queue ID based URL
                        // Format: direct-{queueId} - this will be handled specially in the registration component
                        const directId = `direct-${queueDetails.id}`;
                        console.log('Using direct queue ID for registration:', directId);
                        // Use hash routing to prevent redirect issues in production
                        const url = `${window.location.origin}/#/join-queue/${directId}`;
                        console.log('Opening registration URL:', url);
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Open Registration Page
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            {/* Waiting Patients Card */}
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  Waiting Patients
                </div>
                <Badge bg="light" text="dark" pill>
                  {queueDetails.waitingPatients?.length || 0} Patients
                </Badge>
              </Card.Header>
              <Card.Body>
                {queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 ? (
                  <div className="waiting-patients-container">
                    {queueDetails.waitingPatients.map((patient) => (
                      <div 
                        key={patient.id} 
                        className={`queue-card mb-3 p-3 rounded ${patient.status ? `status-${patient.status.toLowerCase()}` : ''}`}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="queue-position">{patient.queuePosition}</div>
                            <div>
                              <h5 className="mb-0">{patient.name}</h5>
                              <div className="d-flex align-items-center mt-1">
                                <div className="me-3 small">
                                  <FontAwesomeIcon icon={faClock} className="me-1 text-muted" />
                                  <span>{new Date(patient.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="small">
                                  <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" />
                                  <span>{patient.phoneNumber}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            {getStatusBadge(patient.status)}
                            <div className="ms-3 d-flex gap-2">
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
                                  variant="warning" 
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faUsers} className="text-muted mb-3" size="3x" />
                    <h5>No patients are waiting in the queue</h5>
                    <p className="text-muted">Patients will appear here once they join the queue</p>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        const url = `${window.location.origin}/#/join-queue/${queueDetails.qrCodeId || `direct-${queueDetails.id}`}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Add Test Patient
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Currently Serving Card */}
            <Card>
              <Card.Header className="bg-primary text-white">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Currently Serving
              </Card.Header>
              <Card.Body>
                {/* Check both servingPatients (if available) and currentPatient */}
                {((queueDetails.servingPatients && queueDetails.servingPatients.length > 0) || queueDetails.currentPatient) ? (
                  <div className="currently-serving-container">
                    {/* If servingPatients exists, use that, otherwise create an array with currentPatient */}
                    {(queueDetails.servingPatients || (queueDetails.currentPatient ? [queueDetails.currentPatient] : [])).map((patient) => (
                      <div key={patient.id} className="queue-card status-serving p-4 rounded">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="queue-position">{patient.queuePosition}</div>
                            <div>
                              <h4 className="mb-0">{patient.name}</h4>
                              <div className="d-flex align-items-center mt-2">
                                <div className="me-3">
                                  <FontAwesomeIcon icon={faClock} className="me-1 text-muted" />
                                  <span>Joined: {new Date(patient.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div>
                                  <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" />
                                  <span>{patient.phoneNumber}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Button 
                              variant="success" 
                              className="me-2"
                              onClick={() => handleMarkAsServed(patient.id)}
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                              Mark as Served
                            </Button>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Change position in queue</Tooltip>}
                            >
                              <Button 
                                variant="secondary" 
                                onClick={() => openPositionModal(patient)}
                              >
                                <FontAwesomeIcon icon={faArrowUp} />
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FontAwesomeIcon icon={faUser} className="text-muted mb-2" size="2x" />
                    <p className="mb-0">No patients are currently being served.</p>
                    {queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 && (
                      <Button 
                        variant="primary" 
                        className="mt-3"
                        onClick={() => handleCallNext(queueDetails.waitingPatients[0].id)}
                      >
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        Call Next Patient
                      </Button>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Recently Served Patients Card */}
            <Card className="mt-4">
              <Card.Header className="bg-success text-white">
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                Recently Served
              </Card.Header>
              <Card.Body className="p-0">
                {queueDetails.servedPatients && queueDetails.servedPatients.length > 0 ? (
                  <div className="served-patients-list">
                    {queueDetails.servedPatients.slice(0, 5).map((patient) => (
                      <div key={patient.id} className="served-patient-item">
                        <div className="d-flex align-items-center p-3 border-bottom">
                          <div className="queue-position">{patient.queuePosition}</div>
                          <div>
                            <h6 className="mb-0">{patient.name}</h6>
                            <div className="d-flex align-items-center small text-muted">
                              <FontAwesomeIcon icon={faUserClock} className="me-1" />
                              <span>Served: {new Date(patient.servedAt || patient.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-muted mb-2" size="2x" />
                    <p className="mb-0">No patients have been served yet.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Alert variant="warning">
          <FontAwesomeIcon icon={faClipboard} className="me-2" />
          Queue not found or has been deleted.
        </Alert>
      )}
    </Container>
  );
};

export default QueueDetails;
