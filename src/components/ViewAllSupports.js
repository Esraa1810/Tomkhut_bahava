import React from 'react';
import ViewSupportLink from './ViewSupportLink';
import './ViewAllSupports.css';

const ViewAllSupports = ({ supportData, handleDeleteSupport }) => {
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'אין תאריך';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-GB');
  };

  const getStatus = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = startDate.seconds ? new Date(startDate.seconds * 1000) : null;
    const end = endDate?.seconds ? new Date(endDate.seconds * 1000) : null;

    if (start && start <= today && (!end || today <= end)) {
      return 'פעיל';
    }
    return 'לא פעיל';
  };

  return (
    <div className="ViewAllSupports-container">
      {supportData.map((support, index) => (
        <div key={index} className="ViewAllSupports-support-card">
          <img
            src={`${process.env.PUBLIC_URL}/delete.png`}
            alt="Delete"
            className="delete-icon"
            onClick={() => handleDeleteSupport(support.id)}
          />
          <div className="ViewAllSupports-support-details">
            <p><strong>סוג ליווי:</strong> {support.supportType}</p>
            <p><strong>תאריך התחלת ליווי:</strong> {formatDate(support.startDate)}</p>
            <p><strong>סטטוס:</strong> {getStatus(support.startDate, support.endDate)}</p>
            <ViewSupportLink support={support} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ViewAllSupports;
