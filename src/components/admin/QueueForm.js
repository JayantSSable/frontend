import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { getQueueDetails, createQueue, updateQueue, getDepartments } from '../../services/api';

const QueueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch departments
        const departmentsResponse = await getDepartments();
        setDepartments(departmentsResponse.data);
        
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
          setFormData({
            name: queueResponse.data.name,
            description: queueResponse.data.description,
            departmentId: queueResponse.data.departmentId
          });
        } else if (departmentsResponse.data.length > 0) {
          // Set default department if creating new queue
          setFormData(prevState => ({
            ...prevState,
            departmentId: departmentsResponse.data[0].id
          }));
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error fetching data. Please try again later.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: name === 'departmentId' ? parseInt(value, 10) : value
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
      
      setLoading(false);
      
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
      setLoading(false);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} queue:`, err);
    }
  };

  if (loading && isEditMode) {
    return <div className="text-center mt-5">Loading queue data...</div>;
  }

  return (
    <div>
      <h1>{isEditMode ? 'Edit Queue' : 'Create Queue'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {departments.length === 0 ? (
        <Alert variant="warning">
          You need to create at least one department before creating a queue.
          <div className="mt-2">
            <Button 
              variant="primary" 
              onClick={() => navigate('/admin/departments/new')}
            >
              Create Department
            </Button>
          </div>
        </Alert>
      ) : (
        <Card className="mt-3">
          <Card.Body>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="queueName">
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
              
              <Form.Group className="mb-3" controlId="departmentId">
                <Form.Label>Department</Form.Label>
                <Form.Select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select a department.
                </Form.Control.Feedback>
              </Form.Group>
              
              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={() => navigate('/admin/queues')}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Queue'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default QueueForm;
