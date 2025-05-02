import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { getQueueDetails, createQueue, updateQueue } from '../../services/api';
import { getHospitals, getDepartmentsByHospital } from '../../services/hospitalService';

const QueueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: '',
    hospitalId: ''
  });
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch hospitals
        const hospitalsResponse = await getHospitals();
        setHospitals(hospitalsResponse.data);
        
        // If in edit mode, fetch queue details
        if (isEditMode) {
          // Convert id to number to ensure correct type is passed to API
          const queueId = parseInt(id, 10);
          if (isNaN(queueId)) {
            setError('Invalid queue ID');
            setLoading(false);
            return;
          }
          const queueResponse = await getQueueDetails(queueId);
          
          // Get the department to find its hospital
          const departmentsResponse = await getDepartmentsByHospital(queueResponse.data.department.hospitalId);
          setDepartments(departmentsResponse.data);
          
          setFormData({
            name: queueResponse.data.name,
            description: queueResponse.data.description,
            departmentId: queueResponse.data.departmentId,
            hospitalId: queueResponse.data.department.hospitalId
          });
        } else if (hospitalsResponse.data.length > 0) {
          // Set default hospital if creating new queue
          const defaultHospitalId = hospitalsResponse.data[0].id;
          setFormData(prevState => ({
            ...prevState,
            hospitalId: defaultHospitalId
          }));
          
          // Fetch departments for the default hospital
          await fetchDepartmentsForHospital(defaultHospitalId);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error fetching data. Please try again later.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchInitialData();
  }, [id, isEditMode]);
  
  const fetchDepartmentsForHospital = async (hospitalId) => {
    if (!hospitalId) {
      setDepartments([]);
      return;
    }
    
    try {
      setLoadingDepartments(true);
      const response = await getDepartmentsByHospital(hospitalId);
      setDepartments(response.data);
      
      // If departments exist, set the first one as default
      if (response.data.length > 0) {
        setFormData(prevState => ({
          ...prevState,
          departmentId: response.data[0].id
        }));
      } else {
        setFormData(prevState => ({
          ...prevState,
          departmentId: ''
        }));
      }
      
      setLoadingDepartments(false);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle special case for hospitalId to fetch departments
    if (name === 'hospitalId' && value) {
      fetchDepartmentsForHospital(value);
    }
    
    setFormData(prevState => ({
      ...prevState,
      [name]: (name === 'departmentId' || name === 'hospitalId') ? parseInt(value, 10) : value
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

    try {
      setSaving(true);
      let createdQueueId;
      
      if (isEditMode) {
        await updateQueue(id, formData);
        createdQueueId = id;
      } else {
        // For new queue creation, capture the response to get the new queue ID
        const response = await createQueue(formData);
        createdQueueId = response.data.id;
        console.log('Queue created successfully with ID:', createdQueueId);
        
        // Add a small delay to ensure the queue is properly saved in the database
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Navigate to the queue details page with the queue ID
      if (createdQueueId) {
        navigate(`/admin/queues/${createdQueueId}`);
      } else {
        navigate('/admin/queues');
      }
    } catch (err) {
      let errorMessage = `Error ${isEditMode ? 'updating' : 'creating'} queue.`;
      
      if (err.response) {
        errorMessage += ` Server responded with: ${err.response.status} - ${err.response.data.message || err.response.statusText}`;
      } else if (err.request) {
        errorMessage += ' No response received from server. Please check your connection.';
      } else {
        errorMessage += ` ${err.message}`;
      }
      
      setError(errorMessage);
      setSaving(false);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} queue:`, err);
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

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>
            <FontAwesomeIcon icon={faQrcode} className="me-2" />
            {isEditMode ? 'Edit Queue' : 'Add New Queue'}
          </h2>
          <p className="text-muted">
            {isEditMode 
              ? 'Update queue information' 
              : 'Create a new queue in the system'}
          </p>
        </Col>
        <Col xs="auto" className="align-self-center">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/queues')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Queues
          </Button>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {hospitals.length === 0 ? (
        <Alert variant="warning">
          <h5>No Hospitals Available</h5>
          <p>You need to create at least one hospital before creating a queue.</p>
          <div className="mt-2">
            <Link to="/admin/hospitals/new" className="btn btn-primary">
              Create Hospital
            </Link>
          </div>
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} md="6" controlId="queueName">
                  <Form.Label>Queue Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter queue name"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Queue name is required.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group as={Col} md="6" controlId="hospitalId">
                  <Form.Label>Hospital</Form.Label>
                  <Form.Select
                    name="hospitalId"
                    value={formData.hospitalId}
                    onChange={handleChange}
                    required
                    disabled={isEditMode}
                  >
                    <option value="">Select Hospital</option>
                    {hospitals.map(hospital => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select a hospital.
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>
              
              <Form.Group className="mb-3" controlId="departmentId">
                <Form.Label>Department</Form.Label>
                {loadingDepartments ? (
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading departments...</span>
                  </div>
                ) : (
                  <Form.Select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                    disabled={!formData.hospitalId || loadingDepartments}
                  >
                    <option value="">Select Department</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
                {departments.length === 0 && formData.hospitalId && !loadingDepartments && (
                  <Alert variant="warning" className="mt-2 p-2">
                    <small>
                      No departments available for this hospital. 
                      <Link to={`/admin/hospitals/${formData.hospitalId}/departments/new`}>
                        Create a department
                      </Link> first.
                    </small>
                  </Alert>
                )}
                <Form.Control.Feedback type="invalid">
                  Please select a department.
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="queueDescription">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Enter queue description (optional)"
                />
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button 
                  variant="secondary" 
                  className="me-2"
                  onClick={() => navigate('/admin/queues')}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={saving || departments.length === 0}
                >
                  {saving ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="me-2" />
                      {isEditMode ? 'Update Queue' : 'Save Queue'}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default QueueForm;
