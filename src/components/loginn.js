import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './loginn.css';
import Header from './Header'; // Import the Header component
import Footer from './Footer';

const Loginn = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User signed in:', user);

      const docRef = doc(db, 'admins', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const adminData = docSnap.data();
        console.log('Admin document found:', adminData);

        if (!adminData.passwordChanged) {
          setShowReminder(true);
        }

        onLogin(); // Call the onLogin callback on successful login
        navigate('/home'); // Navigate to the HomePage
      } else {
        alert('No such admin found!');
        console.error('No admin document found for user:', user.uid);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('שגיאה בכניסה: ' + error.message);
    }
  };

  const handleDismissReminder = () => {
    setShowReminder(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert('אנא הזן את כתובת האימייל שלך');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('קישור לאיפוס סיסמה נשלח לאימייל שלך');
    } catch (error) {
      console.error('Password reset error:', error);
      alert('שגיאה בשליחת איפוס סיסמה: ' + error.message);
    }
  };

  const shouldShowFooter = !document.querySelector('.volunteer-report-container');

  return (
    <div className="login-page">
      <Header /> {/* Use the Header component */}
      <div className="login-container">
        <h2>כניסה למערכת</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="מייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <img
              src={showPassword ? `${process.env.PUBLIC_URL}/eye.png` : `${process.env.PUBLIC_URL}/closedeye.png`}
              alt="Toggle Password Visibility"
              onClick={togglePasswordVisibility}
              className="eye-icon"
            />
          </div>
          <button type="submit">כניסה</button>
        </form>
        <p className="forgot-password" onClick={handlePasswordReset}>שכחתי סיסמה</p>
      </div>
      {showReminder && (
        <div className="reminder-overlay">
          <div className="reminder-content">
            <h3>זכור לשנות את הסיסמה שלך</h3>
            <button onClick={handleDismissReminder}>Dismiss</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Loginn;
