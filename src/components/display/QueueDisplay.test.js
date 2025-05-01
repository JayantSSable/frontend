import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QueueDisplay from './QueueDisplay';
import { getQueueDetails } from '../../services/api';
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
    },
    {
      id: 3,
      name: 'Bob Johnson',
      status: 'WAITING',
      queuePosition: 3,
      joinedAt: '2025-04-20T10:30:00'
    }
  ],
  servedPatients: [
    {
      id: 4,
      name: 'Alice Williams',
      status: 'SERVED',
      queuePosition: 0,
      joinedAt: '2025-04-20T09:30:00',
      servedAt: '2025-04-20T09:45:00'
    }
  ],
  waitingCount: 2,
  servedCount: 1
};

// Setup the component with router
const renderWithRouter = (id) => {
  return render(
    <MemoryRouter initialEntries={[`/display/queue/${id}`]}>
      <Routes>
        <Route path="/display/queue/:id" element={<QueueDisplay />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('QueueDisplay Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup WebSocket mock
    WebSocketService.subscribeToQueue.mockReturnValue({ id: 'subscription-id' });
    WebSocketService.unsubscribe.mockImplementation(() => {});
    
    // Mock Date.now() to return a fixed timestamp
    jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:00:00 AM');
    jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('April 20, 2025');
  });

  afterEach(() => {
    // Restore Date mocks
    jest.restoreAllMocks();
  });

  test('renders queue display correctly', async () => {
    // Setup API mock
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(getQueueDetails).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
    
    // Check if queue display is rendered correctly
    expect(screen.getByText('Cardiology Queue')).toBeInTheDocument();
    expect(screen.getByText('Now Serving')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Next in Line')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
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

  test('displays empty state correctly when no patients are waiting', async () => {
    // Setup API mock with empty waiting list
    const emptyQueueDetails = {
      ...mockQueueDetails,
      currentPatient: null,
      waitingPatients: [],
      servedPatients: []
    };
    getQueueDetails.mockResolvedValue({ data: emptyQueueDetails });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('No patient is currently being served')).toBeInTheDocument();
      expect(screen.getByText('No patients are waiting in the queue')).toBeInTheDocument();
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

  test('displays queue statistics correctly', async () => {
    // Setup API mock
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component
    renderWithRouter('1');
    
    // Wait for data to load
    await waitFor(() => {
      // Check if statistics are displayed correctly
      expect(screen.getByText('1')).toBeInTheDocument(); // Currently serving
      expect(screen.getByText('2')).toBeInTheDocument(); // Waiting
      expect(screen.getByText('1')).toBeInTheDocument(); // Served
    });
  });
});
