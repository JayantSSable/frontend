import React, { useState } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TestQueueButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const createTestQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to create a test queue
      const response = await axios.get('http://localhost:8080/api/test/create-test-queue');
      
      console.log('Test queue created:', response.data);
      
      // Navigate to the patient registration page with the test queue QR code
      // Use the fixed TEST001 ID to avoid any undefined values
      navigate('/join-queue/TEST001');
      
    } catch (err) {
      console.error('Error creating test queue:', err);
      setError('Failed to create test queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center my-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Button 
        variant="success" 
        size="lg" 
        onClick={createTestQueue}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Creating Test Queue...
          </>
        ) : (
          'Create Test Queue & Register'
        )}
      </Button>
      
      <p className="text-muted mt-2">
        Click to create a test queue and register as a patient
      </p>
    </div>
  );
};

export default TestQueueButton;
