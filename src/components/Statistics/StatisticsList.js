import React from 'react';
import { useNavigate } from 'react-router-dom';
import HomeButton from '../HomeButton'; // Import the HomeButton component
import Footer from '../Footer'; // Import the Footer component
import SearchComponent from '../SearchComponent'; // Import the SearchComponent
import './StatisticsList.css';

const StatisticsList = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="statistics-list-container">
        <HomeButton /> {/* Add the HomeButton component */}
        <SearchComponent /> {/* Add the SearchComponent */}
        <div className="statistics-list-box">
          <h1>סטטיסטיקות</h1>
          <ul className="statistics-list">
            <li onClick={() => navigate('/statistics-girls')}>סטטיסטיקות-צעירות</li>
            <li onClick={() => navigate('/statistics-supports')}>סטטיסטיקות-ליווים</li>
            <li onClick={() => navigate('/statistics-volunteers')}>סטטיסטיקות-מתנדבות</li>
            {/* <li onClick={() => navigate('/statistics-frameworks')}>סטטיסטיקות-מסגרות מלוות</li> */}
          </ul>
        </div>
      </div>
      <Footer /> {/* Add the Footer component outside the statistics-list-container */}
    </div>
  );
};

export default StatisticsList;
