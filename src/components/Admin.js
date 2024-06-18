import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import AdminDetails from './AdminDetails';
import ChangePassword from './ChangePassword';
import Messaging from './Messaging';
import './Admin.css'; // Add some styles if needed

const Admin = ({ onLogout }) => {
  const [adminDetails, setAdminDetails] = useState(null);
  const [currentView, setCurrentView] = useState('details');

  useEffect(() => {
    const fetchAdminDetails = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'admins', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAdminDetails(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    };
    fetchAdminDetails();
  }, []);

  return (
    <div className="admin-container">
      <h2>Admin Page</h2>
      {adminDetails ? (
        <div>
          <p> {adminDetails.name}</p>
          <div className="admin-buttons">
            <button onClick={() => setCurrentView('details')}>User Details</button>
            <button onClick={() => setCurrentView('changePassword')}>Change Password</button>
            <button onClick={() => setCurrentView('messaging')}>Messaging</button>
            <button onClick={onLogout}>Logout</button>
          </div>
          
          {currentView === 'details' && <AdminDetails />}
          {currentView === 'changePassword' && <ChangePassword />}
          {currentView === 'messaging' && <Messaging />}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Admin;
