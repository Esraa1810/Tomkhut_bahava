import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { Bar, Pie } from 'react-chartjs-2';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Select from 'react-select';
import hospitals from '../hospitals'; // Import hospitals from hospitals.js
import 'chart.js/auto'; // This line ensures all necessary components are registered
import 'react-datepicker/dist/react-datepicker.css';
import './StatisticsSupports.css'; // Import the CSS file
import HomeButton from '../HomeButton'; // Import the HomeButton component

const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#F39C12', '#8E44AD', '#2ECC71',
  '#E74C3C', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6', '#16A085'
];

const categories = [
  { value: 'supportType', label: 'סוג ליווי' },
  { value: 'hospital', label: 'בית חולים' },
  { value: 'frameWork', label: 'מסגרת מלווה' },
  { value: 'age', label: 'גיל' }, // New category
  { value: 'year', label: 'חלוקה לפי שנים' }, // New category for year distribution
  { value: 'pregnancyNum', label: 'מס\' היריון' }, // New category for pregnancy number
  { value: 'birthNum', label: 'מס\' לידה' }, // New category for birth number
  { value: 'branch', label: 'סניפים' } // New category for branches
];

const supportOptions = [
  { value: 'חבילת ליווי מלא - הכנה, לידה והורות ראשונית', label: 'חבילת ליווי מלא - הכנה, לידה והורות ראשונית' },
  { value: 'חבילת ליווי להורות ראשונית', label: 'חבילת ליווי להורות ראשונית' },
  { value: 'ליווי לידה מלא', label: 'ליווי לידה מלא' },
  { value: 'הכנה ללידה', label: 'הכנה ללידה' },
  { value: 'הורות ראשונית', label: 'הורות ראשונית' },
  { value: 'הדרכת הנקה/שאיבה/ייבוש חלב', label: 'הדרכת הנקה/שאיבה/ייבוש חלב' },
  { value: 'ליווי לילה', label: 'ליווי לילה' },
  { value: 'עיבוד חוויה', label: 'עיבוד חוויה' },
  { value: 'ליווי הפסקת היריון', label: 'ליווי הפסקת היריון' },
  { value: 'הגעת תומכת רק לחדר לידה', label: 'הגעת תומכת רק לחדר לידה' },
  { value: 'פגישה נוספת', label: 'פגישה נוספת' },
];

