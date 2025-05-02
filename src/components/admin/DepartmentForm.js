import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { getDepartmentById, updateDepartment } from '../../services/api';
import { getHospitals, createDepartmentInHospital } from '../../services/hospitalService';

const DepartmentForm = () => {
  const { id, hospitalId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const isHospitalContext = !!hospitalId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hospitalId: hospitalId || ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hospitals
        setLoadingHospitals(true);
        const hospitalsResponse = await getHospitals();
        setHospitals(hospitalsResponse.data);
        setLoadingHospitals(false);
        
        // Fetch department if in edit mode
        if (isEditMode) {
          setLoading(true);
          const response = await getDepartmentById(id);
          setFormData({
            ...response.data,
            hospitalId: response.data.hospitalId || ''
          });
          setLoading(false);
        }
      } catch (err) {
        const errorMsg = isEditMode 
          ? 'Error fetching department data.'
          : 'Error fetching hospitals.';
        setError(`${errorMsg} Please try again later.`);
        setLoading(false);
        setLoadingHospitals(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
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
      
      if (isEditMode) {
        await updateDepartment(id, formData);
        navigate(`/admin/hospitals/${formData.hospitalId}`);
      } else if (isHospitalContext) {
        // If creating from hospital context, use the hospital-specific endpoint
        await createDepartmentInHospital(hospitalId, formData);
        navigate(`/admin/hospitals/${hospitalId}`);
      } else {
        // Regular department creation with selected hospital
        await createDepartmentInHospital(formData.hospitalId, formData);
        navigate(`/admin/hospitals/${formData.hospitalId}`);
      }
    } catch (err) {
      setError(`Error ${isEditMode ? 'updating' : 'creating'} department. Please try again later.`);
      setSaving(false);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} department:`, err);
    }
  };

  if ((loading && isEditMode) || loadingHospitals) {
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
            <FontAwesomeIcon icon={faBuilding} className="me-2" />
            {isEditMode ? 'Edit Department' : 'Add New Department'}
          </h2>
          <p className="text-muted">
            {isEditMode 
              ? 'Update department information' 
              : 'Create a new department in the system'}
          </p>
        </Col>
        <Col xs="auto" className="align-self-center">
          <Button 
            variant="outline-secondary" 
            onClick={() => isHospitalContext 
              ? navigate(`/admin/hospitals/${hospitalId}`) 
              : navigate('/admin/hospitals')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            {isHospitalContext ? 'Back to Hospital' : 'Back to Hospitals'}
          </Button>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="departmentName">
                <Form.Label>Department Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter department name"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Department name is required.
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group as={Col} md="6" controlId="hospitalId">
                <Form.Label>Hospital</Form.Label>
                <Form.Select
                  name="hospitalId"
                  value={formData.hospitalId}
                  onChange={handleChange}
                  required
                  disabled={isHospitalContext}
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
            
            <Form.Group className="mb-3" controlId="departmentDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Enter department description (optional)"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => isHospitalContext 
                  ? navigate(`/admin/hospitals/${hospitalId}`) 
                  : navigate('/admin/hospitals')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={saving}
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
                    {isEditMode ? 'Update Department' : 'Save Department'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DepartmentForm;
