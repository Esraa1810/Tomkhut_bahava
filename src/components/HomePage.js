import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import SearchComponent from './SearchComponent';
import JoinOptionsPopup from './JoinOptionsPopup';
import Footer from './Footer';
import HomeButton from './HomeButton';
import Notifications from './Notifications';

const HomePage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [isJoinOptionsOpen, setIsJoinOptionsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const docRef = doc(db, 'admins', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(docSnap.data());
        }
      }
    };

    fetchUserData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const toggleUserPopup = () => {
    setIsUserPopupOpen(!isUserPopupOpen);
  };

  const toggleJoinOptions = () => {
    setIsJoinOptionsOpen(!isJoinOptionsOpen);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User signed out');
        navigate('/');
      })
      .catch((error) => {
        console.error('Sign out error', error);
      });
  };

  return (
    <div className="App">
      <div className="home-button-container">
        <HomeButton />
      </div>
      <Notifications /> {/* Include the Notifications component */}
      <div className="user-icon" onClick={toggleUserPopup}>
        <img src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png" alt="User Icon" width="30" height="30" />
      </div>
      {isUserPopupOpen && (
        <div id="userPopup" className="user-popup">
          <h3>שלום , {user ? user.name : 'User'} </h3>
          <button onClick={() => navigate('/editDetails')}>לערוך את הפרטים שלך </button>
          <button onClick={() => navigate('/changePassword')}>שנה סיסמא </button>
          <button onClick={toggleUserPopup}>סגור</button>
        </div>
      )}
      {isUserPopupOpen && <div id="overlay" className="overlay" onClick={toggleUserPopup}></div>}
      <div className="container">
        <div id="mySidenav" className={`sidenav ${isSidebarOpen ? 'open' : ''}`}>
          <button className="closebtn" onClick={toggleSidebar}>
            <img src={`${process.env.PUBLIC_URL}/xclose.png`} alt="Close" className="close-icon" />
          </button>
          <button onClick={toggleJoinOptions}>הצטרפות לעמותה</button>
          <button onClick={() => navigate('/adminDetails')}>הוספת מנהל חדש</button>
          <button onClick={handleLogout}>יציאה מחשבון</button>
        </div>

        <div className="top-bar"></div>

        <div className="buttons-container">
          <div className="top-buttons">
            <button onClick={togglePopup}>
              <img src={`${process.env.PUBLIC_URL}/create.png`} alt="Archive" className="button-icon" />
              הוספה
            </button>
            <button onClick={() => navigate('/reports')}>
              <img src={`${process.env.PUBLIC_URL}/reports.png`} alt="Archive" className="button-icon" />
              הפקת דוחות
            </button>
            <button onClick={() => navigate('/messaging')}>
              <img src={`${process.env.PUBLIC_URL}/messages.png`} alt="Archive" className="button-icon" />
              הודעות
            </button>
          </div>
          <div className="bottom-buttons">
            <button onClick={() => navigate('/recentForms')}>
              <img src={`${process.env.PUBLIC_URL}/recent.png`} alt="Archive" className="button-icon" />
              טפסים שהתקבלו לאחרונה
            </button>
            <button onClick={() => navigate('/statistics')}>
              <img src={`${process.env.PUBLIC_URL}/statistics.png`} alt="Archive" className="button-icon" />
              סטטיסטיקות
            </button>
          </div>
        </div>

        {isPopupOpen && (
          <div id="popupWindow" className="popup-window">
            <div className="popup-buttons">
              <button onClick={() => navigate('/createGirlForm')}>הוספת צעירות</button>
              <button onClick={() => navigate('/volunteerForm')}>הוספת מתנדבות</button>
              <button onClick={() => navigate('/createframework')}>הוספת מסגרת מלווה</button>
              <button onClick={togglePopup}>סגירה</button>
            </div>
          </div>
        )}

        {isPopupOpen && <div id="overlay" className="overlay" onClick={togglePopup}></div>}
        {isJoinOptionsOpen && (
          <JoinOptionsPopup onClose={toggleJoinOptions} />
        )}
        {isJoinOptionsOpen && <div id="overlay" className="overlay" onClick={toggleJoinOptions}></div>}

        <span style={{ fontSize: '30px', cursor: 'pointer', position: 'fixed', top: '10px', left: '10px', zIndex: 2 }} onClick={toggleSidebar}>&#9776;</span>

        <div className="search-container">
          <SearchComponent navigateTo={navigate} />
        </div>
      </div>
      <div className="hello-text">
        שלום {user ? user.name : 'User'}
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
