import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { getQueues } from '../../services/api';

const QRCodeGenerator = () => {
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        setLoading(true);
        const response = await getQueues();
        setQueues(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching queues:', err);
        setError('Failed to load queues. Please try again later.');
        setLoading(false);
      }
    };

    fetchQueues();
  }, []);

  const handleQueueChange = (e) => {
    const queueId = e.target.value;
    setSelectedQueue(queueId);
    
    if (queueId) {
      const selectedQueueData = queues.find(q => q.id.toString() === queueId);
      if (selectedQueueData) {
        // Generate QR code URL using the queue's QR code ID
        const qrCodeUrl = `${window.location.origin}/join-queue/${selectedQueueData.qrCodeId}`;
        setQrCodeUrl(qrCodeUrl);
        
        // Generate direct URL using the queue ID
        const directUrl = `${window.location.origin}/join-queue/direct-${queueId}`;
        setDirectUrl(directUrl);
      }
    } else {
      setQrCodeUrl('');
      setDirectUrl('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
      });
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Queue QR Code Generator</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form.Group className="mb-4">
          <Form.Label>Select Queue</Form.Label>
          <Form.Select 
            value={selectedQueue} 
            onChange={handleQueueChange}
            disabled={loading}
          >
            <option value="">-- Select a Queue --</option>
            {queues.map(queue => (
              <option key={queue.id} value={queue.id}>
                {queue.name} ({queue.departmentName})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        
        {qrCodeUrl && (
          <>
            <h6 className="mb-3">Queue Registration Links</h6>
            <Row className="mb-4">
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>QR Code URL</Card.Header>
                  <Card.Body>
                    <p className="text-break mb-3">{qrCodeUrl}</p>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => copyToClipboard(qrCodeUrl)}
                    >
                      Copy URL
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>Direct URL</Card.Header>
                  <Card.Body>
                    <p className="text-break mb-3">{directUrl}</p>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => copyToClipboard(directUrl)}
                    >
                      Copy URL
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <div className="text-center mb-3">
              <h6>Test Registration</h6>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="primary"
                  href={qrCodeUrl}
                  target="_blank"
                >
                  Test QR Code Registration
                </Button>
                <Button 
                  variant="secondary"
                  href={directUrl}
                  target="_blank"
                >
                  Test Direct Registration
                </Button>
              </div>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default QRCodeGenerator;
