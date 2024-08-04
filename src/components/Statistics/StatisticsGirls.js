import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './StatisticsGirls.css';
import { fetchCities } from '../cityService';
import languages from '../languages'; // Import the languages
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import HomeButton from '../HomeButton'; // Import HomeButton component


const StatisticsGirls = () => {
  const [girls, setGirls] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [data, setData] = useState([]);
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [cities, setCities] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]); // Add state for language options
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedFosterFamily, setSelectedFosterFamily] = useState(null);
  const [filteredGirls, setFilteredGirls] = useState([]);
  const [showTable, setShowTable] = useState(false);

  // Define options for radio buttons
  const options = [
    { value: 'city', label: 'עיר' },
    { value: 'fosterFamily', label: 'האם הצעירה אומצה בילדותה?' },
    { value: 'status', label: 'סטָטוּס' },
    { value: 'language', label: 'שפה' },
  ];

  const fosterFamilyOptions = [
    { value: 'כן', label: 'כן' },
    { value: 'לא', label: 'לא' }
  ];

  const statusOptions = [
    { value: true, label: 'פעיל' },
    { value: false, label: 'לא פעיל' }
  ];

  // Define colors for bars
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F39C12', '#8E44AD', '#2ECC71',
    '#E74C3C', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6', '#16A085'
  ];

  const getColor = (index) => colors[index % colors.length];

  const isStatusTrue = (startDate, endDate) => {
    const currentDate = new Date();
    const start = startDate instanceof Date ? startDate : startDate.toDate();
    const end = endDate ? (endDate instanceof Date ? endDate : endDate.toDate()) : null;
  
    return end ? (currentDate >= start && currentDate <= end) : (currentDate >= start);
  };
  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cities and languages
        const citiesList = await fetchCities();
        setCities(citiesList.map(city => ({ value: city, label: city })));

        // Set language options
        setLanguageOptions(languages.map(lang => ({ value: lang, label: lang })));

        const girlsQuerySnapshot = await getDocs(collection(db, 'girls'));
        const helpRecordsQuerySnapshot = await getDocs(collection(db, 'help_record'));
        const currentDate = new Date();

        const helpRecords = helpRecordsQuerySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : null,
            endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : null,
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
            status
          };
        });

        let filtered = girlsList;

        if (selectedCity && selectedCity.length > 0) {
          filtered = filtered.filter(girl => 
            selectedCity.some(city => city.value === girl.city)
          );
        }
        

        if (selectedLanguage && selectedLanguage.length > 0) {
          filtered = filtered.filter(girl => 
            girl.languages && selectedLanguage.some(lang => girl.languages.includes(lang.value))
          );
        }
        

        if (selectedFosterFamily && selectedFosterFamily.length > 0) {
          filtered = filtered.filter(girl => 
            girl.fosterFamily && selectedFosterFamily.some(family => family.value === girl.fosterFamily)
          );
        }
        

        if (selectedStatus.length > 0) {
          const selectedStatusValues = selectedStatus.map(status => status.value.toString());
          filtered = filtered.filter(girl => {
            if (typeof girl.status !== 'boolean') {
              return false; // Exclude entries without a valid status
            }
            return selectedStatusValues.includes(girl.status.toString());
          });
        }

        console.log("Filtered Data:", filtered); // Debugging line to check filtered data

        if (!selectedOption) return;

        switch (selectedOption.value) {
    

          case 'city':
            const cityCounts = {};
            filtered.forEach(girl => {
              if (cityCounts[girl.city]) {
                cityCounts[girl.city]++;
              } else {
                cityCounts[girl.city] = 1;
              }
            });
            setData(Object.keys(cityCounts).map((key, index) => ({
              name: key,
              count: cityCounts[key],
              color: getColor(index),
            })));
            break;

          case 'fosterFamily':
            const fosterFamilyCounts = { "כן": 0, "לא": 0 };
            filtered.forEach(girl => {
              if (girl.fosterFamily === "כן") {
                fosterFamilyCounts["כן"]++;
              } else if (girl.fosterFamily === "לא") {
                fosterFamilyCounts["לא"]++;
              }
            });
            console.log("Foster Family Counts:", fosterFamilyCounts); // Debugging line to check foster family counts
            setData(Object.keys(fosterFamilyCounts).map((key, index) => ({
              name: key,
              count: fosterFamilyCounts[key],
              color: getColor(index),
            })));
            break;

        
            case 'status':
              const statusCounts = { true: 0, false: 0 };

              filtered.forEach(girl => {
                const girlHelpRecords = helpRecords.filter(record => record.girlPhone === girl.phoneNumber);
                const hasActiveStatus = girlHelpRecords.some(record => isStatusTrue(record.startDate, record.endDate));
              
                if (hasActiveStatus) {
                  statusCounts.true++;
                } else {
                  statusCounts.false++;
                }
              });
              
            
              console.log("Status Counts:", statusCounts); // Debugging line to check status counts
            
              setData(Object.keys(statusCounts).map((key, index) => ({
                name: key === 'true' ? 'פעיל' : 'לא פעיל',
                count: statusCounts[key],
                color: getColor(index),
              })));
              break;
            

          case 'language':
            const languageCounts = {};
            filtered.forEach(girl => {
              if (girl.languages && Array.isArray(girl.languages)) {
                girl.languages.forEach(language => {
                  languageCounts[language] = (languageCounts[language] || 0) + 1;
                });
              }
            });
            setData(Object.keys(languageCounts).map((key, index) => ({
              name: key,
              count: languageCounts[key],
              color: getColor(index),
            })));
            break;

          default:
            setData([]);
        }

        setGirls(filtered); // Update girls state with filtered data

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [selectedOption, startYear, endYear, selectedCity, selectedLanguage, selectedStatus, selectedFosterFamily]);

  const handleCityChange = (selectedOptions) => {
    setSelectedCity(selectedOptions); // selectedOptions will be an array now
  };
  

  const handleLanguageChange = (selectedOptions) => {
    setSelectedLanguage(selectedOptions); // selectedOptions will be an array now
  };
  

  

  const handleStatusChange = (selectedOption) => {
    setSelectedStatus(selectedOption);
  };

  const handleFosterFamilyChange = (selectedOptions) => {
    setSelectedFosterFamily(selectedOptions); // selectedOptions will be an array now
  };
  

  const handleChartClick = (data) => {
    const selectedData = data?.activePayload[0]?.payload;

    if (selectedData) {
      let filtered = girls;

      switch (selectedOption.value) {
        
        case 'city':
          filtered = girls.filter(girl => girl.city === selectedData.name);
          break;
        case 'fosterFamily':
          filtered = girls.filter(girl => girl.fosterFamily === selectedData.name);
          break;
        
        case 'status':
          filtered = girls.filter(girl => (girl.status ? 'פעיל' : 'לא פעיל') === selectedData.name);
          break;
        case 'language':
          filtered = girls.filter(girl => girl.languages && girl.languages.includes(selectedData.name));
          break;
        default:
          break;
      }

      setFilteredGirls(filtered);
      setShowTable(true);
    }
  };

  return (
    <div className="statistics-girls-container">
      <HomeButton />
      
      <div className="Addess">
      <h1>סטטיסטיקות-צעירות</h1>
      </div>

      <div><h3>בחר את הנושא העיקרי שברצונך לבחון את התרשים עבורו:</h3></div>

      <div className="options-container  full-width">
        {options.map((option, index) => (
          <label key={index} className="option-label">
            <input
              type="radio"
              name="statisticsOption"
              value={option.value}
              checked={selectedOption && selectedOption.value === option.value}
              onChange={() => setSelectedOption(option)}
            />
            {option.label}
          </label>
        ))}
      </div>

    

      <div className="filters">
      <div><h3>בחר נושא לפרטים נוספים:</h3></div>

      <div className="filter-pair">

        <div className="filter-item">
          <h3>בחר עיר:</h3>
          <Select
  isMulti
  // for cities
  value={selectedCity || []} 
  onChange={handleCityChange}
  options={cities}
  placeholder="בחר עיר"
/>


        </div>

        <div className="filter-item">
          <h3>בחר שפה:</h3>
          <Select
          isMulti
            value={selectedLanguage || []}
            onChange={handleLanguageChange}
            options={languages}
            placeholder="בחר שפה"
          />
        </div>
        </div>
        <div className="filter-pair">

        <div className="filter-item">
          <h3>בחר משפחת אומנה:</h3>
          <Select
          isMulti
            value={selectedFosterFamily || []}
            onChange={handleFosterFamilyChange}
            options={fosterFamilyOptions}
            placeholder="בחר משפחת אומנה"
          />
        </div>

        <div className="filter-item">
          <h3>בחר סטָטוּס:</h3>
          <Select
            isMulti
            options={statusOptions}
            value={selectedStatus}
            onChange={handleStatusChange}
            placeholder="בחר סטָטוּס"
          />
        </div>
        </div>
      </div>

      {/* {selectedOption?.value === 'fosterFamily' && (
        <div className="select-container">
          <Select
            isMulti
            options={statusOptions}
            value={selectedFosterFamily}
            onChange={handleFosterFamilyChange}
            placeholder="האם הצעירה אומצה בילדותה?"
            // isClearable
          />
        </div>
      )} */}

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
            <BarChart data={data} onClick={handleChartClick}>
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
  <div className="table-container">
    <table className="girls-table">
      <thead>
        <tr>
          <th>שם</th>
          <th>מספר טלפון</th>
          <th>עיר</th>
          <th>שפות</th>
          <th>משפחת אומנה</th>
          <th>סטטוס</th>
        </tr>
      </thead>
      <tbody>
        {filteredGirls.map((girl, index) => (
          <tr key={girl.idDoc}>
            <td>
              <Link to={`/girldetails/${girl.idDoc}`}>
                {girl.firstName + ' ' + girl.lastName}
              </Link>
            </td>
            <td>{girl.phoneNumber || ''}</td>
            <td>{girl.city || ''}</td>
            <td>{girl.languages ? girl.languages.join(', ') : ''}</td>
            <td>{girl.fosterFamily || ''}</td>
            <td>{girl.status ? 'פעיל' : 'לא פעיל'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

    </div>
  );
};

export default StatisticsGirls;
