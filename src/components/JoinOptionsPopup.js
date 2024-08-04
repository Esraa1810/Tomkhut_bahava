import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinOptionsPopup.css'; // Create this CSS file for styling

const JoinOptionsPopup = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="join-options-popup">
      <div className="popup-content">
        <h3>בחר אפשרות להצטרפות:</h3>
        <button onClick={() => { navigate('/join'); onClose(); }}>צעירה</button>
        <button onClick={() => { navigate('/JoinVolunteer'); onClose(); }}>מתנדבת</button>
        <button onClick={onClose}>סגירה</button>
      </div>
    </div>
  );
};

export default JoinOptionsPopup;
