import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { getDepartmentById, createDepartment, updateDepartment } from '../../services/api';

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const fetchDepartment = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const response = await getDepartmentById(id);
          setFormData(response.data);
          setLoading(false);
        } catch (err) {
          setError('Error fetching department. Please try again later.');
          setLoading(false);
          console.error('Error fetching department:', err);
        }
      }
    };

    fetchDepartment();
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
      setLoading(true);
      if (isEditMode) {
        await updateDepartment(id, formData);
      } else {
        await createDepartment(formData);
      }
      setLoading(false);
      navigate('/admin/departments');
    } catch (err) {
      setError(`Error ${isEditMode ? 'updating' : 'creating'} department. Please try again later.`);
      setLoading(false);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} department:`, err);
    }
  };

  if (loading && isEditMode) {
    return <div className="text-center mt-5">Loading department data...</div>;
  }

  return (
    <div>
      <h1>{isEditMode ? 'Edit Department' : 'Create Department'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mt-3">
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="departmentName">
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
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/admin/departments')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Department'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DepartmentForm;
