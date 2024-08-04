import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the import path as needed
import './ViewSupportLink.css';

const ViewSupportLink = ({ support }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [workerDetails, setWorkerDetails] = useState([]);
  const [volunteerDetails, setVolunteerDetails] = useState([]);

  useEffect(() => {
    if (support.workers) {
      fetchWorkerDetails(support.workers);
    }
    if (support.volunteers) {
      fetchVolunteerDetails(support.volunteers);
    }
  }, [support.workers, support.volunteers]);

  const fetchWorkerDetails = async (workerPhones) => {
    try {
      const workersQuery = query(collection(db, 'workers'), where('phone', 'in', workerPhones));
      const querySnapshot = await getDocs(workersQuery);
      const workersData = querySnapshot.docs.map(doc => doc.data());
      setWorkerDetails(workersData);
    } catch (error) {
      console.error('Error fetching worker details:', error);
    }
  };

  const fetchVolunteerDetails = async (volunteerPhones) => {
    try {
      const volunteersQuery = query(collection(db, 'volunteer'), where('phoneNumber', 'in', volunteerPhones));
      const querySnapshot = await getDocs(volunteersQuery);
      const volunteersData = querySnapshot.docs.map(doc => doc.data());
      setVolunteerDetails(volunteersData);
    } catch (error) {
      console.error('Error fetching volunteer details:', error);
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'אין תאריך';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="ViewSupportLink">
      <a onClick={openModal}>לחץ כאן לראות את פרטי הליווי</a>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="support-modal"
        overlayClassName="support-modal-overlay"
      >
        <h2>פרטי הליווי</h2>
        <div className="support-modal-content">
          <table>
            <tbody>
              <tr>
                <td><strong>סוג ליווי:</strong></td>
                <td>{support.supportType || 'אין מידע'}</td>
              </tr>
              <tr>
                <td><strong>מסגרת מלווה:</strong></td>
                <td>{support.frameWork || 'אין מידע'}</td>
              </tr>
              {support.frameWork !== support.branch && (
                <tr>
                  <td><strong>סניף:</strong></td>
                  <td>{support.branch || 'אין מידע'}</td>
                </tr>
              )}
              <tr>
                <td><strong>מתנדבים:</strong></td>
                <td>
                  {volunteerDetails.length > 0
                    ? volunteerDetails.map(volunteer => (
                        <div key={volunteer.phoneNumber}>
                          {volunteer.firstname} {volunteer.lastname} ({volunteer.phoneNumber})
                        </div>
                      ))
                    : 'אין'}
                </td>
              </tr>
              <tr>
                <td><strong>אשת מקצוע מלווה:</strong></td>
                <td>
                  {workerDetails.length > 0
                    ? workerDetails.map(worker => (
                        <div key={worker.phone}>
                          {worker.name} ({worker.phone})
                        </div>
                      ))
                    : 'אין מידע'}
                </td>
              </tr>
              <tr>
                <td><strong>תאריך התחלת ליווי:</strong></td>
                <td>{formatDate(support.startDate)}</td>
              </tr>
              <tr>
                <td><strong>תאריך סיום ליווי:</strong></td>
                <td>{formatDate(support.endDate)}</td>
              </tr>
              <tr>
                <td><strong>גיל:</strong></td>
                <td>{support.age || 'אין מידע'}</td>
              </tr>
              <tr>
                <td><strong>תאריך לידה משוער:</strong></td>
                <td>{formatDate(support.dueDate)}</td>
              </tr>
              <tr>
                <td><strong>מספר היריון:</strong></td>
                <td>{support.pregnancyNum || 'אין מספר היריון'}</td>
              </tr>
              <tr>
                <td><strong>מספר לידה:</strong></td>
                <td>{support.birthNum || 'אין מספר לידה'}</td>
              </tr>
              <tr>
                <td><strong>בית יולדות שבו היא תרצה ללדת:</strong></td>
                <td>{support.hospital || 'אין מידע'}</td>
              </tr>
              <tr>
                <td><strong>מידע חשוב נוסף שחשוב שנדע על האישה:</strong></td>
                <td>{support.additionalDetails || 'אין מידע נוסף'}</td>
              </tr>
              <tr>
                <td><strong>האם האישה הפונה פנתה לאשת מקצוע באופן פרטי?</strong></td>
                <td>{support.contactWithWorker || 'אין מידע'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={closeModal}>סגור</button>
      </Modal>
    </div>
  );
};

export default ViewSupportLink;
