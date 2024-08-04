import React from 'react';
import './ReportsList.css'; // Make sure to create and style this CSS file accordingly
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import HomeButton from '../HomeButton';
import SearchComponent from '../SearchComponent'; // Import the SearchComponent
const ReportsList = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="reports-list-container">
        <h1>הפקת דוחות</h1>
        <HomeButton />
        <SearchComponent /> {/* Add the SearchComponent here */}
        <ul className="reports-list">
          <li onClick={() => navigate('/girlsReport')}>101 - הפקת דוח-צעירות</li>
          <li onClick={() => navigate('/supportsReport')}>102 - הפקת דוח-ליווים</li>
          <li onClick={() => navigate('/volunteersReport')}>103 - הפקת דוח-מתנדבות</li>
          <li onClick={() => navigate('/frameWorkReport')}>104 - הפקת דוח-מסגרות מלוות</li>
          </ul>
      </div>
      <Footer />
    </div>
  );
};

export default ReportsList;
