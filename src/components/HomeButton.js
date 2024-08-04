import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeButton = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div style={styles.container}>
      <img 
        src={`${process.env.PUBLIC_URL}/logo.png`} 
        alt="Home" 
        onClick={handleGoHome} 
        style={styles.button} 
      />
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: '20px', // Adjust the value as needed to position the button further down from the top
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    cursor: 'pointer',
    width: '150px',
    height: '150px',
  },
};

export default HomeButton;
