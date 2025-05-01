import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QueueForm from './QueueForm';
import { getDepartments, getQueueDetails, createQueue, updateQueue } from '../../services/api';

// Mock the API services and navigation
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock navigation function
const mockNavigate = jest.fn();

// Mock data
const mockDepartments = [
  { id: 1, name: 'Cardiology', description: 'Department for heart-related issues' },
  { id: 2, name: 'Neurology', description: 'Department for brain and nervous system' }
];

const mockQueueDetails = {
  id: 1,
  name: 'Cardiology Queue',
  description: 'Queue for cardiology department',
  departmentId: 1,
  departmentName: 'Cardiology',
  qrCodeId: 'abc123'
};

// Setup the component with router for create mode
const renderCreateForm = () => {
  return render(
    <MemoryRouter initialEntries={['/admin/queues/new']}>
      <Routes>
        <Route path="/admin/queues/new" element={<QueueForm />} />
      </Routes>
    </MemoryRouter>
  );
};

// Setup the component with router for edit mode
const renderEditForm = (id) => {
  return render(
    <MemoryRouter initialEntries={[`/admin/queues/edit/${id}`]}>
      <Routes>
        <Route path="/admin/queues/edit/:id" element={<QueueForm />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('QueueForm Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('renders create form correctly', async () => {
    // Setup API mock
    getDepartments.mockResolvedValue({ data: mockDepartments });
    
    // Render component in create mode
    renderCreateForm();
    
    // Wait for data to load
    await waitFor(() => {
      expect(getDepartments).toHaveBeenCalled();
    });
    
    // Check if form elements are displayed
    expect(screen.getByText('Create Queue')).toBeInTheDocument();
    expect(screen.getByLabelText('Queue Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Department')).toBeInTheDocument();
    
    // Check if departments are loaded in the select
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Neurology')).toBeInTheDocument();
  });

  test('renders edit form correctly and loads queue data', async () => {
    // Setup API mocks
    getDepartments.mockResolvedValue({ data: mockDepartments });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component in edit mode
    renderEditForm('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(getDepartments).toHaveBeenCalled();
      expect(getQueueDetails).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
    
    // Check if form is populated with queue data
    await waitFor(() => {
      expect(screen.getByText('Edit Queue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cardiology Queue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Queue for cardiology department')).toBeInTheDocument();
    });
  });

  test('handles string ID conversion correctly in edit mode', async () => {
    // Setup API mocks
    getDepartments.mockResolvedValue({ data: mockDepartments });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component with string ID
    renderEditForm('1');
    
    // Wait for data to load and verify ID was converted to number
    await waitFor(() => {
      expect(getQueueDetails).toHaveBeenCalledWith(1); // Should be called with number 1, not string '1'
    });
  });

  test('handles non-numeric ID correctly in edit mode', async () => {
    // Setup API mock
    getDepartments.mockResolvedValue({ data: mockDepartments });
    
    // Render component with non-numeric ID
    renderEditForm('abc');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid queue ID')).toBeInTheDocument();
    });
    
    // Verify queue details API was not called
    expect(getQueueDetails).not.toHaveBeenCalled();
  });

  test('submits create form correctly', async () => {
    // Setup API mocks
    getDepartments.mockResolvedValue({ data: mockDepartments });
    createQueue.mockResolvedValue({ data: mockQueueDetails });
    
    // Render component in create mode
    renderCreateForm();
    
    // Wait for data to load
    await waitFor(() => {
      expect(getDepartments).toHaveBeenCalled();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Queue Name'), { target: { value: 'New Queue' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New queue description' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: '1' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Queue'));
    
    // Verify createQueue was called with correct data
    await waitFor(() => {
      expect(createQueue).toHaveBeenCalledWith({
        name: 'New Queue',
        description: 'New queue description',
        departmentId: 1 // Should be a number, not a string
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/queues');
    });
  });

  test('submits edit form correctly', async () => {
    // Setup API mocks
    getDepartments.mockResolvedValue({ data: mockDepartments });
    getQueueDetails.mockResolvedValue({ data: mockQueueDetails });
    updateQueue.mockResolvedValue({ data: { ...mockQueueDetails, name: 'Updated Queue', description: 'Updated description' } });
    
    // Render component in edit mode
    renderEditForm('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(getDepartments).toHaveBeenCalled();
      expect(getQueueDetails).toHaveBeenCalled();
    });
    
    // Update the form
    fireEvent.change(screen.getByLabelText('Queue Name'), { target: { value: 'Updated Queue' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated description' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Queue'));
    
    // Verify updateQueue was called with correct data
    await waitFor(() => {
      expect(updateQueue).toHaveBeenCalledWith(1, {
        name: 'Updated Queue',
        description: 'Updated description',
        departmentId: 1
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/queues');
    });
  });

  test('handles form validation correctly', async () => {
    // Setup API mock
    getDepartments.mockResolvedValue({ data: mockDepartments });
    
    // Render component in create mode
    renderCreateForm();
    
    // Wait for data to load
    await waitFor(() => {
      expect(getDepartments).toHaveBeenCalled();
    });
    
    // Submit form without filling required fields
    fireEvent.click(screen.getByText('Save Queue'));
    
    // Verify createQueue was not called
    expect(createQueue).not.toHaveBeenCalled();
  });

  test('handles API error correctly when loading departments', async () => {
    // Setup API mock to reject
    getDepartments.mockRejectedValue(new Error('API Error'));
    
    // Render component
    renderCreateForm();
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error fetching data. Please try again later.')).toBeInTheDocument();
    });
  });

  test('handles API error correctly when loading queue details', async () => {
    // Setup API mocks
    getDepartments.mockResolvedValue({ data: mockDepartments });
    getQueueDetails.mockRejectedValue(new Error('API Error'));
    
    // Render component in edit mode
    renderEditForm('1');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error fetching data. Please try again later.')).toBeInTheDocument();
    });
  });

  test('handles API error correctly when submitting form', async () => {
    // Setup API mocks
    getDepartments.mockResolvedValue({ data: mockDepartments });
    createQueue.mockRejectedValue(new Error('API Error'));
    
    // Render component in create mode
    renderCreateForm();
    
    // Wait for data to load
    await waitFor(() => {
      expect(getDepartments).toHaveBeenCalled();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Queue Name'), { target: { value: 'New Queue' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: '1' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Queue'));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error creating queue. Please try again later.')).toBeInTheDocument();
    });
  });

  test('shows warning when no departments exist', async () => {
    // Setup API mock to return empty departments
    getDepartments.mockResolvedValue({ data: [] });
    
    // Render component
    renderCreateForm();
    
    // Wait for warning message
    await waitFor(() => {
      expect(screen.getByText('You need to create at least one department before creating a queue.')).toBeInTheDocument();
    });
  });
});
