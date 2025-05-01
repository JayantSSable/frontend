import React, { useState } from 'react';
import { Dropdown, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

/**
 * Dropdown component for changing patient status
 */
const PatientStatusDropdown = ({ patient, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const statuses = [
    { value: 'WAITING', label: 'Waiting', variant: 'secondary' },
    { value: 'NOTIFIED', label: 'Notified', variant: 'warning' },
    { value: 'SERVING', label: 'Serving', variant: 'primary' },
    { value: 'SERVED', label: 'Served', variant: 'success' },
    { value: 'CANCELLED', label: 'Cancelled', variant: 'danger' }
  ];
  
  // Don't show the current status in the dropdown
  const availableStatuses = statuses.filter(status => status.value !== patient.status);
  
  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={`tooltip-status-${patient.id}`}>Change patient status</Tooltip>}
    >
      <Dropdown show={isOpen} onToggle={(isOpen) => setIsOpen(isOpen)}>
        <Dropdown.Toggle 
          as={Button}
          variant="outline-secondary" 
          size="sm"
          id={`dropdown-status-${patient.id}`}
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Header>Change Status</Dropdown.Header>
          {availableStatuses.map(status => (
            <Dropdown.Item 
              key={status.value}
              onClick={() => {
                onStatusChange(patient.id, status.value);
                setIsOpen(false);
              }}
            >
              {status.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </OverlayTrigger>
  );
};

export default PatientStatusDropdown;
