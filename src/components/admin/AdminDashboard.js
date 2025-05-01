import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital, faList, faUserPlus, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { getDepartments, getQueues } from '../../services/api';
import QRCodeGenerator from './QRCodeGenerator';

const AdminDashboard = () => {
  const [departments, setDepartments] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [departmentsResponse, queuesResponse] = await Promise.all([
          getDepartments(),
          getQueues()
        ]);
        setDepartments(departmentsResponse.data);
        setQueues(queuesResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data. Please try again later.');
        setLoading(false);
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>
      
      {/* QR Code Generator */}
      <QRCodeGenerator />
      
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faHospital} size="3x" className="mb-3 text-primary" />
              <Card.Title>Departments</Card.Title>
              <Card.Text>
                {departments.length} departments
              </Card.Text>
              <Link to="/admin/departments">
                <Button variant="outline-primary">Manage Departments</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faList} size="3x" className="mb-3 text-success" />
              <Card.Title>Queues</Card.Title>
              <Card.Text>
                {queues.length} queues
              </Card.Text>
              <Link to="/admin/queues">
                <Button variant="outline-success">Manage Queues</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faUserPlus} size="3x" className="mb-3 text-info" />
              <Card.Title>Create Department</Card.Title>
              <Card.Text>
                Add a new department
              </Card.Text>
              <Link to="/admin/departments/new">
                <Button variant="outline-info">Create Department</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faQrcode} size="3x" className="mb-3 text-warning" />
              <Card.Title>Create Queue</Card.Title>
              <Card.Text>
                Add a new queue
              </Card.Text>
              <Link to="/admin/queues/new">
                <Button variant="outline-warning">Create Queue</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <h2 className="mb-3">Recent Queues</h2>
      {queues.length === 0 ? (
        <div className="alert alert-info">No queues available. Create your first queue!</div>
      ) : (
        <Row>
          {queues.slice(0, 4).map(queue => (
            <Col md={6} lg={3} key={queue.id} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{queue.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Department: {departments.find(d => d.id === queue.departmentId)?.name || 'Unknown'}
                  </Card.Subtitle>
                  <Card.Text>
                    {queue.description || 'No description available'}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <Link to={`/admin/queues/${queue.id}`}>
                    <Button variant="primary" size="sm">View Details</Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default AdminDashboard;
