import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { updatePassword } from 'firebase/auth';
import './ChangePassword.css';
import HomeButton from './HomeButton'; // Import HomeButton
import Footer from './Footer'; // Import Footer

const ChangePassword = ({ navigateTo }) => { // Add navigateTo prop
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (newPassword === confirmPassword) {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        alert('סיסמה שונתה בהצלחה!');
      }
    } else {
      alert('סיסמאות לא תואמות!');
    }
  };

  return (
    <div className="change-password-container">
      <HomeButton navigateTo={navigateTo} className="home-button" /> {/* Move HomeButton to top left */}
      <h2>שנה סיסמא</h2>
      <form className="change-password-form">
        <input
          type="password"
          placeholder="סיסמה חדשה"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="אשר סיסמה"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="button" onClick={handleChangePassword}>שנה סיסמא</button>
      </form>
      <Footer /> {/* Add Footer component here */}
    </div>
  );
};

export default ChangePassword;
