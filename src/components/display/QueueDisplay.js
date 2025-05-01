import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Alert } from 'react-bootstrap';
import { getQueueDetails } from '../../services/api';
import WebSocketService from '../../services/websocket';
import { QRCodeSVG } from 'qrcode.react';

const QueueDisplay = () => {
  const { id } = useParams();
  const [queueDetails, setQueueDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      const response = await getQueueDetails(queueId);
      setQueueDetails(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching queue details. Please try again later.');
      setLoading(false);
      console.error('Error fetching queue details:', err);
    }
  };

  useEffect(() => {
    fetchQueueDetails();

    // Subscribe to queue updates via WebSocket
    const subscription = WebSocketService.subscribeToQueue(id, (data) => {
      fetchQueueDetails();
    });

    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      // Unsubscribe when component unmounts
      if (subscription) {
        WebSocketService.unsubscribe(`/topic/queue/${id}`);
      }
      clearInterval(timeInterval);
    };
  }, [id]);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading queue display...</p>
      </Container>
    );
  }

  if (error || !queueDetails) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error || 'Error loading queue display. Please try again later.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <div className="bg-primary text-white p-3">
        <Row className="align-items-center">
          <Col>
            <h1 className="mb-0">{queueDetails.name}</h1>
            <p className="mb-0">{queueDetails.departmentName}</p>
          </Col>
          <Col xs="auto">
            <h3 className="mb-0">{currentTime.toLocaleTimeString()}</h3>
            <p className="mb-0">{currentTime.toLocaleDateString()}</p>
          </Col>
        </Row>
      </div>

      <Row className="m-3">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <h3 className="mb-0">Now Serving</h3>
            </Card.Header>
            <Card.Body className="text-center">
              {queueDetails.currentPatient ? (
                <div>
                  <h1 className="display-1 fw-bold text-success mb-3">
                    {queueDetails.currentPatient.queuePosition}
                  </h1>
                  <h3>{queueDetails.currentPatient.name}</h3>
                </div>
              ) : (
                <h3 className="text-muted py-5">No patient is currently being served</h3>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-secondary text-white">
              <h3 className="mb-0">Next in Line</h3>
            </Card.Header>
            <Card.Body>
              {queueDetails.waitingPatients && queueDetails.waitingPatients.length > 0 ? (
                <Table striped bordered responsive className="mb-0">
                  <thead>
                    <tr className="bg-light">
                      <th className="text-center" style={{ width: '30%' }}>Position</th>
                      <th>Patient Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueDetails.waitingPatients.slice(0, 5).map((patient) => (
                      <tr key={patient.id}>
                        <td className="text-center fs-4 fw-bold">{patient.queuePosition}</td>
                        <td className="fs-5">{patient.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-0 fs-5">No patients are waiting in the queue</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h3 className="mb-0">Queue Statistics</h3>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col xs={4}>
                  <div className="fs-1 fw-bold text-primary">
                    {queueDetails.currentPatient ? 1 : 0}
                  </div>
                  <div>Serving</div>
                </Col>
                <Col xs={4}>
                  <div className="fs-1 fw-bold text-secondary">
                    {queueDetails.waitingPatients?.length || 0}
                  </div>
                  <div>Waiting</div>
                </Col>
                <Col xs={4}>
                  <div className="fs-1 fw-bold text-success">
                    {queueDetails.servedPatients?.length || 0}
                  </div>
                  <div>Served</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-warning text-dark">
              <h3 className="mb-0">Join This Queue</h3>
            </Card.Header>
            <Card.Body className="text-center">
              <p className="mb-3">Scan the QR code below to join this queue</p>
              <div className="mb-3">
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
              <p className="mb-0 small">
                Or visit: <br />
                <strong>http://localhost:3000/join-queue/{queueDetails.qrCodeId}</strong>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="bg-dark text-white p-2 text-center fixed-bottom">
        <p className="mb-0 small">Hospital Queue Management System | Queue ID: {queueDetails.id} | Last Updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </Container>
  );
};

export default QueueDisplay;
