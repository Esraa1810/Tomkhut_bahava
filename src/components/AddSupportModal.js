import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './AddSupportModal.css'; // Ensure you create a CSS file for this modal's styles
import hospitals from './hospitals'; // Import the hospitals options from the hospitals.js file
import { db } from '../firebaseConfig'; // Import the Firestore database from firebaseConfig
import { collection, getDocs, query, where } from 'firebase/firestore'; // Import Firestore functions

Modal.setAppElement('#root'); // This is important for accessibility

const AddSupportModal = ({ isOpen, onRequestClose, onSave, volunteers, workers }) => {
  const [supportData, setSupportData] = useState({
    supportType: '',
    frameWork: '',
    branch: '',
    volunteers: [],
    workers: [],
    startDate: null,
    endDate: null,
    age: '',
    dueDate: null,
    pregnancyNum: '',
    birthNum: '',
    hospital: '',
  });
  const [frameworks, setFrameworks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showBranch, setShowBranch] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFrameworks = async () => {
      const frameworksRef = collection(db, 'Framework');
      const snapshot = await getDocs(frameworksRef);
      const fetchedFrameworks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setFrameworks(fetchedFrameworks);
    };

    fetchFrameworks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['age', 'pregnancyNum', 'birthNum'].includes(name) && value < 0) {
      setError('הערך חייב להיות חיובי');
    } else {
      setSupportData({ ...supportData, [name]: value });
    }
  };

  const handleFrameworkChange = async (selectedOption) => {
    const selectedFramework = frameworks.find(fw => fw.name === selectedOption.value);
    setSupportData({
      ...supportData,
      frameWork: selectedOption ? selectedOption.value : '',
      branch: selectedFramework && selectedFramework.check === "false" ? selectedOption.value : ''
    });

    if (selectedFramework && selectedFramework.check === "true") {
      setShowBranch(true);
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, where('frameWorkName', '==', selectedOption.value));
      const snapshot = await getDocs(q);
      const fetchedBranches = snapshot.docs.map(doc => doc.data());
      setBranches(fetchedBranches);
    } else {
      setShowBranch(false);
      setBranches([]);
    }
  };

  const handleVolunteersChange = (selectedOptions) => {
    const validOptions = selectedOptions ? selectedOptions.filter(option => option.value) : [];
    setSupportData({ ...supportData, volunteers: validOptions.map(option => option.value) });
  };

  const handleWorkerChange = (selectedOption) => {
    setSupportData({ ...supportData, workers: selectedOption ? [selectedOption.value] : [] });
  };

  const handleStartDateChange = (date) => {
    setSupportData({ ...supportData, startDate: date });
  };

  const handleEndDateChange = (date) => {
    setSupportData({ ...supportData, endDate: date });
  };

  const handleDueDateChange = (date) => {
    setSupportData({ ...supportData, dueDate: date });
  };

  const validateForm = () => {
    if (!supportData.supportType || !supportData.frameWork || !supportData.volunteers.length || !supportData.workers.length || !supportData.startDate || !supportData.endDate || !supportData.age || !supportData.dueDate || !supportData.pregnancyNum || !supportData.birthNum || !supportData.hospital) {
      setError('חובה למלא את שדות החובה');
      return false;
    }

    if (supportData.startDate > supportData.endDate) {
      setError('תאריך התחלת ליווי לא יכול להיות אחרי תאריך סיום ליווי');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    const cleanedSupportData = {
      ...supportData,
      startDate: supportData.startDate || '',
      endDate: supportData.endDate || '',
      branch: showBranch ? supportData.branch : supportData.frameWork,
    };

    console.log('Cleaned Support Data:', cleanedSupportData);

    onSave(cleanedSupportData);
  };

  const frameworkOptions = frameworks.map(framework => ({
    value: framework.name,
    label: framework.name,
    check: framework.check
  }));

  const branchOptions = branches.map(branch => ({
    value: branch.branchName,
    label: branch.branchName
  }));

  const volunteerOptions = volunteers.map(volunteer => ({
    value: volunteer.phoneNumber,
    label: `${volunteer.firstname} (${volunteer.phoneNumber})`
  }));

  const workerOptions = workers.map(worker => ({
    value: worker.phone,
    label: `${worker.name} (${worker.phone})`
  }));

  const hospitalOptions = hospitals.map(hospital => ({
    value: hospital,
    label: hospital
  }));

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Add Support Modal"
      className="add-support-modal"
      overlayClassName="add-support-modal-overlay"
    >
      <h2>הוסף ליווי</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="form-row">
        <div className="form-group">
          <label>סוג הליווי:<span className="required">*</span></label>
          <select name="supportType" value={supportData.supportType} onChange={handleChange} required>
            <option value="">בחר סוג ליווי</option>
            <option value="חבילת ליווי מלא - הכנה, לידה והורות ראשונית">חבילת ליווי מלא - הכנה, לידה והורות ראשונית</option>
            <option value="חבילת ליווי להורות ראשונית">חבילת ליווי להורות ראשונית</option>
            <option value="ליווי לידה מלא">ליווי לידה מלא</option>
            <option value="הכנה ללידה">הכנה ללידה</option>
            <option value="הורות ראשונית">הורות ראשונית</option>
            <option value="הדרכת הנקה/שאיבה/ייבוש חלב">הדרכת הנקה/שאיבה/ייבוש חלב</option>
            <option value="ליווי לילה">ליווי לילה</option>
            <option value="עיבוד חוויה">עיבוד חוויה</option>
            <option value="ליווי הפסקת היריון">ליווי הפסקת היריון</option>
            <option value="הגעת תומכת רק לחדר לידה">הגעת תומכת רק לחדר לידה</option>
            <option value="פגישה נוספת">פגישה נוספת</option>
          </select>
        </div>
        <div className="form-group">
          <label>מסגרת מלווה:<span className="required">*</span></label>
          <Select
            options={frameworkOptions}
            name="frameWork"
            value={frameworkOptions.find(option => option.value === supportData.frameWork)}
            onChange={handleFrameworkChange}
            required
          />
        </div>
      </div>
      {showBranch && (
        <div className="form-row">
          <div className="form-group">
            <label>סניף:<span className="required">*</span></label>
            <Select
              options={branchOptions}
              name="branch"
              value={branchOptions.find(option => option.value === supportData.branch)}
              onChange={(selectedOption) => setSupportData({ ...supportData, branch: selectedOption ? selectedOption.value : '' })}
              required
            />
          </div>
        </div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label>מתנדבים:<span className="required">*</span></label>
          <Select
            isMulti
            options={volunteerOptions}
            name="volunteers"
            value={volunteerOptions.filter(option => supportData.volunteers.includes(option.value))}
            onChange={handleVolunteersChange}
            required
          />
        </div>
        <div className="form-group">
          <label>אשת מקצוע מלווה :<span className="required">*</span></label>
          <Select
            options={workerOptions}
            name="workers"
            value={workerOptions.find(option => option.value === supportData.workers[0])}
            onChange={handleWorkerChange}
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>תאריך התחלת ליווי:<span className="required">*</span></label>
          <DatePicker
            selected={supportData.startDate}
            onChange={handleStartDateChange}
            dateFormat="dd/MM/yyyy"
            showYearDropdown
            showMonthDropdown
            locale="he"
            placeholderText="dd/MM/yyyy"
            required
          />
        </div>
        <div className="form-group">
          <label>תאריך סיום ליווי:<span className="required">*</span></label>
          <DatePicker
            selected={supportData.endDate}
            onChange={handleEndDateChange}
            dateFormat="dd/MM/yyyy"
            showYearDropdown
            showMonthDropdown
            locale="he"
            placeholderText="dd/MM/yyyy"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>גיל:<span className="required">*</span></label>
          <input
            type="number"
            name="age"
            value={supportData.age}
            onChange={handleChange}
            min="0"
            placeholder="גיל חיובי בלבד"
            required
          />
        </div>
        <div className="form-group">
          <label>תאריך לידה משוער:<span className="required">*</span></label>
          <DatePicker
            selected={supportData.dueDate}
            onChange={handleDueDateChange}
            dateFormat="dd/MM/yyyy"
            showYearDropdown
            showMonthDropdown
            locale="he"
            placeholderText="dd/MM/yyyy"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>מספר היריון:<span className="required">*</span></label>
          <input
            type="number"
            name="pregnancyNum"
            value={supportData.pregnancyNum}
            onChange={handleChange}
            min="0"
            placeholder="מספר חיובי בלבד"
            required
          />
        </div>
        <div className="form-group">
          <label>מספר לידה:<span className="required">*</span></label>
          <input
            type="number"
            name="birthNum"
            value={supportData.birthNum}
            onChange={handleChange}
            min="0"
            placeholder="מספר חיובי בלבד"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>בית יולדות שבו היא תרצה ללדת:<span className="required">*</span></label>
          <Select
            options={hospitalOptions}
            name="hospital"
            value={hospitalOptions.find(option => option.value === supportData.hospital)}
            onChange={(selectedOption) => setSupportData({ ...supportData, hospital: selectedOption ? selectedOption.value : '' })}
            required
          />
        </div>
      </div>
      <button className="save-btn" onClick={handleSave}>שמור</button>
    </Modal>
  );
};

export default AddSupportModal;
