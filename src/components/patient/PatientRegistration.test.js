import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PatientRegistration from './PatientRegistration';
import { registerPatient } from '../../services/api';

// Mock the API services and navigation
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock navigation function
const mockNavigate = jest.fn();

// Mock data
const mockPatientResponse = {
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

// Setup the component with router
const renderWithRouter = (qrCodeId) => {
  return render(
    <MemoryRouter initialEntries={[`/join-queue/${qrCodeId}`]}>
      <Routes>
        <Route path="/join-queue/:qrCodeId" element={<PatientRegistration />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PatientRegistration Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('renders registration form correctly', async () => {
    // Render component
    renderWithRouter('abc123');
    
    // Check if form elements are displayed
    expect(screen.getByText('Join Queue')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Join Queue')).toBeInTheDocument();
  });

  test('handles form submission correctly', async () => {
    // Setup API mock
    registerPatient.mockResolvedValue({ data: mockPatientResponse });
    
    // Render component
    renderWithRouter('abc123');
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Email Address (Optional)'), { target: { value: 'john.doe@example.com' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Join Queue'));
    
    // Verify registerPatient was called with correct data
    await waitFor(() => {
      expect(registerPatient).toHaveBeenCalledWith({
        name: 'John Doe',
        phoneNumber: '1234567890',
        email: 'john.doe@example.com',
        qrCodeId: 'abc123'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/patient-status/1');
    });
  });

  test('handles missing QR code ID correctly', async () => {
    // Render component without QR code ID
    renderWithRouter('');
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid QR code. Please scan a valid QR code.')).toBeInTheDocument();
    });
  });

  test('handles form validation correctly', async () => {
    // Render component
    renderWithRouter('abc123');
    
    // Submit form without filling required fields
    fireEvent.click(screen.getByText('Join Queue'));
    
    // Verify registerPatient was not called
    expect(registerPatient).not.toHaveBeenCalled();
  });

  test('handles API error correctly when submitting form', async () => {
    // Setup API mock to reject
    registerPatient.mockRejectedValue(new Error('API Error'));
    
    // Render component
    renderWithRouter('abc123');
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '1234567890' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Join Queue'));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error registering for the queue. Please try again later.')).toBeInTheDocument();
    });
  });
});
