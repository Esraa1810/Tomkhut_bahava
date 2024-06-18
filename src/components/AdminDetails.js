import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import './AdminDetails.css';

const AdminDetails = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admin details: ', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await addDoc(collection(db, 'admins'), {
        name,
        email,
        phoneNumber,
        passwordChanged: false,
      });

      setMessage('User added successfully');
      setName('');
      setEmail('');
      setPhoneNumber('');
      setAdmins([...admins, { id: userCredential.id, name, email, phoneNumber }]);
    } catch (error) {
      console.error('Error adding user: ', error.message);
      setMessage('Error adding user: ' + error.message);
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="admin-details-container">
      <h2>Admin Details</h2>
      <form className="admin-details-form" onSubmit={handleAddUser}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <button type="submit">Add User</button>
      </form>
      {message && <p>{message}</p>}
      <button onClick={handleShowDetails}>
        {showDetails ? 'Hide User Details' : 'Show User Details'}
      </button>
      {showDetails && (
        <div>
          <h3>List of Admins</h3>
          <ul className="admin-list">
            {admins.map(admin => (
              <li key={admin.id}>
                <p>Name: {admin.name}</p>
                <p>Email: {admin.email}</p>
                <p>Phone: {admin.phoneNumber}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDetails;
