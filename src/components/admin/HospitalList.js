import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faHospital } from '@fortawesome/free-solid-svg-icons';
import { getHospitals, deleteHospital } from '../../services/hospitalService';

const HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hospitalToDelete, setHospitalToDelete] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await getHospitals();
      setHospitals(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError('Failed to load hospitals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (hospital) => {
    setHospitalToDelete(hospital);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hospitalToDelete) return;
    
    try {
      await deleteHospital(hospitalToDelete.id);
      setShowDeleteModal(false);
      setHospitalToDelete(null);
      // Refresh the list
      fetchHospitals();
    } catch (err) {
      console.error('Error deleting hospital:', err);
      setError('Failed to delete hospital. Please try again later.');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>
            <FontAwesomeIcon icon={faHospital} className="me-2" />
            Hospitals
          </h2>
          <p className="text-muted">Manage all hospitals in the system</p>
        </Col>
        <Col xs="auto" className="align-self-center">
          <Link to="/admin/hospitals/new" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Hospital
          </Link>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {hospitals.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <h4>No Hospitals Found</h4>
            <p>Get started by adding your first hospital.</p>
            <Link to="/admin/hospitals/new" className="btn btn-primary">
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Hospital
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Departments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital, index) => (
                  <tr key={hospital.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/admin/hospitals/${hospital.id}`} className="fw-bold text-decoration-none">
                        {hospital.name}
                      </Link>
                    </td>
                    <td>{hospital.address}</td>
                    <td>{hospital.contactNumber}</td>
                    <td>{hospital.departments ? hospital.departments.length : 0}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link 
                          to={`/admin/hospitals/${hospital.id}/edit`} 
                          className="btn btn-sm btn-outline-primary"
                          title="Edit Hospital"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          title="Delete Hospital"
                          onClick={() => handleDeleteClick(hospital)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the hospital "{hospitalToDelete?.name}"? 
          This will also delete all departments and queues associated with this hospital.
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Hospital
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HospitalList;
