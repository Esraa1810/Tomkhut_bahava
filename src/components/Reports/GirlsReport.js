import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust the path according to your project structure
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './GirlsReport.css'; // Create and style this CSS file accordingly
import { fetchCities } from '../cityService'; // Import the city fetching function
import languages from '../languages'; // Correct import statement
import { Link } from 'react-router-dom';
import HomeButton from '../HomeButton'; // Import HomeButton component
import { writeFile, utils } from 'xlsx'; // Import the required functions


const GirlsReport = () => {
  const [girls, setGirls] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedFosterFamily, setSelectedFosterFamily] = useState([]);

  const statusOptions = [
    { value: true, label: 'פעיל' },
    { value: false, label: 'לא פעיל' }
  ];

  const fosterFamilyOptions = [
    { value: 'כן', label: 'כן' },
    { value: 'לא', label: 'לא' }
  ];

  useEffect(() => {
    const getCities = async () => {
      const fetchedCities = await fetchCities();
      const cityOptions = fetchedCities.map(city => ({ value: city, label: city }));
      setCities(cityOptions);
    };
    getCities();
  }, []);

  const fetchGirls = async () => {
    const girlsQuerySnapshot = await getDocs(collection(db, 'girls'));
    const helpRecordsQuerySnapshot = await getDocs(collection(db, 'help_record'));
    const currentDate = new Date();

    const helpRecords = helpRecordsQuerySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        startDate: data.startDate ? data.startDate.toDate() : null,
        endDate: data.endDate ? data.endDate.toDate() : null,
        girlPhone: data.girlPhone
      };
    });

    const girlsList = girlsQuerySnapshot.docs.map(doc => {
      const data = doc.data();
      const girlHelpRecords = helpRecords.filter(record => record.girlPhone === data.phoneNumber);
      const status = girlHelpRecords.some(record => {
        const startDate = record.startDate;
        const endDate = record.endDate;
        return startDate <= currentDate && (!endDate || endDate >= currentDate);
      });

      return {
        idDoc: doc.id,
        ...data,
        birthDate: data.birthDate ? data.birthDate.toDate() : null,
        status
      };
    });

    let filteredGirls = girlsList;

    if (selectedCities.length > 0) {
      const selectedCityValues = selectedCities.map(city => city.value);
      filteredGirls = filteredGirls.filter(girl => selectedCityValues.includes(girl.city));
    }

    if (selectedLanguages.length > 0) {
      const selectedLanguageValues = selectedLanguages.map(language => language.value);
      filteredGirls = filteredGirls.filter(girl =>
        girl.languages && girl.languages.some(language => selectedLanguageValues.includes(language))
      );
    }

    if (startDate) {
      filteredGirls = filteredGirls.filter(girl => girl.birthDate >= startDate);
    }

    if (endDate) {
      filteredGirls = filteredGirls.filter(girl => girl.birthDate <= endDate);
    }

    if (selectedStatus.length > 0) {
      const selectedStatusValues = selectedStatus.map(status => status.value);
      filteredGirls = filteredGirls.filter(girl => selectedStatusValues.includes(girl.status));
    }

    if (selectedFosterFamily.length > 0) {
      const selectedFosterFamilyValues = selectedFosterFamily.map(option => option.value);
      filteredGirls = filteredGirls.filter(girl => selectedFosterFamilyValues.includes(girl.fosterFamily));
    }

    setGirls(filteredGirls);
  };

  useEffect(() => {
    fetchGirls();
  }, [selectedCities, selectedLanguages, selectedStatus, selectedFosterFamily]);


  const exportToExcel = () => {
    // Create a workbook and a worksheet
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(girls.map(girl => ({
      "שם": `${girl.firstName} ${girl.lastName}`,
      "תאריך לידה": girl.birthDate ? girl.birthDate.toLocaleDateString('he-IL') : '',
      "מספר טלפון": girl.phoneNumber || '',
      "עיר": girl.city || '',
      "שפות": girl.languages ? girl.languages.join(', ') : '',
      "משפחת אומנה": girl.fosterFamily || '',
      "סטטוס": girl.status ? 'פעיל' : 'לא פעיל'
    })));

    // Add the worksheet to the workbook
    utils.book_append_sheet(wb, ws, 'Girls Report');

    // Write the file
    writeFile(wb, 'GirlsReport.xlsx');
  };

  return (
    <div className="girls-report-container">
      {/* HomeButton component */}
      <HomeButton />
      
      <div className="Addess">
        <h1>הפקת דוח-צעירות</h1>
      </div>

      <div className="first-filter-container">
        <div className="filter-section">
          <label htmlFor="city-select">עיר:</label>
          <Select
            id="city-select"
            isMulti
            options={cities}
            value={selectedCities}
            onChange={setSelectedCities}
            placeholder="בחר עיר"
          />
        </div>
        <div className="filter-section">
          <label htmlFor="language-select">שפות:</label>
          <Select
            id="language-select"
            isMulti
            options={languages}
            value={selectedLanguages}
            onChange={setSelectedLanguages}
            placeholder="בחר שפה"
          />
        </div>
      </div>

      <div className="Second-filter-sectionBirth">
        <div className="filter-section">
          <label htmlFor="status-select">סטָטוּס:</label>
          <Select
            id="status-select"
            isMulti
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="בחר סטָטוּס"
          />
        </div>
        <div className="filter-section">
          <label htmlFor="fosterFamily-select">משפחת אומנה:</label>
          <Select
            id="fosterFamily-select"
            isMulti
            options={fosterFamilyOptions}
            value={selectedFosterFamily}
            onChange={setSelectedFosterFamily}
            placeholder="בחר משפחת אומנה"
          />
        </div>
      </div>

      {/* <div className="date-range">
        <label>תאריך לידה מ-</label>
        <DatePicker
          selected={startDate}
          onChange={date => setStartDate(date)}
          dateFormat="dd/MM/yyyy"
          showYearDropdown
          showMonthDropdown
          locale="he"
          placeholderText="dd/MM/yyyy"
          selectsStart
          startDate={startDate}
          endDate={endDate}
        />
        <label>עד-</label>
        <DatePicker
          selected={endDate}
          onChange={date => setEndDate(date)}
          dateFormat="dd/MM/yyyy"
          showYearDropdown
          showMonthDropdown
          locale="he"
          placeholderText="dd/MM/yyyy"
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
        />
      </div> */}


<div className="export-button-container">
        <button onClick={exportToExcel} className="export-button">
          יצא לאקסל
        </button>
      </div>

      <table className="girls-table">
        <thead>
          <tr>
            <th>שם</th>
            <th>תאריך לידה</th>
            <th>מספר טלפון</th>
            <th>עיר</th>
            <th>שפות</th>
            <th>משפחת אומנה</th>
            <th>סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {girls.map((girl, index) => (
            <tr key={girl.idDoc}>
              <td>
                <Link to={`/girldetails/${girl.idDoc}`}>
                  {girl.firstName + ' ' + girl.lastName}
                </Link>
              </td>
              <td>{girl.birthDate ? girl.birthDate.toLocaleDateString('he-IL') : ''}</td>
              <td>{girl.phoneNumber || ''}</td>
              <td>{girl.city || ''}</td>
              <td>{girl.languages ? girl.languages.join(', ') : ''}</td>
              <td>{girl.fosterFamily || ''}</td>
              <td>{girl.status ? 'פעיל' : 'לא פעיל'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer component */}
    </div>
  );
};

export default GirlsReport;
