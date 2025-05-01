import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QueueDetails from './QueueDetails';
import { getQueueDetails, updatePatientStatus } from '../../services/api';
import WebSocketService from '../../services/websocket';

// Mock the API and WebSocket services
jest.mock('../../services/api');
jest.mock('../../services/websocket');

// Mock data
const mockQueueDetails = {
  id: 1,
  name: 'Cardiology Queue',
  description: 'Queue for cardiology department',
  departmentId: 1,
  departmentName: 'Cardiology',
  qrCodeId: 'abc123',
  qrCodeImage: 'base64-encoded-image',
  currentPatient: {
    id: 1,
    name: 'John Doe',
    status: 'SERVING',
    queuePosition: 1,
    joinedAt: '2025-04-20T10:00:00'
  },
  waitingPatients: [
    {
      id: 2,
      name: 'Jane Smith',
      status: 'WAITING',
      queuePosition: 2,
      joinedAt: '2025-04-20T10:15:00'
    }
  ],
  servedPatients: [
    {
      id: 3,
      name: 'Bob Johnson',
      status: 'SERVED',
      queuePosition: 0,
      joinedAt: '2025-04-20T09:30:00',
      servedAt: '2025-04-20T09:45:00'
    }
  ],
  waitingCount: 1,
  servedCount: 1
};

// Setup the component with router
const renderWithRouter = (id) => {
  return render(
    <MemoryRouter initialEntries={[`/admin/queues/${id}`]}>
      <Routes>
        <Route path="/admin/queues/:id" element={<QueueDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('QueueDetails Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup WebSocket mock
    WebSocketService.subscribeToQueue.mockReturnValue({ id: 'subscription-id' });
    WebSocketService.unsubscribe.mockImplementation(() => {});
  });

  test('renders queue details correctly', async () => {
    // Setup API mock
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(getQueueDetails).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
    
    // Check if queue details are displayed
    expect(screen.getByText('Cardiology Queue')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('handles string ID conversion correctly', async () => {
    // Setup API mock
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component with string ID
    renderWithRouter('1');
    
    // Wait for data to load and verify ID was converted to number
    await waitFor(() => {
      expect(getQueueDetails).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
  });

  test('handles non-numeric ID correctly', async () => {
    // Render component with non-numeric ID
    renderWithRouter('abc');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid queue ID')).toBeInTheDocument();
    });
    
    // Verify API was not called
    expect(getQueueDetails).not.toHaveBeenCalled();
  });

  test('handles API error correctly', async () => {
    // Setup API mock to reject
    getQueueDetails.mockRejectedValue(new Error('API Error'));
    
    // Render component
    renderWithRouter('1');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error fetching queue details. Please try again later.')).toBeInTheDocument();
    });
  });

  test('marks patient as served correctly', async () => {
    // Setup API mocks
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    updatePatientStatus.mockResolvedValue({ data: { ...mockQueueDetails.currentPatient, status: 'SERVED' } });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Mark as Served')).toBeInTheDocument();
    });
    
    // Click the "Mark as Served" button
    fireEvent.click(screen.getByText('Mark as Served'));
    
    // Verify updatePatientStatus was called with correct parameters
    await waitFor(() => {
      expect(updatePatientStatus).toHaveBeenCalledWith(1, 'SERVED');
    });
  });

  test('subscribes to WebSocket on mount and unsubscribes on unmount', async () => {
    // Setup API mock
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    const { unmount } = renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(WebSocketService.subscribeToQueue).toHaveBeenCalledWith('1', expect.any(Function));
    });
    
    // Unmount component
    unmount();
    
    // Verify unsubscribe was called
    expect(WebSocketService.unsubscribe).toHaveBeenCalledWith('/topic/queue/1');
  });
});
