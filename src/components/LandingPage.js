import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital, faUserMd, faQrcode, faUsers } from '@fortawesome/free-solid-svg-icons';

const LandingPage = () => {
  return (
    <Container className="py-5">
      <Row className="mb-5 text-center">
        <Col>
          <h1 className="display-4 mb-3">Hospital Queue Management System</h1>
          <p className="lead">
            A modern solution for managing patient queues efficiently
          </p>
          
          <div className="mt-4">
            <p className="text-muted">
              Scan a queue QR code or visit a specific queue page to join a queue
            </p>
          </div>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col md={6} lg={4} className="mb-4">
          <Card className="h-100 shadow-sm text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faHospital} size="3x" className="text-primary mb-3" />
              <Card.Title>Hospital Management</Card.Title>
              <Card.Text>
                Efficiently manage departments and patient queues
              </Card.Text>
              <Link to="/admin" className="btn btn-outline-primary">Admin Dashboard</Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4} className="mb-4">
          <Card className="h-100 shadow-sm text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faUserMd} size="3x" className="text-info mb-3" />
              <Card.Title>Real-time Updates</Card.Title>
              <Card.Text>
                Receive notifications when your turn is approaching
              </Card.Text>
              <Link to="/admin/queues" className="btn btn-outline-info">View Queues</Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4} className="mb-4">
          <Card className="h-100 shadow-sm text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faUsers} size="3x" className="text-warning mb-3" />
              <Card.Title>Queue Management</Card.Title>
              <Card.Text>
                Manage patient positions and statuses
              </Card.Text>
              <Link to="/admin" className="btn btn-outline-warning">Manage Queues</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col className="text-center">
          <h3>How It Works</h3>
          <p className="lead">
            1. Admin creates departments and queues<br />
            2. Patients scan QR codes to register<br />
            3. Patients receive real-time updates about their status<br />
            4. Staff manages the queue and calls patients when it's their turn
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default LandingPage;
