import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import he from 'date-fns/locale/he';
import 'react-datepicker/dist/react-datepicker.css';
import './AddDocumentation.css';

const AddDocumentation = ({ isOpen, onRequestClose, girlPhoneNumber }) => {
  const [date, setDate] = useState(new Date());
  const [admins, setAdmins] = useState([]);
  const [mentionToAdmin, setMentionToAdmin] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        const adminList = querySnapshot.docs.map(doc => ({ value: doc.id, label: doc.data().name }));
        setAdmins(adminList);
      } catch (error) {
        console.error('Error fetching admins: ', error);
      }
    };

    fetchAdmins();
  }, []);

  const fetchGirlDetails = async (phoneNumber) => {
    const q = query(collection(db, 'girls'), where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const girlData = querySnapshot.docs[0].data();
      return {
        firstName: girlData.firstName,
        lastName: girlData.lastName || '', // Default to an empty string if lastName does not exist
        phoneNumber: girlData.phoneNumber
      };
    }
    throw new Error('Girl not found');
  };

  const handleSave = async () => {
    const currentAdminId = auth.currentUser?.uid;
    if (!currentAdminId) {
      console.error('currentAdminId is undefined');
      return;
    }

    try {
      const { firstName, lastName, phoneNumber } = await fetchGirlDetails(girlPhoneNumber);

      const docRef = await addDoc(collection(db, 'documentation'), {
        date,
        mentionToAdmin: mentionToAdmin.map(admin => admin.value),
        text,
        girlPhoneNumber,
      });

      console.log('Documentation saved with ID:', docRef.id);

      await sendNotifications(mentionToAdmin.map(admin => admin.value), firstName, lastName, phoneNumber, currentAdminId);

      onRequestClose();
    } catch (error) {
      console.error('Error saving documentation or sending notification:', error);
    }
  };

  const sendNotifications = async (mentionedAdminIds, girlFirstName, girlLastName, girlPhoneNumber, senderId) => {
    const senderName = auth.currentUser.displayName || auth.currentUser.email;
    const girlFullName = girlLastName ? `${girlFirstName} ${girlLastName}` : girlFirstName;
    const message = `(${senderName}) תייגה אותך בפניה בכרטיסיית (${girlFullName} - ${girlPhoneNumber})`;
    mentionedAdminIds.forEach(async recipientId => {
      try {
        const notificationRef = await addDoc(collection(db, 'notifications'), {
          message,
          recipientId,
          senderId,
          timestamp: serverTimestamp(),
        });
        console.log('Notification sent with ID:', notificationRef.id);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" dir="rtl">
        <h2>הוספת פניה</h2>
        <label>תאריך:</label>
        <DatePicker
          selected={date}
          onChange={date => setDate(date)}
          dateFormat="dd/MM/yyyy"
          showYearDropdown
          showMonthDropdown
          locale={he}
          placeholderText="dd/MM/yyyy"
          required
        />
        <label>תיוג מנהל:</label>
        <Select
          options={admins}
          isMulti
          value={mentionToAdmin}
          onChange={setMentionToAdmin}
        />
        <label>תוכן הפניה:</label>
        <textarea value={text} onChange={e => setText(e.target.value)} />
        <div className="modal-actions">
          <button onClick={handleSave}>שמירה</button>
          <button onClick={onRequestClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentation;
