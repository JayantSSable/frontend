import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faHospital } from '@fortawesome/free-solid-svg-icons';
import { getHospitalById, createHospital, updateHospital } from '../../services/hospitalService';

const HospitalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [hospital, setHospital] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchHospital();
    }
  }, [id]);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      const response = await getHospitalById(id);
      setHospital(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching hospital:', err);
      setError('Failed to load hospital details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHospital(prevState => ({
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
        await updateHospital(id, hospital);
      } else {
        await createHospital(hospital);
      }
      
      navigate('/admin/hospitals');
    } catch (err) {
      console.error('Error saving hospital:', err);
      setError('Failed to save hospital. Please try again later.');
      setSaving(false);
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
            <FontAwesomeIcon icon={faHospital} className="me-2" />
            {isEditMode ? 'Edit Hospital' : 'Add New Hospital'}
          </h2>
          <p className="text-muted">
            {isEditMode 
              ? 'Update hospital information' 
              : 'Create a new hospital in the system'}
          </p>
        </Col>
        <Col xs="auto" className="align-self-center">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/hospitals')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Hospitals
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md="6" controlId="hospitalName">
                <Form.Label>Hospital Name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  name="name"
                  value={hospital.name}
                  onChange={handleChange}
                  placeholder="Enter hospital name"
                />
                <Form.Control.Feedback type="invalid">
                  Hospital name is required.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md="6" controlId="contactNumber">
                <Form.Label>Contact Number</Form.Label>
                <Form.Control
                  type="text"
                  name="contactNumber"
                  value={hospital.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                />
              </Form.Group>
            </Row>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={hospital.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
              <Form.Control.Feedback type="invalid">
                Please provide a valid email.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="address">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={hospital.address}
                onChange={handleChange}
                placeholder="Enter hospital address"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={hospital.description}
                onChange={handleChange}
                placeholder="Enter hospital description"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate('/admin/hospitals')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
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
                    {isEditMode ? 'Update Hospital' : 'Save Hospital'}
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

export default HospitalForm;
