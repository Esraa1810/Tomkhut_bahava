import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, setDoc, doc, query, where, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, updateProfile, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import './AdminDetails.css';
import HomeButton from './HomeButton'; // Import HomeButton component
import Footer from './Footer'; // Import Footer component

const AdminDetails = ({ navigateTo }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentAdmin = auth.currentUser;

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminList);
    } catch (error) {
      alert('שגיאה בקבלת פרטי מנהל: ' + error.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Check if email is already in use
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        // Email is already in use, update Firestore details instead
        const adminQuery = query(collection(db, 'admins'), where("email", "==", email));
        const existingUserSnapshot = await getDocs(adminQuery);
        if (!existingUserSnapshot.empty) {
          const existingUserDoc = existingUserSnapshot.docs[0];
          await setDoc(doc(db, 'admins', existingUserDoc.id), {
            name,
            email,
            phoneNumber,
            passwordChanged: false, // You can use this field to enforce password change on first login
          });
          setMessage('פרטי המנהל עודכנו בהצלחה');
        } else {
          alert('שגיאה: האימייל כבר בשימוש, אך פרטי המנהל לא נמצאו בבסיס הנתונים.');
        }
      } else {
        // Save the current admin credentials
        const currentAdminEmail = currentAdmin.email;
        const currentAdminPassword = prompt("אנא הזן את הסיסמה שלך כדי לאמת מחדש");

        // Create the new admin user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, phoneNumber);
        const user = userCredential.user;

        // Set the displayName in Firebase Authentication
        await updateProfile(user, {
          displayName: name
        });

        // Store additional details in Firestore
        await setDoc(doc(db, 'admins', user.uid), {
          name,
          email,
          phoneNumber,
          passwordChanged: false, // You can use this field to enforce password change on first login
        });

        setMessage('המשתמש נוסף בהצלחה');
        setName('');
        setEmail('');
        setPhoneNumber('');
        setAdmins([...admins, { id: user.uid, name, email, phoneNumber }]);

        // Re-authenticate the current admin
        await signInWithEmailAndPassword(auth, currentAdminEmail, currentAdminPassword);
        alert('מנהל המערכת אומת מחדש בהצלחה');
      }
    } catch (error) {
      alert('שגיאה בהוספת משתמש: ' + error.message);
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'admins', user.uid);
        await deleteDoc(docRef);
        await deleteUser(user);
        alert('החשבון נמחק בהצלחה');
        navigateTo('/login'); // Navigate to login page
      } catch (error) {
        alert('שגיאה במחיקת החשבון: ' + error.message);
      }
    }
  };

  const confirmDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="admin-details-container">
      <HomeButton navigateTo={navigateTo} /> {/* Add the HomeButton component */}

      <h2>פרטי מנהל מערכת</h2>
      <form className="admin-details-form" onSubmit={handleAddUser}>
        <input
          type="text"
          placeholder="שם"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="מספר טלפון "
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <button type="submit">הוסף מנהל חדש </button>
      </form>
      {message && <p>{message}</p>}
      <button onClick={handleShowDetails}>
        {showDetails ? 'הסתר פרטי משתמש' : 'הצג פרטי משתמש'}
      </button>
      {showDetails && (
        <div className="admin-list-container">
          <h3>רשימת מנהלים</h3>
          <ul className="admin-list">
            {admins.map(admin => (
              <li key={admin.id}>
                <p>שם: {admin.name}</p>
                <p>אימייל: {admin.email}</p>
                <p>מספר טלפון : {admin.phoneNumber}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showDeleteConfirm ? (
        <div className="delete-confirm-container">
          <p>האם אתה בטוח שברצונך למחוק את חשבונך?</p>
          <button onClick={handleDeleteAccount}>כן, מחק את החשבון שלי</button>
          <button onClick={cancelDeleteAccount}>לא, שמור על החשבון שלי</button>
        </div>
      ) : (
        <button className="delete-account-button" onClick={confirmDeleteAccount}>מחק חשבון !</button>
      )}
      <Footer /> {/* Add Footer component here */}
    </div>
  );
};

export default AdminDetails;
