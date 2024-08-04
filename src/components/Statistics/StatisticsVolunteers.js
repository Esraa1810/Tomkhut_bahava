import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import './StatisticsVolunteers.css';
import { fetchCities } from '../cityService';
import languages from '../languages';
import profession from '../profession';
import { Link } from 'react-router-dom';
import HomeButton from '../HomeButton'; // Import HomeButton component


const StatisticsVolunteer = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const [selectedCity, setSelectedCity] = useState([]); // change to array
  const [selectedProfession, setSelectedProfession] = useState([]); // change to array
  const [selectedLanguage, setSelectedLanguage] = useState([]); // change to array
  const [selectedReligious, setSelectedReligious] = useState([]); // change to array
  const [selectedAble, setSelectedAble] = useState([]); // change to array
  
  const [startYearCreatedAt, setStartYearCreatedAt] = useState(null);
  const [endYearCreatedAt, setEndYearCreatedAt] = useState(null);
  const [startYearBirthDate, setStartYearBirthDate] = useState(null);
  const [endYearBirthDate, setEndYearBirthDate] = useState(null);
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [volunteer, setVolunteer] = useState([]);
  const [filteredVolunteer, setFilteredVolunteer] = useState([]);
  const [cities, setCities] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const options = [
    { value: 'religious', label: 'דתיות' },
    { value: 'city', label: 'עיר' },
    { value: 'languages', label: 'שפות' },
    { value: 'able', label: 'פנוי' },
    { value: 'yearJoining', label: 'שנת הצטרפות' },
    { value: 'yearBirth', label: 'שנת לידה' },
    { value: 'profession', label: 'מקצוע' }
  ];

  const religiousOptions = [
    { value: true, label: 'דתי' },
    { value: false, label: 'לא דתי' }
  ];

  const ableOptions = [
    { value: 'בוקר', label: 'בוקר' },
    { value: 'ערב', label: 'ערב' },
    { value: 'לילה', label: 'לילה' },
  ];

  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F39C12', '#8E44AD', '#2ECC71',
    '#E74C3C', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6', '#16A085'
  ];

  const getColor = (index) => colors[index % colors.length];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const citiesList = await fetchCities();
        setCities(citiesList.map(city => ({ value: city, label: city })));

        const volunteerCollection = collection(db, 'volunteer');
        const volunteerSnapshot = await getDocs(volunteerCollection);
        const volunteerData = volunteerSnapshot.docs.map(doc => ({
          ...doc.data(),
          idDoc: doc.id
        }));
        setVolunteer(volunteerData);

        const filtered = volunteerData
        .filter(volunteer => selectedCity.length > 0 ? selectedCity.some(city => volunteer.city === city.value) : true)
        .filter(volunteer => selectedProfession.length > 0 ? volunteer.profession && selectedProfession.some(prof => volunteer.profession.includes(prof.value)) : true)
        .filter(volunteer => selectedLanguage.length > 0 ? volunteer.languages && selectedLanguage.some(lang => volunteer.languages.includes(lang.value)) : true)
        .filter(volunteer => selectedReligious.length > 0 ? selectedReligious.some(rel => volunteer.religious === rel.value) : true)
        .filter(volunteer => selectedAble.length > 0 ? volunteer.able && selectedAble.some(ableOption => volunteer.able.includes(ableOption.value)) : true)
          .filter(volunteer => {
            const createdAtYear = volunteer.createdAt?.seconds ? new Date(volunteer.createdAt.seconds * 1000).getFullYear() : null;
            return startYearCreatedAt && endYearCreatedAt ? (createdAtYear >= startYearCreatedAt.value && createdAtYear <= endYearCreatedAt.value) : true;
          })
          .filter(volunteer => {
            const birthDateYear = volunteer.birthDate?.seconds ? new Date(volunteer.birthDate.seconds * 1000).getFullYear() : null;
            return startYearBirthDate && endYearBirthDate ? (birthDateYear >= startYearBirthDate.value && birthDateYear <= endYearBirthDate.value) : true;
          });

        let formattedData = [];
        switch (selectedOption?.value) {
          case 'religious':
            const religiousCounts = { 'דתי': 0, 'לא דתי': 0 };
            filtered.forEach(volunteer => {
              const religiousLabel = volunteer.religious ? 'דתי' : 'לא דתי';
              religiousCounts[religiousLabel]++;
            });
            formattedData = Object.keys(religiousCounts).map((key, index) => ({
              name: key,
              count: religiousCounts[key],
              color: getColor(index),
            }));
            break;

          case 'able':
            const ableCounts = { 'בוקר': 0, 'ערב': 0, 'לילה': 0 };
            filtered.forEach(volunteer => {
              if (volunteer.able) {
                volunteer.able.forEach(time => {
                  ableCounts[time]++;
                });
              }
            });
            formattedData = Object.keys(ableCounts).map((key, index) => ({
              name: key,
              count: ableCounts[key],
              color: getColor(index),
            }));
            break;

          case 'city':
            const cityCounts = {};
            filtered.forEach(volunteer => {
              cityCounts[volunteer.city] = (cityCounts[volunteer.city] || 0) + 1;
            });
            formattedData = Object.keys(cityCounts).map((key, index) => ({
              name: key,
              count: cityCounts[key],
              color: getColor(index),
            }));
            break;

          case 'languages':
            const languageCounts = {};
            filtered.forEach(volunteer => {
              if (volunteer.languages) {
                volunteer.languages.forEach(language => {
                  languageCounts[language] = (languageCounts[language] || 0) + 1;
                });
              }
            });
            formattedData = Object.keys(languageCounts).map((key, index) => ({
              name: key,
              count: languageCounts[key],
              color: getColor(index),
            }));
            break;

          case 'yearJoining':
            const yearJoiningCounts = {};
            filtered.forEach(volunteer => {
              const createdAtYear = volunteer.createdAt?.seconds ? new Date(volunteer.createdAt.seconds * 1000).getFullYear() : null;
              if (createdAtYear) {
                yearJoiningCounts[createdAtYear] = (yearJoiningCounts[createdAtYear] || 0) + 1;
              }
            });
            formattedData = Object.keys(yearJoiningCounts).map((key, index) => ({
              name: key,
              count: yearJoiningCounts[key],
              color: getColor(index),
            }));
            break;

          case 'yearBirth':
            const yearBirthCounts = {};
            filtered.forEach(volunteer => {
              const birthDateYear = volunteer.birthDate?.seconds ? new Date(volunteer.birthDate.seconds * 1000).getFullYear() : null;
              if (birthDateYear) {
                yearBirthCounts[birthDateYear] = (yearBirthCounts[birthDateYear] || 0) + 1;
              }
            });
            formattedData = Object.keys(yearBirthCounts).map((key, index) => ({
              name: key,
              count: yearBirthCounts[key],
              color: getColor(index),
            }));
            break;

            case 'profession':
              const professionCounts = {};
              filtered.forEach(volunteer => {
                if (volunteer.profession) {
                  volunteer.profession.forEach(prof => {
                    if (selectedProfession.length === 0 || selectedProfession.some(selected => selected.value === prof)) {
                      professionCounts[prof] = (professionCounts[prof] || 0) + 1;
                    }
                  });
                }
              });
              formattedData = Object.keys(professionCounts).map((key, index) => ({
                name: key,
                count: professionCounts[key],
                color: getColor(index),
              }));
              break;
            

          default:
            break;
        }

        setData(formattedData);
        setFilteredVolunteer(filtered);
      } catch (error) {
        console.error('Error fetching volunteer data:', error);
      }
    };

    fetchData();
  }, [selectedOption, selectedCity, selectedProfession, selectedLanguage, selectedReligious, selectedAble, startYearCreatedAt, endYearCreatedAt, startYearBirthDate, endYearBirthDate]);

  const handleSelectChange = (option) => {
    setSelectedOption(option);
  };

  const handleCityChange = (options) => {
    setSelectedCity(options); // This will now be an array
  };
  
  const handleProfessionChange = (options) => {
    setSelectedProfession(options); // This will now be an array
  };
  
  const handleLanguageChange = (options) => {
    setSelectedLanguage(options); // This will now be an array
  };
  
  const handleReligiousChange = (options) => {
    setSelectedReligious(options); // This will now be an array
  };
  
  const handleAbleChange = (options) => {
    setSelectedAble(options); // This will now be an array
  };
  

  const handleStartYearCreatedAtChange = (option) => {
    setStartYearCreatedAt(option);
  };

  const handleEndYearCreatedAtChange = (option) => {
    setEndYearCreatedAt(option);
  };

  const handleStartYearBirthDateChange = (option) => {
    setStartYearBirthDate(option);
  };

  const handleEndYearBirthDateChange = (option) => {
    setEndYearBirthDate(option);
  };
  const handleChartClick = (data) => {
    if (!data || !data.name) return;
  
    const additionalFilters = volunteer.filter(volunteer => {
      const createdAtYear = volunteer.createdAt?.seconds ? new Date(volunteer.createdAt.seconds * 1000).getFullYear() : null;
      const birthDateYear = volunteer.birthDate?.seconds ? new Date(volunteer.birthDate.seconds * 1000).getFullYear() : null;
  
      return (
        (selectedCity.length === 0 || selectedCity.some(city => volunteer.city === city.value)) &&
        (selectedProfession.length === 0 || (volunteer.profession && selectedProfession.some(prof => volunteer.profession.includes(prof.value)))) &&
        (selectedLanguage.length === 0 || (volunteer.languages && selectedLanguage.some(lang => volunteer.languages.includes(lang.value)))) &&
        (selectedReligious.length === 0 || selectedReligious.some(rel => volunteer.religious === rel.value)) &&
        (selectedAble.length === 0 || (volunteer.able && selectedAble.some(ableOption => volunteer.able.includes(ableOption.value)))) &&
        (startYearCreatedAt && endYearCreatedAt ? (createdAtYear >= startYearCreatedAt.value && createdAtYear <= endYearCreatedAt.value) : true) &&
        (startYearBirthDate && endYearBirthDate ? (birthDateYear >= startYearBirthDate.value && birthDateYear <= endYearBirthDate.value) : true)
      );
    });
  
    const filtered = additionalFilters.filter(volunteer => {
      switch (selectedOption?.value) {
        case 'religious':
          return volunteer.religious === (data.name === 'דתי');
        case 'able':
          return volunteer.able && volunteer.able.includes(data.name);
        case 'city':
          return volunteer.city === data.name;
        case 'languages':
          return volunteer.languages && volunteer.languages.includes(data.name);
        case 'yearJoining':
          const createdAtYear = volunteer.createdAt?.seconds ? new Date(volunteer.createdAt.seconds * 1000).getFullYear() : null;
          return createdAtYear === parseInt(data.name, 10);
        case 'yearBirth':
          const birthDateYear = volunteer.birthDate?.seconds ? new Date(volunteer.birthDate.seconds * 1000).getFullYear() : null;
          return birthDateYear === parseInt(data.name, 10);
        case 'profession':
          return volunteer.profession && volunteer.profession.includes(data.name);
        default:
          return false;
      }
    });
  
    setFilteredVolunteer(filtered);
    setShowTable(true);
  };
  

  return (
    <div className="statistics-volunteers">
      
      <HomeButton />
      
      <div className="Addess">
      <h1>סטטיסטיקות מתנדבים</h1>
      </div>

      <div><h3>בחר את הנושא העיקרי שברצונך לבחון את התרשים עבורו:</h3></div>
        <div className="category-selector full-width">
          {options.map(option => (
            <label key={option.value} className="checkbox-label">
              <input
                type="radio"
                name="category"
                value={option.value}
                checked={selectedOption?.value === option.value}
                onChange={() => handleSelectChange(option)}
              />
              {option.label}
            </label>
          ))}
        </div>
      <div className="filters">
        <div><h3>בחר נושא לפרטים נוספים:</h3></div>
        <div className="filter-pair">
          <Select
          isMulti
            value={selectedCity}
            onChange={handleCityChange}
            options={cities}
            placeholder="בחר עיר"
            isClearable
            className="half-width"
          />
          <Select
          isMulti
            value={selectedProfession}
            onChange={handleProfessionChange}
            options={profession}
            placeholder="בחר מקצוע"
            isClearable
            className="half-width"
          />
        </div>
        <div className="filter-pair">
          <Select
          isMulti
            value={selectedLanguage}
            onChange={handleLanguageChange}
            options={languages}
            placeholder="בחר שפה"
            isClearable
            className="half-width"
          />
          <Select
          isMulti
            value={selectedReligious}
            onChange={handleReligiousChange}
            options={religiousOptions}
            placeholder="בחר דתיות"
            isClearable
            className="half-width"
          />
        </div>
        <Select
        isMulti
          options={ableOptions}
          onChange={handleAbleChange}
          value={selectedAble}
          placeholder="Select availability"
          isClearable
          className="select half-width"
        />
        <div className="filter-pair">
          <Select
          
            value={startYearCreatedAt}
            onChange={handleStartYearCreatedAtChange}
            options={Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => ({
              value: i + 2000,
              label: i + 2000
            }))}
            placeholder="בחר שנה התחלתית להצטרפות"
            isClearable
            className="half-width"
          />
          <Select
            value={endYearCreatedAt}
            onChange={handleEndYearCreatedAtChange}
            options={Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => ({
              value: i + 2000,
              label: i + 2000
            }))}
            placeholder="בחר שנה סופית להצטרפות"
            isClearable
            className="half-width"
          />
        </div>
        <div className="filter-pair">
          <Select
            value={startYearBirthDate}
            onChange={handleStartYearBirthDateChange}
            options={Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => ({
              value: i + 1940,
              label: i + 1940
            }))}
            placeholder="בחר שנה התחלתית לידה"
            isClearable
            className="half-width"
          />
          <Select
            value={endYearBirthDate}
            onChange={handleEndYearBirthDateChange}
            options={Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => ({
              value: i + 1940,
              label: i + 1940
            }))}
            placeholder="בחר שנה סופית לידה"
            isClearable
            className="half-width"
          />
        </div>
        
      </div>
      
      <div className="charts-container">
      <div className="chart-wrapper">

        <ResponsiveContainer width="100%" height={400}>
        <PieChart >
              <Pie dataKey="count" data={data} cx="50%" cy="50%" outerRadius={150} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
        </ResponsiveContainer>
        </div>
        <div className="chart-wrapper">

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} onClick={(data) => handleChartClick(data?.activePayload?.[0]?.payload)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {showTable && (
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
            {filteredVolunteer.map((volunteer) => (
              <tr key={volunteer.idDoc}>
                <td>
                  <Link to={`/volunteerdetails/${volunteer.idDoc}`}>
                    {volunteer.firstname + ' ' + volunteer.lastname}
                  </Link>
                </td>
                <td>{volunteer.phoneNumber}</td>
                <td>{volunteer.id}</td>
                <td>{volunteer.birthDate ? new Date(volunteer.birthDate.seconds * 1000).toLocaleDateString('he-IL') : ''}</td>
                <td>{volunteer.able ? volunteer.able.join(', ') : ''}</td>
                <td>{volunteer.city}</td>
                <td>{volunteer.createdAt ? new Date(volunteer.createdAt.seconds * 1000).toLocaleDateString('he-IL') : ''}</td>
                <td>{volunteer.languages ? volunteer.languages.join(', ') : ''}</td>
                <td>{volunteer.profession ? volunteer.profession.join(', ') : ''}</td>
                <td>{volunteer.religious ? 'דתי' : 'לא דתי'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    // </div>
  );
};

export default StatisticsVolunteer;
