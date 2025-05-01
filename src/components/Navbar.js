import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';

const Navbar = () => {
  const location = useLocation();
  
  // Check if we're on a patient or display page
  const isPatientPage = location.pathname.includes('/join-queue') || 
                        location.pathname.includes('/patient-status');
  const isDisplayPage = location.pathname.includes('/display');
  
  // Only show admin navigation when not on patient or display pages
  const showAdminNav = !isPatientPage && !isDisplayPage;

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Hospital Queue System
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {showAdminNav ? (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/departments" className={location.pathname.includes('/admin/departments') ? 'active' : ''}>
                Departments
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/queues" className={location.pathname.includes('/admin/queues') ? 'active' : ''}>
                Queues
              </Nav.Link>
            </Nav>
          ) : (
            <Nav className="me-auto">
              {isPatientPage && (
                <Nav.Link as={Link} to="/">
                  Admin Portal
                </Nav.Link>
              )}
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
