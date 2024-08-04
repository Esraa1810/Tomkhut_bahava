import React, { useState, useEffect } from 'react';
import './ActiveSupportList.css';
import EditSupportModal from './EditSupportModal';
import { getFirestore, doc, updateDoc, Timestamp, collection, getDocs, where, query } from 'firebase/firestore';

const ActiveSupportList = ({
  supportData = [], // Ensure supportData is an array
  activeSupportIndex,
  setActiveSupportIndex,
  handleDeleteSupport,
  isSupportDetailsVisible,
  toggleSupportDetailsVisibility,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState(null);
  const [workerDetails, setWorkerDetails] = useState({});
  const [volunteerDetails, setVolunteerDetails] = useState({});

  // Filter active supports
  const today = new Date();
  const activeSupports = supportData.filter(support => {
    const startDate = support.startDate ? new Date(support.startDate.seconds * 1000) : null;
    const endDate = support.endDate ? new Date(support.endDate.seconds * 1000) : null;
    return startDate && (!endDate || today >= startDate && today <= endDate);
  });

  useEffect(() => {
    if (activeSupports.length > 0 && activeSupportIndex >= activeSupports.length) {
      setActiveSupportIndex(activeSupports.length - 1);
    }
  }, [activeSupports, activeSupportIndex, setActiveSupportIndex]);

  useEffect(() => {
    const fetchWorkerDetails = async () => {
      const db = getFirestore();
      const workersRef = collection(db, 'workers');
      const workerPhones = activeSupports.flatMap(support => support.workers || []);

      if (workerPhones.length > 0) {
        const workerQuery = query(workersRef, where('phone', 'in', workerPhones));
        const snapshot = await getDocs(workerQuery);
        const workers = snapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc[data.phone] = data.name;
          return acc;
        }, {});
        setWorkerDetails(workers);
      }
    };

    fetchWorkerDetails();
  }, [activeSupports]);

  useEffect(() => {
    const fetchVolunteerDetails = async () => {
      const db = getFirestore();
      const volunteersRef = collection(db, 'volunteer');
      const volunteerPhones = activeSupports.flatMap(support => support.volunteers || []);

      if (volunteerPhones.length > 0) {
        const volunteerQuery = query(volunteersRef, where('phoneNumber', 'in', volunteerPhones));
        const snapshot = await getDocs(volunteerQuery);
        const volunteers = snapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc[data.phoneNumber] = `${data.firstname} ${data.lastname}`;
          return acc;
        }, {});
        setVolunteerDetails(volunteers);
      }
    };

    fetchVolunteerDetails();
  }, [activeSupports]);

  const handleTabClick = (index) => {
    setActiveSupportIndex(index);
  };

  const handleEditSupport = (support) => {
    setSelectedSupport(support);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedSupport = async (updatedSupport) => {
    if (!updatedSupport.dueDate || isNaN(new Date(updatedSupport.dueDate).getTime())) {
      console.error("Invalid date value for dueDate:", updatedSupport.dueDate);
      return;
    }

    const db = getFirestore();
    const supportRef = doc(db, 'help_record', selectedSupport.id);

    const formattedSupport = {
      dueDate: updatedSupport.dueDate ? Timestamp.fromDate(new Date(updatedSupport.dueDate)) : null,
    };

    try {
      await updateDoc(supportRef, formattedSupport);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'אין תאריך';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="ActiveSupportList-active-support-list">
      <div className="ActiveSupportList-support-tabs">
        {activeSupports.map((support, index) => (
          <button
            key={index}
            className={`ActiveSupportList-support-tab ${activeSupportIndex === index ? 'active' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {support.supportType} {support.isActive ? '' : ''}
          </button>
        ))}
      </div>
      {activeSupports.length > 0 && activeSupportIndex < activeSupports.length ? (
        <div className={`ActiveSupportList-support-details ${isSupportDetailsVisible ? '' : 'hidden'}`}>
          <img
            src={`${process.env.PUBLIC_URL}/delete.png`}
            alt="Delete"
            className="ActiveSupportList-delete-icon"
            onClick={() => handleDeleteSupport(activeSupports[activeSupportIndex]?.id)}
          />
          <img
            src={`${process.env.PUBLIC_URL}/edit.png`}
            alt="Edit"
            className="ActiveSupportList-edit-icon"
            onClick={() => handleEditSupport(activeSupports[activeSupportIndex])}
          />
          <div className="ActiveSupportList-details-row">
            <div className="ActiveSupportList-details-group">
              <label>סוג ליווי:</label>
              <p>{activeSupports[activeSupportIndex]?.supportType || 'אין מידע'}</p>
            </div>
            <div className="ActiveSupportList-details-group">
              <label>מסגרת מלווה:</label>
              <p>{activeSupports[activeSupportIndex]?.frameWork || 'אין מידע'}</p>
            </div>
          </div>
          {activeSupports[activeSupportIndex]?.frameWork !== activeSupports[activeSupportIndex]?.branch && (
            <div className="ActiveSupportList-details-row">
              <div className="ActiveSupportList-details-group">
                <label>סניף:</label>
                <p>{activeSupports[activeSupportIndex]?.branch || 'אין מידע'}</p>
              </div>
            </div>
          )}
          <div className="ActiveSupportList-details-row">
            <div className="ActiveSupportList-details-group">
              <label>מתנדבים:</label>
              <p>
                {activeSupports[activeSupportIndex]?.volunteers
                  ? activeSupports[activeSupportIndex].volunteers
                      .map(phone => `${volunteerDetails[phone] || 'אין שם'} (${phone})`)
                      .join(', ')
                  : 'אין'}
              </p>
            </div>
            <div className="ActiveSupportList-details-group">
              <label>אשת מקצוע מלווה:</label>
              <p>
                {activeSupports[activeSupportIndex]?.workers
                  ? activeSupports[activeSupportIndex].workers
                      .map(phone => `${workerDetails[phone] || 'אין שם'} (${phone})`)
                      .join(', ')
                  : 'אין מידע'}
              </p>
            </div>
          </div>
          <div className="ActiveSupportList-details-row">
            <div className="ActiveSupportList-details-group">
              <label>תאריך התחלת ליווי:</label>
              <p>{formatDate(activeSupports[activeSupportIndex]?.startDate)}</p>
            </div>
            <div className="ActiveSupportList-details-group">
              <label>תאריך סיום ליווי:</label>
              <p>{formatDate(activeSupports[activeSupportIndex]?.endDate)}</p>
            </div>
          </div>
          <div className="ActiveSupportList-details-row">
            <div className="ActiveSupportList-details-group">
              <label>גיל:</label>
              <p>{activeSupports[activeSupportIndex]?.age || 'אין מידע'}</p>
            </div>
            <div className="ActiveSupportList-details-group">
              <label>תאריך לידה משוער:</label>
              <p>{formatDate(activeSupports[activeSupportIndex]?.dueDate)}</p>
            </div>
          </div>
          <div className="ActiveSupportList-details-row">
            <div className="ActiveSupportList-details-group">
              <label>מספר היריון:</label>
              <p>{activeSupports[activeSupportIndex]?.pregnancyNum || 'אין מספר היריון'}</p>
            </div>
            <div className="ActiveSupportList-details-group">
              <label>מספר לידה:</label>
              <p>{activeSupports[activeSupportIndex]?.birthNum || 'אין מספר לידה'}</p>
            </div>
          </div>
          <div className="ActiveSupportList-details-row">
            <div className="ActiveSupportList-details-group">
              <label>בית יולדות שבו היא תרצה ללדת:</label>
              <p>{activeSupports[activeSupportIndex]?.hospital || 'אין מידע'}</p>
            </div>
            <div className="ActiveSupportList-details-group">
              <label>מידע חשוב נוסף שחשוב שנדע על האישה:</label>
              <p>{activeSupports[activeSupportIndex]?.additionalDetails || 'אין מידע נוסף'}</p>
            </div>
          </div>
          <div className="ActiveSupportList-details-row single-group">
            <div className="ActiveSupportList-details-group">
              <label>האם האישה הפונה פנתה לאשת מקצוע באופן פרטי?</label>
              <p>{activeSupports[activeSupportIndex]?.contactWithWorker || 'אין מידע'}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>אין ליווים פעילים</p>
      )}
      <EditSupportModal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        support={selectedSupport}
        onSave={handleSaveEditedSupport}
      />
    </div>
  );
};

export default ActiveSupportList;
