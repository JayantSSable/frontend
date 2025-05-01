import React, { useState, useEffect } from 'react';
import { Alert, Card, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle, faUser, faHourglass } from '@fortawesome/free-solid-svg-icons';
import WebSocketService from '../../services/websocket';

const PatientStatusNotification = ({ patientId, queueId }) => {
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!patientId || !queueId) return;

    // Subscribe to patient-specific notifications
    const patientSubscription = WebSocketService.subscribe(
      `/topic/patient/${patientId}`,
      (data) => {
        console.log('Received patient notification:', data);
        setNotification(data);
        setShowNotification(true);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 10000);
      }
    );

    // Subscribe to queue-wide notifications
    const queueSubscription = WebSocketService.subscribe(
      `/topic/queue/${queueId}`,
      (data) => {
        // Only process patient-specific notifications
        if (data && data.patientId === patientId) {
          console.log('Received queue notification for patient:', data);
          setNotification(data);
          setShowNotification(true);
          
          // Auto-hide notification after 10 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 10000);
        }
      }
    );

    return () => {
      // Unsubscribe when component unmounts
      if (patientSubscription) {
        WebSocketService.unsubscribe(`/topic/patient/${patientId}`);
      }
      if (queueSubscription) {
        WebSocketService.unsubscribe(`/topic/queue/${queueId}`);
      }
    };
  }, [patientId, queueId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
        return <Badge bg="secondary"><FontAwesomeIcon icon={faHourglass} className="me-1" /> Waiting</Badge>;
      case 'NOTIFIED':
        return <Badge bg="warning"><FontAwesomeIcon icon={faBell} className="me-1" /> Notified</Badge>;
      case 'SERVING':
        return <Badge bg="primary"><FontAwesomeIcon icon={faUser} className="me-1" /> Being Served</Badge>;
      case 'SERVED':
        return <Badge bg="success"><FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Served</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.status) {
      case 'WAITING':
        return `You are now in position ${notification.queuePosition} in the queue.`;
      case 'NOTIFIED':
        return `You will be called soon! Your current position is ${notification.queuePosition}.`;
      case 'SERVING':
        return 'It is your turn now! Please proceed to the service desk.';
      case 'SERVED':
        return 'Thank you for your visit!';
      default:
        return `Your status has been updated to ${notification.status}.`;
    }
  };

  if (!showNotification || !notification) {
    return null;
  }

  return (
    <div className="notification-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1050, width: '350px' }}>
      <Card className="shadow-sm border-0 mb-3">
        <Card.Header className="bg-primary text-white">
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Status Update
        </Card.Header>
        <Card.Body>
          <h5 className="mb-3">
            {getStatusBadge(notification.status)}
          </h5>
          <p className="mb-2">{getNotificationMessage(notification)}</p>
          <p className="mb-0 text-muted small">Queue: {notification.queueName}</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PatientStatusNotification;
