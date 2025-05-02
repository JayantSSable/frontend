import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHospital, faEdit, faArrowLeft, faPlus, 
  faBuilding, faTrash, faQrcode 
} from '@fortawesome/free-solid-svg-icons';
import { getHospitalById, getDepartmentsByHospital } from '../../services/hospitalService';
import { deleteDepartment } from '../../services/api';

const HospitalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHospitalData();
  }, [id]);

  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      
      // Fetch hospital details
      const hospitalResponse = await getHospitalById(id);
      setHospital(hospitalResponse.data);
      
      // Fetch departments for this hospital
      const departmentsResponse = await getDepartmentsByHospital(id);
      setDepartments(departmentsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching hospital data:', err);
      setError('Failed to load hospital information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department? This will also delete all queues and patient data associated with this department.')) {
      return;
    }
    
    try {
      await deleteDepartment(departmentId);
      // Refresh departments list
      fetchHospitalData();
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Failed to delete department. Please try again later.');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!hospital) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Hospital not found or has been deleted.
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate('/admin/hospitals')}
        >
          Back to Hospitals
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>
            <FontAwesomeIcon icon={faHospital} className="me-2" />
            {hospital.name}
          </h2>
          <p className="text-muted">{hospital.address}</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2 align-items-center">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/hospitals')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Hospitals
          </Button>
          <Link 
            to={`/admin/hospitals/${id}/edit`} 
            className="btn btn-primary"
          >
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit Hospital
          </Link>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs defaultActiveKey="details" className="mb-4">
        <Tab eventKey="details" title="Hospital Details">
          <Card>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5>Contact Information</h5>
                  <p><strong>Phone:</strong> {hospital.contactNumber || 'Not provided'}</p>
                  <p><strong>Email:</strong> {hospital.email || 'Not provided'}</p>
                </Col>
                <Col md={6}>
                  <h5>Description</h5>
                  <p>{hospital.description || 'No description available'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="departments" title="Departments">
          <Row className="mb-3">
            <Col>
              <h5>
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                Departments
              </h5>
            </Col>
            <Col xs="auto">
              <Link 
                to={`/admin/hospitals/${id}/departments/new`} 
                className="btn btn-primary btn-sm"
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Department
              </Link>
            </Col>
          </Row>

          {departments.length === 0 ? (
            <Card className="text-center p-4">
              <Card.Body>
                <h5>No Departments Found</h5>
                <p>This hospital doesn't have any departments yet.</p>
                <Link 
                  to={`/admin/hospitals/${id}/departments/new`} 
                  className="btn btn-primary"
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add First Department
                </Link>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Queues</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department, index) => (
                      <tr key={department.id}>
                        <td>{index + 1}</td>
                        <td>
                          <Link to={`/admin/departments/${department.id}`} className="fw-bold text-decoration-none">
                            {department.name}
                          </Link>
                        </td>
                        <td>{department.description || 'No description'}</td>
                        <td>{department.queues?.length || 0}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link 
                              to={`/admin/departments/${department.id}/queues`} 
                              className="btn btn-sm btn-outline-primary"
                              title="View Queues"
                            >
                              <FontAwesomeIcon icon={faQrcode} />
                            </Link>
                            <Link 
                              to={`/admin/departments/${department.id}/edit`} 
                              className="btn btn-sm btn-outline-secondary"
                              title="Edit Department"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Link>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              title="Delete Department"
                              onClick={() => handleDeleteDepartment(department.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default HospitalDetails;
