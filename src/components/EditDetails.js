import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import './EditDetails.css'; 
import Footer from './Footer'; // Importing Footer component
import HomeButton from './HomeButton'; // Importing HomeButton component

const EditDetails = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'admins', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setName(userData.name);
          setPhone(userData.phoneNumber);
          setEmail(userData.email);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    const user = auth.currentUser;
    if (user) {
      // Convert inputs to lowercase for case-insensitive checks
      const lowercaseEmail = email.toLowerCase();
      const lowercasePhone = phoneNumber.toLowerCase();
      const lowercaseName = name.toLowerCase();

      // Check for duplicate data
      const adminsRef = collection(db, 'admins');
      
      // Check for duplicate email
      const emailQuery = query(adminsRef, where('email', '==', lowercaseEmail));
      const emailSnapshot = await getDocs(emailQuery);
      const emailExists = !emailSnapshot.empty && emailSnapshot.docs.some(doc => doc.id !== user.uid);

      // Check for duplicate phone number
      const phoneQuery = query(adminsRef, where('phoneNumber', '==', lowercasePhone));
      const phoneSnapshot = await getDocs(phoneQuery);
      const phoneExists = !phoneSnapshot.empty && phoneSnapshot.docs.some(doc => doc.id !== user.uid);

      // Check for duplicate name
      const nameQuery = query(adminsRef, where('name', '==', lowercaseName));
      const nameSnapshot = await getDocs(nameQuery);
      const nameExists = !nameSnapshot.empty && nameSnapshot.docs.some(doc => doc.id !== user.uid);

      if (emailExists || phoneExists || nameExists) {
        alert('The email, phone number, or name is already in use by another admin. Please change them.');
      } else {
        const docRef = doc(db, 'admins', user.uid);
        await updateDoc(docRef, {
          name,
          phoneNumber,
          email
        });
        alert('Details updated successfully!');
      }
    }
  };

  return (
    <div className="edit-details">
      <HomeButton /> {/* Adding HomeButton component here */}
      <h2>ערוך את הפרטים שלי </h2>
      <form>
        <input
          type="text"
          placeholder="שם"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="מספר טלפון "
          value={phoneNumber}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="button" onClick={handleUpdate}>עדכון</button>
      </form>
      <Footer /> {/* Adding Footer component here */}
    </div>
  );
};

export default EditDetails;
