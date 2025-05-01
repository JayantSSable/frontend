import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PatientStatus from './PatientStatus';
import { getPatientById, getQueueDetails } from '../../services/api';
import WebSocketService from '../../services/websocket';

// Mock the API and WebSocket services
jest.mock('../../services/api');
jest.mock('../../services/websocket');

// Mock data
const mockPatient = {
  id: 1,
  name: 'John Doe',
  phoneNumber: '1234567890',
  email: 'john.doe@example.com',
  queueId: 1,
  qrCodeId: 'abc123',
  status: 'WAITING',
  queuePosition: 3,
  joinedAt: '2025-04-20T10:00:00'
};

const mockQueueDetails = {
  id: 1,
  name: 'Cardiology Queue',
  description: 'Queue for cardiology department',
  departmentId: 1,
  departmentName: 'Cardiology',
  qrCodeId: 'abc123',
  currentPatient: {
    id: 2,
    name: 'Jane Smith',
    status: 'SERVING',
    queuePosition: 1
  },
  waitingPatients: [
    {
      id: 1,
      name: 'John Doe',
      status: 'WAITING',
      queuePosition: 3
    },
    {
      id: 3,
      name: 'Bob Johnson',
      status: 'WAITING',
      queuePosition: 2
    }
  ],
  servedPatients: [
    {
      id: 4,
      name: 'Alice Williams',
      status: 'SERVED',
      queuePosition: 0
    }
  ]
};

// Setup the component with router
const renderWithRouter = (id) => {
  return render(
    <MemoryRouter initialEntries={[`/patient-status/${id}`]}>
      <Routes>
        <Route path="/patient-status/:id" element={<PatientStatus />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PatientStatus Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup WebSocket mock
    WebSocketService.subscribeToPatient.mockReturnValue({ id: 'patient-subscription-id' });
    WebSocketService.subscribeToQueue.mockReturnValue({ id: 'queue-subscription-id' });
    WebSocketService.unsubscribe.mockImplementation(() => {});
  });

  test('renders patient status correctly', async () => {
    // Setup API mocks
    getPatientById.mockResolvedValue({ data: mockPatient });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(getPatientById).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
      expect(getQueueDetails).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
    
    // Check if patient status is displayed
    expect(screen.getByText('Your Queue Status')).toBeInTheDocument();
    expect(screen.getByText('Cardiology Queue')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Position in Queue: 3')).toBeInTheDocument();
  });

  test('handles string ID conversion correctly', async () => {
    // Setup API mocks
    getPatientById.mockResolvedValue({ data: mockPatient });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component with string ID
    renderWithRouter('1');
    
    // Wait for data to load and verify ID was converted to number
    await waitFor(() => {
      expect(getPatientById).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
  });

  test('handles non-numeric patient ID correctly', async () => {
    // Render component with non-numeric ID
    renderWithRouter('abc');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid patient ID')).toBeInTheDocument();
    });
    
    // Verify API was not called
    expect(getPatientById).not.toHaveBeenCalled();
  });

  test('handles invalid queue ID correctly', async () => {
    // Setup API mock to return patient with invalid queue ID
    const patientWithInvalidQueueId = { ...mockPatient, queueId: 'invalid' };
    getPatientById.mockResolvedValue({ data: patientWithInvalidQueueId });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid queue ID')).toBeInTheDocument();
    });
    
    // Verify second API was not called
    expect(getQueueDetails).not.toHaveBeenCalled();
  });

  test('handles patient API error correctly', async () => {
    // Setup API mock to reject
    getPatientById.mockRejectedValue(new Error('API Error'));
    
    // Render component
    renderWithRouter('1');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error fetching data. Please try again later.')).toBeInTheDocument();
    });
  });

  test('handles queue API error correctly', async () => {
    // Setup API mocks
    getPatientById.mockResolvedValue({ data: mockPatient });
    getQueueDetails.mockRejectedValue(new Error('API Error'));
    
    // Render component
    renderWithRouter('1');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error fetching data. Please try again later.')).toBeInTheDocument();
    });
  });

  test('subscribes to WebSocket on mount and unsubscribes on unmount', async () => {
    // Setup API mocks
    getPatientById.mockResolvedValue({ data: mockPatient });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    const { unmount } = renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(WebSocketService.subscribeToPatient).toHaveBeenCalledWith(1, expect.any(Function));
      expect(WebSocketService.subscribeToQueue).toHaveBeenCalledWith(1, expect.any(Function));
    });
    
    // Unmount component
    unmount();
    
    // Verify unsubscribe was called
    expect(WebSocketService.unsubscribe).toHaveBeenCalledWith('/topic/patient/1');
    expect(WebSocketService.unsubscribe).toHaveBeenCalledWith('/topic/queue/1');
  });

  test('calculates wait time correctly', async () => {
    // Setup API mocks
    getPatientById.mockResolvedValue({ data: mockPatient });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      // There should be 1 patient ahead (position 2), so wait time should be 5 minutes
      expect(screen.getByText('Estimated wait time: 5 minutes')).toBeInTheDocument();
    });
  });
});