const StatisticsSupports = () => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('supportType');
  const [barData, setBarData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [ageFrom, setAgeFrom] = useState('');
  const [ageTo, setAgeTo] = useState('');
  const [girlSearchOptions, setGirlSearchOptions] = useState([]);
  const [contactSearchOptions, setContactSearchOptions] = useState([]);
  const [volunteerSearchOptions, setVolunteerSearchOptions] = useState([]);
  const [frameworkSearchOptions, setFrameworkSearchOptions] = useState([]);
  const [selectedGirlSearchOptions, setSelectedGirlSearchOptions] = useState([]);
  const [selectedContactSearchOptions, setSelectedContactSearchOptions] = useState([]);
  const [selectedVolunteerSearchOptions, setSelectedVolunteerSearchOptions] = useState([]);
  const [selectedSupportOptions, setSelectedSupportOptions] = useState([]);
  const [selectedHospitalOptions, setSelectedHospitalOptions] = useState([]);
  const [selectedFrameworkOption, setSelectedFrameworkOption] = useState(null);
  const [frameworkHasBranches, setFrameworkHasBranches] = useState(false);
  const [detailedSupports, setDetailedSupports] = useState([]);
  const [dueDateStart, setDueDateStart] = useState(null);
  const [dueDateEnd, setDueDateEnd] = useState(null);

  const fetchGirls = async () => {
    const girlsSnapshot = await getDocs(collection(db, 'girls'));
    const options = girlsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { value: data.phoneNumber, label: `${data.firstName} ${data.lastName ? data.lastName : ''} (${data.phoneNumber})` };
    });
    setGirlSearchOptions(options);
  };

  const fetchContacts = async () => {
    const contactsSnapshot = await getDocs(collection(db, 'workers')); // Replace 'workers' with the actual collection name if different
    const options = contactsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { value: data.phone, label: `${data.name ? data.name : ''} (${data.phone})` };
    });
    setContactSearchOptions(options);
  };

  const fetchVolunteers = async () => {
    const volunteersSnapshot = await getDocs(collection(db, 'volunteer'));
    const options = volunteersSnapshot.docs.map(doc => {
      const data = doc.data();
      return { value: data.phoneNumber, label: `${data.firstname} ${data.lastname ? data.lastname : ''} (${data.phoneNumber})` };
    });
    setVolunteerSearchOptions(options);
  };

  const fetchFrameworks = async () => {
    const frameworksSnapshot = await getDocs(collection(db, 'help_record'));
    const frameworksSet = new Set(frameworksSnapshot.docs.map(doc => doc.data().frameWork));
    const options = Array.from(frameworksSet).map(name => ({ value: name, label: name }));
    setFrameworkSearchOptions(options);
  };

  const checkFrameworkBranches = async (frameworkName) => {
    const q = query(collection(db, 'Framework'), where('name', '==', frameworkName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const frameworkData = querySnapshot.docs[0].data();
      setFrameworkHasBranches(frameworkData.check === "true"); // Ensure it matches "true" as a string
    } else {
      setFrameworkHasBranches(false);
    }
  };

  useEffect(() => {
    fetchGirls();
    fetchContacts();
    fetchVolunteers();
    fetchFrameworks();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'help_record'));
      const today = new Date();

      const categoryCounts = {};
      const girlCategorySet = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const start = data.startDate ? new Date(data.startDate.seconds * 1000) : null;
        const end = data.endDate ? new Date(data.endDate.seconds * 1000) : null;
        const due = data.dueDate ? new Date(data.dueDate.seconds * 1000) : null;
        const age = data.age ? parseInt(data.age) : null;
        const girlPhone = data.girlPhone;
        const workerPhones = data.workers || [];
        const volunteerPhones = data.volunteers || [];
        const supportType = data.supportType;
        const hospital = data.hospital;
        const pregnancyNum = data.pregnancyNum;
        const birthNum = data.birthNum;
        const framework = data.frameWork;
        const branch = data.branch;

        const girlOption = selectedGirlSearchOptions.find(option => option.value === girlPhone);
        const contactOption = selectedContactSearchOptions.find(option => workerPhones.includes(option.value));
        const volunteerOption = selectedVolunteerSearchOptions.find(option => volunteerPhones.includes(option.value));
        const supportOption = selectedSupportOptions.find(option => option.value === supportType);
        const hospitalOption = selectedHospitalOptions.find(option => option.value === hospital);
        const frameworkOption = selectedFrameworkOption && selectedFrameworkOption.value === framework;

        let isActive = false;
        if (start) {
          if (!end && today >= start) {
            isActive = true;
          } else if (today >= start && today <= end) {
            isActive = true;
          }
        }

        const ageValid = (!ageFrom || age >= ageFrom) && (!ageTo || age <= ageTo);
        const searchTermValid = (!selectedGirlSearchOptions.length || girlOption) &&
                               (!selectedContactSearchOptions.length || contactOption) &&
                               (!selectedVolunteerSearchOptions.length || volunteerOption) &&
                               (!selectedSupportOptions.length || supportOption) &&
                               (!selectedHospitalOptions.length || hospitalOption) &&
                               (!selectedFrameworkOption || frameworkOption);

        const startDateValid = (!startDate && !endDate) || 
          (startDate && endDate && start >= startDate && start <= endDate) ||
          (startDate && !endDate && start >= startDate) ||
          (!startDate && endDate && start <= endDate);
        
        const dueDateValid = (!dueDateStart && !dueDateEnd) || 
          (dueDateStart && dueDateEnd && due >= dueDateStart && due <= dueDateEnd) ||
          (dueDateStart && !dueDateEnd && due >= dueDateStart) ||
          (!dueDateStart && dueDateEnd && due <= dueDateEnd);

        if (
          (selectedStatus === '' || 
          (selectedStatus === 'active' && isActive) || 
          (selectedStatus === 'inactive' && !isActive)) &&
          startDateValid &&
          ageValid &&
          searchTermValid &&
          dueDateValid
        ) {
          let categoryValue;
          if (selectedCategory === 'year') {
            categoryValue = start ? start.getFullYear() : 'Unknown';
          } else if (selectedCategory === 'pregnancyNum') {
            categoryValue = pregnancyNum || 'Unknown';
          } else if (selectedCategory === 'birthNum') {
            categoryValue = birthNum || 'Unknown';
          } else if (selectedCategory === 'branch') {
            categoryValue = branch || 'Unknown';
          } else {
            categoryValue = data[selectedCategory];
          }

          const girlCategoryKey = `${girlPhone}_${categoryValue}_${start ? start.getFullYear() : 'Unknown'}`;

          if (selectedCategory === 'age' || selectedCategory === 'hospital' || selectedCategory === 'frameWork' || selectedCategory === 'year' || selectedCategory === 'pregnancyNum' || selectedCategory === 'birthNum' || selectedCategory === 'branch') {
            if (!girlCategorySet.has(girlCategoryKey)) {
              girlCategorySet.add(girlCategoryKey);
              if (categoryCounts[categoryValue]) {
                categoryCounts[categoryValue] += 1;
              } else {
                categoryCounts[categoryValue] = 1;
              }
            }
          } else {
            if (categoryCounts[categoryValue]) {
              categoryCounts[categoryValue] += 1;
            } else {
              categoryCounts[categoryValue] = 1;
            }
          }
        }
      });

      const labels = Object.keys(categoryCounts);
      const data = Object.values(categoryCounts);

      const barChartData = {
        labels,
        datasets: [
          {
            label: selectedCategory,
            backgroundColor: colors,
            data
          }
        ]
      };

      const pieChartData = {
        labels,
        datasets: [
          {
            label: selectedCategory,
            backgroundColor: colors,
            data
          }
        ]
      };

      setBarData(barChartData);
      setPieData(pieChartData);
    };

    fetchData();
  }, [selectedCategory, selectedStatus, startDate, endDate, ageFrom, ageTo, selectedGirlSearchOptions, selectedContactSearchOptions, selectedVolunteerSearchOptions, selectedSupportOptions, selectedHospitalOptions, selectedFrameworkOption, dueDateStart, dueDateEnd]);

  useEffect(() => {
    if (selectedFrameworkOption) {
      checkFrameworkBranches(selectedFrameworkOption.value);
    }
  }, [selectedFrameworkOption]);

  const handleChartClick = async (elements, data) => {
    if (elements.length > 0) {
      const clickedElementIndex = elements[0].index;
      const clickedLabel = data.labels[clickedElementIndex];
      const supportsSnapshot = await getDocs(query(collection(db, 'help_record'), where(selectedCategory, '==', clickedLabel)));
      const detailedSupportsData = await Promise.all(supportsSnapshot.docs.map(async (doc) => {
        const supportData = doc.data();
        const girlSnapshot = await getDocs(query(collection(db, 'girls'), where('phoneNumber', '==', supportData.girlPhone)));
        const girlData = girlSnapshot.docs[0] ? girlSnapshot.docs[0].data() : {};
        const girlName = `${girlData.firstName || ''} ${girlData.lastName || ''}`.trim();

        const isActive = (start, end) => {
          const today = new Date();
          const startDate = start ? new Date(start.seconds * 1000) : null;
          const endDate = end ? new Date(end.seconds * 1000) : null;
          return startDate && (!endDate || today <= endDate) && today >= startDate;
        };

        return {
          ...supportData,
          girlName,
          status: isActive(supportData.startDate, supportData.endDate) ? 'פעיל' : 'לא פעיל',
          startDate: supportData.startDate ? new Date(supportData.startDate.seconds * 1000).toLocaleDateString('he-IL') : '',
          endDate: supportData.endDate ? new Date(supportData.endDate.seconds * 1000).toLocaleDateString('he-IL') : '',
          dueDate: supportData.dueDate ? new Date(supportData.dueDate.seconds * 1000).toLocaleDateString('he-IL') : '',
        };
      }));
      setDetailedSupports(detailedSupportsData);
    }
  };

  const barOptions = {
    onClick: (event, elements) => {
      handleChartClick(elements, barData);
    }
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      handleChartClick(elements, pieData);
    }
  };

  const hospitalOptions = hospitals.map(hospital => ({ value: hospital, label: hospital }));

  return (
    <div className="statistics-supports">
      <HomeButton /> {/* Added HomeButton component */}
      <h1>סטטיסטיקות-ליווים</h1>
      <div><h3>בחר את הנושא העיקרי שברצונך לבחון את התרשים עבורו:</h3></div>
      <div className="category-selector full-width">
        {categories.map(category => (
          (category.value !== 'branch' || frameworkHasBranches) && (
            <label key={category.value} className="checkbox-label">
              <input
                type="radio"
                name="category"
                value={category.value}
                checked={selectedCategory === category.value}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
              {category.label}
            </label>
          )
        ))}
      </div>
      <div className="filters">
        <div><h3>בחר נושא לפרטים נוספים:</h3></div>
        <div className="filter-pair">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: '', label: 'בחר סטטוס' },
              { value: 'active', label: 'פעיל' },
              { value: 'inactive', label: 'לא פעיל' }
            ]}
            placeholder="בחר סטטוס"
            isClearable
            className="half-width"
          />
          <div className="date-range">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="בחר תאריך התחלה"
              isClearable
              className="date-picker"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="בחר תאריך סיום"
              isClearable
              className="date-picker"
            />
          </div>
        </div>
        <div className="filter-pair">
          <Select
            value={selectedSupportOptions}
            onChange={setSelectedSupportOptions}
            options={supportOptions}
            isMulti
            placeholder="בחר סוג ליווי"
            className="half-width"
          />
          <Select
            value={selectedHospitalOptions}
            onChange={setSelectedHospitalOptions}
            options={hospitalOptions}
            isMulti
            placeholder="בחר בית חולים"
            className="half-width"
          />
        </div>
        <div className="filter-pair">
          <Select
            value={selectedFrameworkOption}
            onChange={setSelectedFrameworkOption}
            options={frameworkSearchOptions}
            placeholder="בחר מסגרת מלווה"
            isClearable
            className="half-width"
          />
          <div className="date-range">
            <DatePicker
              selected={dueDateStart}
              onChange={(date) => setDueDateStart(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="תאריך לידה משוער - מ"
              isClearable
              className="date-picker"
            />
            <DatePicker
              selected={dueDateEnd}
              onChange={(date) => setDueDateEnd(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="תאריך לידה משוער - עד"
              isClearable
              className="date-picker"
            />
          </div>
        </div>
        <div className="filter-pair">
          <input 
            type="number" 
            value={ageFrom} 
            onChange={(e) => setAgeFrom(e.target.value)} 
            min="0" 
            placeholder="גיל מינימלי"
            className="half-width"
          />
          <input 
            type="number" 
            value={ageTo} 
            onChange={(e) => setAgeTo(e.target.value)} 
            min="0" 
            placeholder="גיל מקסימלי"
            className="half-width"
          />
        </div>
      </div>
      <div className="charts-container">
        <div className="chart-wrapper">
          {pieData ? <Pie data={pieData} options={pieOptions} /> : <p>Loading...</p>}
        </div>
        <div className="chart-wrapper">
          {barData ? <Bar data={barData} options={barOptions} /> : <p>Loading...</p>}
        </div>
      </div>
      {detailedSupports.length > 0 && (
        <table className="supports-report-table">
          <thead>
            <tr>
              <th>סטטוס</th>
              <th>שם צעירה</th>
              <th>מס' טלפון-צעירה</th>
              <th>גיל</th>
              <th>סוג ליווי</th>
              <th>תאריך לידה משוער</th>
              <th>תאריך התחלה</th>
              <th>תאריך סיום</th>
              <th>בית חולים</th>
              <th>מס' היריון</th>
              <th>מס' לידה</th>
              <th>מסגרת מלווה</th>
            </tr>
          </thead>
          <tbody>
            {detailedSupports.map((support, index) => (
              <tr key={index}>
                <td>{support.status}</td>
                <td>{support.girlName}</td>
                <td>{support.girlPhone}</td>
                <td>{support.age}</td>
                <td>{support.supportType}</td>
                <td>{support.dueDate}</td>
                <td>{support.startDate}</td>
                <td>{support.endDate}</td>
                <td>{support.hospital}</td>
                <td>{support.pregnancyNum}</td>
                <td>{support.birthNum}</td>
                <td>{support.frameWork}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StatisticsSupports;
