import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHospital, faList, faUserPlus, faQrcode, faBuilding, 
  faPlus, faTachometerAlt, faStethoscope
} from '@fortawesome/free-solid-svg-icons';
import { getDepartments, getQueues } from '../../services/api';
import { getHospitals } from '../../services/hospitalService';
import QRCodeGenerator from './QRCodeGenerator';

const AdminDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hospitalsResponse, departmentsResponse, queuesResponse] = await Promise.all([
          getHospitals(),
          getDepartments(),
          getQueues()
        ]);
        setHospitals(hospitalsResponse.data);
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
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-3">{error}</Alert>;
  }

  return (
    <div>
      <h1 className="mb-4">
        <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
        Admin Dashboard
      </h1>
      
      {/* QR Code Generator */}
      <QRCodeGenerator />
      
      {/* Main Management Cards */}
      <h2 className="mb-3 mt-4">
        <FontAwesomeIcon icon={faStethoscope} className="me-2" />
        System Management
      </h2>
      
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0">
            <Card.Body>
              <FontAwesomeIcon icon={faHospital} size="3x" className="mb-3 text-primary" />
              <Card.Title>Hospitals</Card.Title>
              <Card.Text>
                {hospitals.length} hospitals
              </Card.Text>
              <Link to="/admin/hospitals">
                <Button variant="outline-primary">Manage Hospitals</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0">
            <Card.Body>
              <FontAwesomeIcon icon={faBuilding} size="3x" className="mb-3 text-success" />
              <Card.Title>Departments</Card.Title>
              <Card.Text>
                {departments.length} departments
              </Card.Text>
              <Link to="/admin/departments">
                <Button variant="outline-success">Manage Departments</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0">
            <Card.Body>
              <FontAwesomeIcon icon={faQrcode} size="3x" className="mb-3 text-info" />
              <Card.Title>Queues</Card.Title>
              <Card.Text>
                {queues.length} queues
              </Card.Text>
              <Link to="/admin/queues">
                <Button variant="outline-info">Manage Queues</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-0 bg-light">
            <Card.Body>
              <FontAwesomeIcon icon={faPlus} size="3x" className="mb-3 text-dark" />
              <Card.Title>Quick Actions</Card.Title>
              <div className="d-grid gap-2">
                <Link to="/admin/hospitals/new">
                  <Button variant="outline-dark" size="sm" className="mb-2 w-100">Add Hospital</Button>
                </Link>
                <Link to="/admin/departments/new">
                  <Button variant="outline-dark" size="sm" className="mb-2 w-100">Add Department</Button>
                </Link>
                <Link to="/admin/queues/new">
                  <Button variant="outline-dark" size="sm" className="w-100">Add Queue</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Hospitals Section */}
      <h2 className="mb-3 mt-4">
        <FontAwesomeIcon icon={faHospital} className="me-2" />
        Recent Hospitals
      </h2>
      
      {hospitals.length === 0 ? (
        <Alert variant="info">
          No hospitals available. <Link to="/admin/hospitals/new">Create your first hospital!</Link>
        </Alert>
      ) : (
        <Row>
          {hospitals.slice(0, 4).map(hospital => (
            <Col md={6} lg={3} key={hospital.id} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{hospital.name}</Card.Title>
                  <Card.Text>
                    {hospital.description ? (
                      hospital.description.length > 100 ? 
                        `${hospital.description.substring(0, 100)}...` : 
                        hospital.description
                    ) : 'No description available'}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between">
                  <small className="text-muted">
                    {hospital.departments?.length || 0} departments
                  </small>
                  <Link to={`/admin/hospitals/${hospital.id}`}>
                    <Button variant="primary" size="sm">View Details</Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Recent Queues Section */}
      <h2 className="mb-3 mt-4">
        <FontAwesomeIcon icon={faQrcode} className="me-2" />
        Recent Queues
      </h2>
      
      {queues.length === 0 ? (
        <Alert variant="info">
          No queues available. <Link to="/admin/queues/new">Create your first queue!</Link>
        </Alert>
      ) : (
        <Row>
          {queues.slice(0, 4).map(queue => (
            <Col md={6} lg={3} key={queue.id} className="mb-3">
              <Card className="h-100 shadow-sm">
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
