import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './VolunteerReport.css';
import { fetchCities } from '../cityService';
import languages from '../languages';
import profession from '../profession';
import { Link } from 'react-router-dom';
// import Header from '../Header';
import HomeButton from '../HomeButton';
import { writeFile, utils } from 'xlsx';
import { Timestamp } from 'firebase/firestore';  // Import Timestamp

// Define options for filters
const religiousOptions = [
  { value: true, label: 'דתי' },
  { value: false, label: 'לא דתי' },
];

const ableOptions = [
  { value: 'בוקר', label: 'בוקר' },
  { value: 'ערב', label: 'ערב' },
  { value: 'לילה', label: 'לילה' },
];

const VolunteerReport = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedProfession, setSelectedProfession] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startDateCreat, setStartDateCreat] = useState(null);
  const [endDateCreat, setEndDateCreat] = useState(null);
  const [selectedAble, setSelectedAble] = useState([]);
  const [selectedReligious, setSelectedReligious] = useState([]);

  useEffect(() => {
    const getCities = async () => {
      const fetchedCities = await fetchCities();
      const cityOptions = fetchedCities.map(city => ({ value: city, label: city }));
      setCities(cityOptions);
    };
    getCities();
  }, []);

  const fetchVolunteer = async () => {
    try {
      let baseQuery = collection(db, 'volunteer');
      let filters = [];
    
      // Add city filter
      if (selectedCities.length > 0) {
        const selectedCityValues = selectedCities.map(city => city.value);
        filters.push(where('city', 'in', selectedCityValues));
      }
    
      // Firestore allows only one `array-contains-any` filter per query. Handle it with a fallback to client-side filtering.
      let combinedArrayFilters = [];
      if (selectedLanguages.length > 0) {
        combinedArrayFilters.push({ field: 'languages', values: selectedLanguages.map(language => language.value) });
      }
      if (selectedProfession.length > 0) {
        combinedArrayFilters.push({ field: 'profession', values: selectedProfession.map(profession => profession.value) });
      }
      if (selectedAble.length > 0) {
        combinedArrayFilters.push({ field: 'able', values: selectedAble.map(able => able.value) });
      }
    
      if (combinedArrayFilters.length > 0) {
        // Use only the first array-contains-any filter in Firestore query
        filters.push(where(combinedArrayFilters[0].field, 'array-contains-any', combinedArrayFilters[0].values));
      }
    
      // Add religious filter
      if (selectedReligious.length > 0) {
        const selectedReligiousValues = selectedReligious.map(religious => religious.value);
        filters.push(where('religious', 'in', selectedReligiousValues));
      }
    
      // Convert dates to Firestore Timestamps
      if (startDate && !isNaN(startDate.getTime())) {
        filters.push(where('birthDate', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate && !isNaN(endDate.getTime())) {
        filters.push(where('birthDate', '<=', Timestamp.fromDate(endDate)));
      }
    
      if (startDateCreat && !isNaN(startDateCreat.getTime())) {
        filters.push(where('createdAt', '>=', Timestamp.fromDate(startDateCreat)));
      }
      if (endDateCreat && !isNaN(endDateCreat.getTime())) {
        filters.push(where('createdAt', '<=', Timestamp.fromDate(endDateCreat)));
      }
    
      // Combine baseQuery with all filters
      const combinedQuery = query(baseQuery, ...filters);
      const querySnapshot = await getDocs(combinedQuery);
      
      let volunteerList = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        volunteerList.push({
          idDoc: doc.id,
          ...data,
          birthDate: data.birthDate ? data.birthDate.toDate() : null,
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
        });
      });
    
      // Client-side filtering for the additional array-contains-any conditions
      if (combinedArrayFilters.length > 1) {
        for (let i = 1; i < combinedArrayFilters.length; i++) {
          const { field, values } = combinedArrayFilters[i];
          volunteerList = volunteerList.filter(volunteer => {
            return values.some(value => volunteer[field]?.includes(value));
          });
        }
      }
    
      // Additional client-side filtering for `createdAt`
      if (startDateCreat && !endDateCreat) {
        volunteerList = volunteerList.filter(volunteer => volunteer.createdAt >= startDateCreat);
      } else if (!startDateCreat && endDateCreat) {
        volunteerList = volunteerList.filter(volunteer => volunteer.createdAt <= endDateCreat);
      } else if (startDateCreat && endDateCreat) {
        volunteerList = volunteerList.filter(volunteer => volunteer.createdAt >= startDateCreat && volunteer.createdAt <= endDateCreat);
      }
    
      // Ensure uniqueness of volunteers
      const uniqueVolunteers = Array.from(new Set(volunteerList.map(vol => vol.idDoc)))
        .map(id => volunteerList.find(vol => vol.idDoc === id));
    
      setVolunteers(uniqueVolunteers);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  useEffect(() => {
    fetchVolunteer();
  }, [selectedCities, selectedLanguages, selectedProfession, startDate, endDate, startDateCreat, endDateCreat, selectedAble, selectedReligious]);

  const exportToExcel = () => {
    const data = volunteers.map(volunteer => ({
      'שם מתנדב': volunteer.firstname + ' ' + volunteer.lastname,
      'טלפון': volunteer.phoneNumber,
      'ת.ז.': volunteer.id,
      'תאריך לידה': volunteer.birthDate ? new Date(volunteer.birthDate).toLocaleDateString('he-IL') : '',
      'זמינות': volunteer.able ? volunteer.able.join(', ') : '',
      'עיר': volunteer.city,
      'תאריך יצירה': volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString('he-IL') : '',
      'שפות': volunteer.languages ? volunteer.languages.join(', ') : '',
      'מקצועות': volunteer.profession ? volunteer.profession.join(', ') : '',
      'דתי/לא דתי': volunteer.religious ? 'דתי' : 'לא דתי',
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Volunteers');
    writeFile(wb, 'VolunteerReport.xlsx');
  };

  return (
    <div>
      <div className="volunteer-report-container">

      <HomeButton />
      
      <div className="Addess">
        <h1>הפקת דוח-מתנדבות</h1>
      </div>


       
        <div className="first-filter-container">
          <div className="filter-section">
            <label>עיר:</label>
            <Select
              options={cities}
              isMulti
              value={selectedCities}
              onChange={setSelectedCities}
            />
          </div>
          <div className="filter-section">
            <label>שפות:</label>
            <Select
              options={languages}
              isMulti
              value={selectedLanguages}
              onChange={setSelectedLanguages}
            />
          </div>
        </div>
        <div className="Second-filter-sectionBirth">
          <div className="filter-section">
            <label>מקצועות:</label>
            <Select
              options={profession}
              isMulti
              value={selectedProfession}
              onChange={setSelectedProfession}
            />
          </div>
          <div className="filter-section">
            <label>זמינות:</label>
            <Select
              options={ableOptions}
              isMulti
              value={selectedAble}
              onChange={setSelectedAble}
            />
          </div>
        </div>
        <div className="third-filter-sectionBirth">
          
          <div className="filter-section">
            <label>דתי/לא דתי:</label>
            <Select
              options={religiousOptions}
              isMulti
              value={selectedReligious}
              onChange={setSelectedReligious}
            />
          </div>
        </div>
        <div className="special-sectio">
          <div className="forth-filter-sectionBirth">
            <div className="filter-section">
              <label>תאריך לידה מ:</label>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                locale="he"
                placeholderText="dd/MM/yyyy"
              />
            </div>
            <div className="filter-section">
              <label>תאריך לידה עד:</label>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                locale="he"
                placeholderText="dd/MM/yyyy"
                minDate={startDate}
              />
            </div>
          </div>
          <div className="fifth-filter-sectionCreatedAt">
            <div className="filter-section">
              <label>תאריך יצירה מ:</label>
              <DatePicker
                selected={startDateCreat}
                onChange={date => setStartDateCreat(date)}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                locale="he"
                placeholderText="dd/MM/yyyy"
              />
            </div>
            <div className="filter-section">
              <label>תאריך יצירה עד:</label>
              <DatePicker
                selected={endDateCreat}
                onChange={date => setEndDateCreat(date)}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                locale="he"
                placeholderText="dd/MM/yyyy"
                minDate={startDateCreat}
              />
            </div>
          </div>
        </div>

        <div className="export-button-container">
        <button onClick={exportToExcel} className="export-button">
          יצא לאקסל
        </button>
      </div>

        <table className="volunteers-report-table">
          <thead>
            <tr>
              <th>שם מתנדב</th>
              <th>טלפון</th>
              <th>ת.ז.</th>
              <th>תאריך לידה</th>
              <th>זמינות</th>
              <th>עיר</th>
              <th>תאריך יצירה</th>
              <th>שפות</th>
              <th>מקצועות</th>
              <th>דתי/לא דתי</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((volunteer) => (
              <tr key={volunteer.idDoc}>
                <td>
                  <Link to={`/volunteerdetails/${volunteer.idDoc}`}>
                    {volunteer.firstname + ' ' + volunteer.lastname}
                  </Link>
                </td>
                <td>{volunteer.phoneNumber}</td>
                <td>{volunteer.id}</td>
                <td>{volunteer.birthDate ? new Date(volunteer.birthDate).toLocaleDateString('he-IL') : ''}</td>
                <td>{volunteer.able ? volunteer.able.join(', ') : ''}</td>
                <td>{volunteer.city}</td>
                <td>{volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString('he-IL') : ''}</td>
                <td>{volunteer.languages ? volunteer.languages.join(', ') : ''}</td>
                <td>{volunteer.profession ? volunteer.profession.join(', ') : ''}</td>
                <td>{volunteer.religious ? 'דתי' : 'לא דתי'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VolunteerReport;
