import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig'; // Adjust the import based on your file structure

const AuthGuard = ({ children, isAuthenticated }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionActive = sessionStorage.getItem('sessionActive');
    if (!isAuthenticated || !sessionActive) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // or a loading spinner, or a message indicating the user is being redirected
  }

  return children;
};

export default AuthGuard;
