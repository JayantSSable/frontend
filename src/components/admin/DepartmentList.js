import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Alert, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { getDepartments, deleteDepartment } from '../../services/api';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await getDepartments();
      setDepartments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching departments. Please try again later.');
      setLoading(false);
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        setDeleteSuccess(true);
        fetchDepartments();
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
      } catch (err) {
        setError('Error deleting department. Please try again later.');
        console.error('Error deleting department:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading departments...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Departments</h1>
        <Link to="/admin/departments/new">
          <Button variant="success">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Department
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {deleteSuccess && <Alert variant="success">Department deleted successfully!</Alert>}

      {departments.length === 0 ? (
        <Card className="text-center p-4">
          <Card.Body>
            <Card.Title>No Departments Found</Card.Title>
            <Card.Text>
              Create your first department to get started.
            </Card.Text>
            <Link to="/admin/departments/new">
              <Button variant="primary">Create Department</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>{department.id}</td>
                <td>{department.name}</td>
                <td>{department.description || 'No description'}</td>
                <td>
                  <Link to={`/admin/departments/edit/${department.id}`} className="me-2">
                    <Button variant="primary" size="sm">
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                  </Link>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(department.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default DepartmentList;
