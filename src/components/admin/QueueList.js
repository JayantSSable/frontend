import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Alert, Card, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faQrcode, faEye } from '@fortawesome/free-solid-svg-icons';
import { getQueues, getDepartments, deleteQueue } from '../../services/api';

const QueueList = () => {
  const [queues, setQueues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queuesResponse, departmentsResponse] = await Promise.all([
        getQueues(),
        getDepartments()
      ]);
      setQueues(queuesResponse.data);
      setDepartments(departmentsResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching data. Please try again later.');
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this queue? This will remove all patients in this queue.')) {
      try {
        await deleteQueue(id);
        setDeleteSuccess(true);
        fetchData();
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
      } catch (err) {
        setError('Error deleting queue. Please try again later.');
        console.error('Error deleting queue:', err);
      }
    }
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown Department';
  };

  if (loading) {
    return <div className="text-center mt-5">Loading queues...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Queues</h1>
        <Link to="/admin/queues/new">
          <Button variant="success">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Queue
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {deleteSuccess && <Alert variant="success">Queue deleted successfully!</Alert>}

      {queues.length === 0 ? (
        <Card className="text-center p-4">
          <Card.Body>
            <Card.Title>No Queues Found</Card.Title>
            <Card.Text>
              Create your first queue to get started.
            </Card.Text>
            <Link to="/admin/queues/new">
              <Button variant="primary">Create Queue</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>QR Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queues.map((queue) => (
              <tr key={queue.id}>
                <td>{queue.id}</td>
                <td>{queue.name}</td>
                <td>
                  <Badge bg="info">{getDepartmentName(queue.departmentId)}</Badge>
                </td>
                <td>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    as={Link}
                    to={`/admin/queues/${queue.id}`}
                  >
                    <FontAwesomeIcon icon={faQrcode} className="me-1" />
                    View QR
                  </Button>
                </td>
                <td>
                  <Link to={`/admin/queues/${queue.id}`} className="me-2">
                    <Button variant="info" size="sm">
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                  </Link>
                  <Link to={`/admin/queues/edit/${queue.id}`} className="me-2">
                    <Button variant="primary" size="sm">
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                  </Link>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Delete this queue</Tooltip>}
                  >
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(queue.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </OverlayTrigger>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default QueueList;
