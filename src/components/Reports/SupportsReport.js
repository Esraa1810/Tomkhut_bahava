import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import * as XLSX from 'xlsx';
import "react-datepicker/dist/react-datepicker.css";
import './SupportsReport.css';
import HomeButton from '../HomeButton';
import hospitals from '../hospitals';

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

const statusOptions = [
  { value: 'פעיל', label: 'פעיל' },
  { value: 'לא פעיל', label: 'לא פעיל' }
];

const hospitalOptions = hospitals.map(hospital => ({ value: hospital, label: hospital }));

const SupportsReport = () => {
  const [supports, setSupports] = useState([]);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [selectedGirlSearchOptions, setSelectedGirlSearchOptions] = useState([]);
  const [selectedWorkerSearchOptions, setSelectedWorkerSearchOptions] = useState([]);
  const [selectedVolunteerSearchOptions, setSelectedVolunteerSearchOptions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedSupportType, setSelectedSupportType] = useState(null);
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedFramework, setSelectedFramework] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dueDateStart, setDueDateStart] = useState(null);
  const [dueDateEnd, setDueDateEnd] = useState(null);
  const [girlSearchOptions, setGirlSearchOptions] = useState([]);
  const [workerSearchOptions, setWorkerSearchOptions] = useState([]);
  const [volunteerSearchOptions, setVolunteerSearchOptions] = useState([]);
  const [pregnancyNum, setPregnancyNum] = useState('');
  const [birthNum, setBirthNum] = useState('');

  useEffect(() => {
    // Fetching girl, worker, and volunteer options for Select fields
    async function fetchOptions() {
      const girlsCollection = collection(db, 'girls');
      const girlsSnapshot = await getDocs(girlsCollection);
      const girlOptions = girlsSnapshot.docs.map(doc => {
        const data = doc.data();
        return { value: data.phoneNumber, label: `${data.firstName} ${data.lastName ? data.lastName : ''} (${data.phoneNumber})` };
      });
      setGirlSearchOptions(girlOptions);

      const workersCollection = collection(db, 'workers');
      const workersSnapshot = await getDocs(workersCollection);
      const workerOptions = workersSnapshot.docs.map(doc => {
        const data = doc.data();
        return { value: data.phone, label: `${data.name} (${data.phone})` };
      });
      setWorkerSearchOptions(workerOptions);

      const volunteersCollection = collection(db, 'volunteer');
      const volunteersSnapshot = await getDocs(volunteersCollection);
      const volunteerOptions = volunteersSnapshot.docs.map(doc => {
        const data = doc.data();
        return { value: data.phoneNumber, label: `${data.firstname} ${data.lastname ? data.lastname : ''} (${data.phoneNumber})` };
      });
      setVolunteerSearchOptions(volunteerOptions);
    }
    fetchOptions();
  }, []);

  useEffect(() => {
    async function fetchSupports() {
      const supportsCollection = collection(db, 'help_record');
      const supportsSnapshot = await getDocs(supportsCollection);
      const supportsList = await Promise.all(supportsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let girlName = '';
        let girlId = '';
        if (data.girlPhone) {
          const girlsCollection = collection(db, 'girls');
          const q = query(girlsCollection, where('phoneNumber', '==', data.girlPhone));
          const girlsSnapshot = await getDocs(q);
          girlsSnapshot.forEach(girlDoc => {
            const girlData = girlDoc.data();
            const firstName = girlData.firstName || '';
            const lastName = girlData.lastName || '';
            girlName = `${firstName} ${lastName}`.trim();
            girlId = girlDoc.id;
          });
        }

        const volunteerPhones = data.volunteers || [];
        const volunteerData = await Promise.all(volunteerPhones.map(async (phone) => {
          const volunteersCollection = collection(db, 'volunteer');
          const q = query(volunteersCollection, where('phoneNumber', '==', phone));
          const volunteerSnapshot = await getDocs(q);
          let volunteerName = '';
          let volunteerId = '';
          volunteerSnapshot.forEach(volunteerDoc => {
            const volunteerInfo = volunteerDoc.data();
            const firstName = volunteerInfo.firstname || '';
            const lastName = volunteerInfo.lastname || '';
            volunteerName = `${firstName} ${lastName}`.trim();
            volunteerId = volunteerDoc.id;
          });
          return { name: volunteerName, phone, id: volunteerId };
        }));

        const workerPhones = data.workers || [];
        const workerData = await Promise.all(workerPhones.map(async (phone) => {
          const workersCollection = collection(db, 'workers');
          const q = query(workersCollection, where('phone', '==', phone));
          const workerSnapshot = await getDocs(q);
          let workerName = '';
          workerSnapshot.forEach(workerDoc => {
            const workerInfo = workerDoc.data();
            workerName = workerInfo.name || '';
          });
          return { name: workerName, phone };
        }));

        const formatDate = (date) => {
          return date ? new Date(date.seconds * 1000).toLocaleDateString('en-GB') : '';
        };

        const isActive = (startDate, endDate) => {
          const today = new Date();
          const start = startDate ? new Date(startDate.seconds * 1000) : null;
          const end = endDate ? new Date(endDate.seconds * 1000) : null;
          return start && (end ? today >= start && today <= end : today >= start);
        };

        return {
          id: doc.id,
          supportType: data.supportType || '',
          startDate: formatDate(data.startDate),
          endDate: formatDate(data.endDate),
          dueDate: formatDate(data.dueDate),
          girlPhone: data.girlPhone || '',
          girlName,
          girlId,
          age: data.age || 'N/A',
          hospital: data.hospital || '',
          pregnancyNum: data.pregnancyNum || '',
          birthNum: data.birthNum || '',
          volunteerData: volunteerData || [],
          workerData: workerData || [],
          frameWork: data.frameWork || '',
          status: isActive(data.startDate, data.endDate) ? 'פעיל' : 'לא פעיל',
          startDateRaw: data.startDate,
          endDateRaw: data.endDate,
          dueDateRaw: data.dueDate
        };
      }));
      setSupports(supportsList);
    }
    fetchSupports();
  }, [minAge, maxAge, selectedGirlSearchOptions, selectedWorkerSearchOptions, selectedVolunteerSearchOptions, selectedStatus, selectedSupportType, selectedHospitals, startDate, endDate, dueDateStart, dueDateEnd, selectedFramework, pregnancyNum, birthNum]);

  const handleAgeChange = (event) => {
    const { name, value } = event.target;
    if (name === 'minAge') {
      setMinAge(value);
    } else if (name === 'maxAge') {
      setMaxAge(value);
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleDueDateStartChange = (date) => {
    setDueDateStart(date);
  };

  const handleDueDateEndChange = (date) => {
    setDueDateEnd(date);
  };

  const handlePregnancyNumChange = (event) => {
    setPregnancyNum(event.target.value);
  };

  const handleBirthNumChange = (event) => {
    setBirthNum(event.target.value);
  };

  const filteredSupports = supports.filter((support) => {
    const age = support.age === 'N/A' ? null : parseInt(support.age);
    const minAgeVal = minAge === '' ? null : parseInt(minAge);
    const maxAgeVal = maxAge === '' ? null : parseInt(maxAge);

    if (minAgeVal !== null && (age === null || age < minAgeVal)) {
      return false;
    }
    if (maxAgeVal !== null && (age === null || age > maxAgeVal)) {
      return false;
    }

    if (selectedGirlSearchOptions.length > 0) {
      const selectedGirlPhones = selectedGirlSearchOptions.map(option => option.value);
      if (!selectedGirlPhones.includes(support.girlPhone)) {
        return false;
      }
    }

    if (selectedWorkerSearchOptions.length > 0) {
      const selectedWorkerPhones = selectedWorkerSearchOptions.map(option => option.value);
      const workerPhoneMatch = support.workerData.some(worker => selectedWorkerPhones.includes(worker.phone));
      if (!workerPhoneMatch) {
        return false;
      }
    }

    if (selectedVolunteerSearchOptions.length > 0) {
      const selectedVolunteerPhones = selectedVolunteerSearchOptions.map(option => option.value);
      const volunteerPhoneMatch = support.volunteerData.some(volunteer => selectedVolunteerPhones.includes(volunteer.phone));
      if (!volunteerPhoneMatch) {
        return false;
      }
    }

    if (selectedStatus && support.status !== selectedStatus.value) {
      return false;
    }

    if (selectedSupportType && support.supportType !== selectedSupportType.value) {
      return false;
    }

    if (selectedHospitals.length > 0) {
      const selectedHospitalNames = selectedHospitals.map(option => option.value);
      if (!selectedHospitalNames.includes(support.hospital)) {
        return false;
      }
    }

    if (startDate && endDate) {
      const supportStartDate = support.startDateRaw ? new Date(support.startDateRaw.seconds * 1000) : null;
      const supportEndDate = support.endDateRaw ? new Date(support.endDateRaw.seconds * 1000) : new Date();
      if (!(supportStartDate && supportStartDate <= endDate && supportEndDate && supportEndDate >= startDate)) {
        return false;
      }
    }

    if (dueDateStart && dueDateEnd) {
      const supportDueDate = support.dueDateRaw ? new Date(support.dueDateRaw.seconds * 1000) : null;
      if (!(supportDueDate && supportDueDate >= dueDateStart && supportDueDate <= dueDateEnd)) {
        return false;
      }
    }

    if (selectedFramework.length > 0) {
      const selectedFrameworkNames = selectedFramework.map(option => option.value);
      if (!selectedFrameworkNames.includes(support.frameWork)) {
        return false;
      }
    }

    if (pregnancyNum !== '' && support.pregnancyNum !== pregnancyNum) {
      return false;
    }

    if (birthNum !== '' && support.birthNum !== birthNum) {
      return false;
    }

    return true;
  });

  const exportToExcel = () => {
    const data = filteredSupports.map((support) => ({
      'סטטוס': support.status,
      'שם צעירה': support.girlName,
      'מס\' טלפון-צעירה': support.girlPhone,
      'גיל': support.age,
      'סוג ליווי': support.supportType,
      'תאריך לידה משוער': support.dueDate,
      'תאריך התחלה': support.startDate,
      'תאריך סיום': support.endDate,
      'בית חולים': support.hospital,
      'מס\' היריון': support.pregnancyNum,
      'מס\' לידה': support.birthNum,
      'מס\' טלפון-מתנדבות': support.volunteerData.map(v => v.phone).join(', '),
      'שם-מתנדבת': support.volunteerData.map(v => v.name).join(', '),
      'מסגרת מלווה': support.frameWork,
      'מס\' טלפון-נשות קשר': support.workerData.map(w => w.phone).join(', '),
      'שם-נשות קשר': support.workerData.map(w => w.name).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Supports Report');
    XLSX.writeFile(workbook, 'supports_report.xlsx');
  };

  return (
    <div>
      <HomeButton />
      <div className="supports-report-container">
        <h1>דוח ליווים</h1>
        <div className="first-filter-container">
          <div className="filter-section">
            <label>גיל מ:</label>
            <input type="number" name="minAge" value={minAge} onChange={handleAgeChange} />
          </div>
          <div className="filter-section">
            <label>גיל עד:</label>
            <input type="number" name="maxAge" value={maxAge} onChange={handleAgeChange} />
          </div>
        </div>
        <div className="first-filter-container">
          <div className="filter-section">
            <label>חיפוש לפי שם או מספר טלפון-צעירה:</label>
            <Select
              options={girlSearchOptions}
              isMulti
              onChange={setSelectedGirlSearchOptions}
              value={selectedGirlSearchOptions}
            />
          </div>
          <div className="filter-section">
            <label>חיפוש לפי שם או מספר טלפון-נשות קשר:</label>
            <Select
              options={workerSearchOptions}
              isMulti
              onChange={setSelectedWorkerSearchOptions}
              value={selectedWorkerSearchOptions}
            />
          </div>
        </div>
        <div className="first-filter-container">
          <div className="filter-section">
            <label>חיפוש לפי שם או מספר טלפון-מתנדבות:</label>
            <Select
              options={volunteerSearchOptions}
              isMulti
              onChange={setSelectedVolunteerSearchOptions}
              value={selectedVolunteerSearchOptions}
            />
          </div>
          <div className="filter-section">
            <label>סטטוס:</label>
            <Select
              options={statusOptions}
              onChange={setSelectedStatus}
              value={selectedStatus}
              className="select-container"
            />
          </div>
        </div>
        <div className="first-filter-container">
          <div className="filter-section">
            <label>סוג ליווי:</label>
            <Select
              options={supportOptions}
              onChange={setSelectedSupportType}
              value={selectedSupportType}
              className="select-container"
            />
          </div>
          <div className="filter-section">
            <label>בית חולים:</label>
            <Select
              options={hospitalOptions}
              isMulti
              onChange={setSelectedHospitals}
              value={selectedHospitals}
              className="select-container"
            />
          </div>
        </div>
        <div className="second-filter-sectionBirth">
          <div className="filter-section">
            <label>תאריך ליווי מ-:</label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              dateFormat="dd/MM/yyyy"
              className="select-container"
            />
          </div>
          <div className="filter-section">
            <label>תאריך ליווי עד:</label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              dateFormat="dd/MM/yyyy"
              className="select-container"
            />
          </div>
        </div>
        <div className="third-filter-sectionBirth">
          <div className="filter-section">
            <label>תאריך לידה משוער מ-:</label>
            <DatePicker
              selected={dueDateStart}
              onChange={handleDueDateStartChange}
              dateFormat="dd/MM/yyyy"
              className="select-container"
            />
          </div>
          <div className="filter-section">
            <label>תאריך לידה משוער עד:</label>
            <DatePicker
              selected={dueDateEnd}
              onChange={handleDueDateEndChange}
              dateFormat="dd/MM/yyyy"
              className="select-container"
            />
          </div>
        </div>
        <div className="forth-filter-sectionBirth">
          <div className="filter-section">
            <label>מסגרת מלווה:</label>
            <Select
              options={supports.map((support) => ({ value: support.frameWork, label: support.frameWork }))}
              isMulti
              onChange={setSelectedFramework}
              value={selectedFramework}
              className="select-container"
            />
          </div>
          <div className="filter-section">
            <label>מס' היריון:</label>
            <input
              type="number"
              name="pregnancyNum"
              min="0"
              value={pregnancyNum}
              onChange={handlePregnancyNumChange}
            />
          </div>
        </div>
        <div className="fifth-filter-sectionCreatedAt">
          <div className="filter-section">
            <label>מס' לידה:</label>
            <input
              type="number"
              name="birthNum"
              min="0"
              value={birthNum}
              onChange={handleBirthNumChange}
            />
          </div>
        </div>
        <button onClick={exportToExcel}>יצוא לאקסל</button>
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
              <th>מס' טלפון-מתנדבות</th>
              <th>שם-מתנדבת</th>
              <th>מסגרת מלווה</th>
              <th>מס' טלפון-נשות קשר</th>
              <th>שם-נשות קשר</th>
            </tr>
          </thead>
          <tbody>
            {filteredSupports.map((support) => (
              <tr key={support.id}>
                <td>{support.status}</td>
                <td>
                  <Link to={`/girlDetails/${support.girlId}`}>
                    {support.girlName}
                  </Link>
                </td>
                <td>{support.girlPhone}</td>
                <td>{support.age}</td>
                <td>{support.supportType}</td>
                <td>{support.dueDate}</td>
                <td>{support.startDate}</td>
                <td>{support.endDate}</td>
                <td>{support.hospital}</td>
                <td>{support.pregnancyNum}</td>
                <td>{support.birthNum}</td>
                <td>
                  {support.volunteerData.map((volunteer, index) => (
                    <span key={volunteer.id}>
                      {volunteer.phone}
                      {index < support.volunteerData.length - 1 && ', '}
                    </span>
                  ))}
                </td>
                <td>
                  {support.volunteerData.map((volunteer, index) => (
                    <span key={volunteer.id}>
                      <Link to={`/volunteerDetails/${volunteer.id}`}>
                        {volunteer.name}
                      </Link>
                      {index < support.volunteerData.length - 1 && ', '}
                    </span>
                  ))}
                </td>
                <td>{support.frameWork}</td>
                <td>
                  {support.workerData.map((worker, index) => (
                    <span key={index}>
                      {worker.phone}
                      {index < support.workerData.length - 1 && ', '}
                    </span>
                  ))}
                </td>
                <td>
                  {support.workerData.map((worker, index) => (
                    <span key={index}>
                      {worker.name}
                      {index < support.workerData.length - 1 && ', '}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportsReport;
