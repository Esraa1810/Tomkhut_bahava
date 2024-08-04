import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { fetchCities } from './cityService';
import hospitals from './hospitals';
import languageOptions from './languages';
import styles from './JoinForm.module.css';

const JoinForm = () => {
  const [frameWorks, setFrameWorks] = useState([]);
  const [frameWork, setFrameWork] = useState('');
  const [customFrameWork, setCustomFrameWork] = useState('');
  const [check, setCheck] = useState(false);
  const [branch, setBranch] = useState('');
  const [customBranch, setCustomBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [girlName, setGirlName] = useState('');
  const [girlPhone, setGirlPhone] = useState('');
  const [girlRole, setGirlRole] = useState('');
  const [fosterFamily, setFosterFamily] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [pregnancyNum, setPregnancyNum] = useState('');
  const [birthNum, setBirthNum] = useState('');
  const [city, setCity] = useState('');
  const [supportsType, setSupportsType] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [contactWithWorker, setContactWithWorker] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [age, setAge] = useState('');
  const [hospital, setHospital] = useState('');
  const [languages, setLanguages] = useState([]);
  const [isOtherRole, setIsOtherRole] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isCheckedAccept, setIsCheckedAccept] = useState(false);
  const [cities, setCities] = useState([]);
  const [formType, setFormType] = useState('צעירה');

  useEffect(() => {
    const fetchCitiesData = async () => {
      const citiesData = await fetchCities();
      setCities(citiesData);
    };

    const fetchFrameWorks = async () => {
      const frameworksCollection = collection(db, 'Framework');
      const frameworksSnapshot = await getDocs(frameworksCollection);
      const frameworksData = frameworksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Add "אחר" option to frameworks
      frameworksData.push({ name: 'אחר', check: false });

      setFrameWorks(frameworksData);
    };

    fetchCitiesData();
    fetchFrameWorks();
  }, []);

  const handleFrameWorkChange = async (selectedOption) => {
    setFrameWork(selectedOption.value);
    setCustomFrameWork('');

    if (selectedOption.value === 'אחר') {
      setCheck(false);
      setBranches([]);
      setBranch('');
    } else if (selectedOption.value === 'לשכת רווחה') {
      setCheck(true);
      const citiesData = await fetchCities();
      setBranches(citiesData);
      setBranch(''); // Clear branch selection if re-selecting framework
    } else {
      const selectedFrameWork = frameWorks.find(fw => fw.name === selectedOption.value);
      if (selectedFrameWork) {
        const isCheck = selectedFrameWork.check === true; // Adjust if check is a boolean
        setCheck(isCheck);

        if (isCheck) {
          const branchesCollection = collection(db, 'branches');
          const branchesQuery = query(branchesCollection, where('frameWorkName', '==', selectedOption.value));
          const branchesSnapshot = await getDocs(branchesQuery);
          const branchesData = branchesSnapshot.docs.map(doc => doc.data().branchName);

          // Add "אחר" option to branches
          branchesData.push('אחר');

          setBranches(branchesData);
          setBranch(''); // Clear branch selection if re-selecting framework
        } else {
          setBranch(selectedOption.value);
        }
      }
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = [];
    if (!frameWork) validationErrors.push('חובה לבחור מסגרת');
    if (frameWork === 'אחר' && !customFrameWork) validationErrors.push('חובה להזין שם מסגרת אחר');
    if (check && !branch) validationErrors.push('חובה לבחור סניף');
    if (check && branch === 'אחר' && !customBranch) validationErrors.push('חובה להזין שם סניף אחר');
    if (!workerName) validationErrors.push('חובה להזין שם אשת הקשר מהמסגרת המלווה');
    if (!workerRole) validationErrors.push('חובה להזין תפקיד');
    if (workerRole === 'אחר' && !otherRole) validationErrors.push('חובה להזין תפקיד אחר');
    if (!workerPhone.match(/^05\d{8}$/)) validationErrors.push('מספר הטלפון של אשת הקשר חייב להיות 10 ספרות ולהתחיל ב-05');
    if (!workerEmail) validationErrors.push('חובה להזין מייל');
    if (!girlName) validationErrors.push('חובה להזין שם האישה הפונה');
    if (!girlPhone.match(/^05\d{8}$/)) validationErrors.push('מספר הטלפון של האישה הפונה חייב להיות 10 ספרות ולהתחיל ב-05');
    if (!fosterFamily) validationErrors.push('חובה לבחור תשובה לשאלה "האם האישה הפונה אומצה בילדותה? או הייתה במשפחת אומנה?"');
    if (!dueDate) validationErrors.push('חובה להזין תאריך לידה משוער של האישה הפונה');
    if (!pregnancyNum) validationErrors.push('חובה להזין מספר היריון');
    if (!birthNum) validationErrors.push('חובה להזין מספר לידה');
    if (!city) validationErrors.push('חובה לבחור עיר מגורים של האישה הפונה');
    if (!supportsType.length) validationErrors.push('חובה לבחור סוג ליווי');
    if (!contactWithWorker) validationErrors.push('חובה להזין מידע על פנייה לאשת מקצוע');
    if (!hospital) validationErrors.push('חובה לבחור בית חולים');
    if (!languages.length) validationErrors.push('חובה לבחור שפות מדוברות');
    if (!age || isNaN(age) || age <= 0) validationErrors.push('חובה להזין גיל חוקי');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0); // Scroll to the top of the page
      return;
    }

    try {
      const joinFormData = {
        frameWork: frameWork === 'אחר' ? customFrameWork : frameWork,
        branch: check ? (branch === 'אחר' ? customBranch : branch) : frameWork,
        workerName,
        workerRole: workerRole === 'אחר' ? otherRole : workerRole,
        workerPhone,
        workerEmail,
        girlName,
        girlPhone,
        girlRole,
        fosterFamily,
        dueDate: Timestamp.fromDate(dueDate),
        pregnancyNum,
        birthNum,
        city,
        supportsType: supportsType.map(option => option.value),
        additionalDetails,
        contactWithWorker,
        startDate: Timestamp.fromDate(startDate),
        age: parseInt(age, 10),
        hospital,
        languages,
        formType, // Include formType here
        created_at: Timestamp.fromDate(new Date()),
        accepted: isCheckedAccept, // Add the accepted field here
      };

      const joinFormRef = collection(db, 'joinForms');
      await addDoc(joinFormRef, joinFormData);

      setFrameWork('');
      setBranch('');
      setWorkerName('');
      setWorkerRole('');
      setOtherRole('');
      setWorkerPhone('');
      setWorkerEmail('');
      setGirlName('');
      setGirlPhone('');
      setGirlRole('');
      setFosterFamily('');
      setDueDate(null);
      setPregnancyNum('');
      setBirthNum('');
      setCity('');
      setSupportsType([]);
      setAdditionalDetails('');
      setContactWithWorker('');
      setStartDate(null);
      setAge('');
      setHospital('');
      setLanguages([]);
      setErrors([]);
      alert('הנתונים נשמרו בהצלחה!');
    } catch (error) {
      console.error('Error saving data: ', error);
      setErrors(['אירעה שגיאה בשמירת הנתונים']);
      window.scrollTo(0, 0); // Scroll to the top of the page
    }
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setWorkerRole(selectedRole);
    setIsOtherRole(selectedRole === 'אחר');
  };

  const handleLanguageChange = (selectedOptions) => {
    setLanguages(selectedOptions.map(option => option.value));
  };

  return (
    <div className={styles['join-form-body']}>
      <div className={styles['join-form-container']} dir="rtl">
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className={styles['join-form-logo']} />
        <h1>טופס פנייה ראשוני לעמותת תומכות באהבה</h1>
        <p>הטופס ימולא ע"י אשת הקשר של האישה הפונה ולא היא עצמה.</p>
        {errors.length > 0 && (
          <div className={styles['join-form-error-container']}>
            <h3>בעיות מונעות את השליחה</h3>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>תאריך תחילת הליווי:<span className={styles['join-form-required']}>*</span></label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              showMonthDropdown
              locale="he"
              placeholderText="dd/MM/yyyy"
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שם המסגרת המפנה:<span className={styles['join-form-required']}>*</span></label>
            <Select
              options={frameWorks.map(fw => ({ value: fw.name, label: fw.name }))}
              value={frameWorks.find(fw => fw.name === frameWork) ? { value: frameWork, label: frameWork } : null}
              onChange={handleFrameWorkChange}
              placeholder="בחר מסגרת"
              required
              className={styles['join-form-select']}
            />
            {frameWork === 'אחר' && (
              <input
                type="text"
                value={customFrameWork}
                onChange={(e) => setCustomFrameWork(e.target.value)}
                placeholder="הזן שם מסגרת אחר"
                required
                className={styles['join-form-input']}
              />
            )}
          </div>
          {check && (
            <div className={styles['join-form-group']}>
              <label className={styles['join-form-label']}>שם הסניף:<span className={styles['join-form-required']}>*</span></label>
              <Select
                options={branches.map(branch => ({ value: branch, label: branch }))}
                value={branches.find(b => b === branch) ? { value: branch, label: branch } : null}
                onChange={(selectedOption) => setBranch(selectedOption.value)}
                placeholder="בחר סניף"
                required
                className={styles['join-form-select']}
              />
              {branch === 'אחר' && (
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  placeholder="הזן שם סניף אחר"
                  required
                  className={styles['join-form-input']}
                />
              )}
            </div>
          )}
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שם אשת הקשר מהמסגרת המלווה:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>תפקיד:<span className={styles['join-form-required']}>*</span></label>
            <select value={workerRole} onChange={handleRoleChange} required className={styles['join-form-select']}>
              <option value=""></option>
              <option value="עובדת סוציאלית">עובדת סוציאלית</option>
              <option value="רכזת/מדריכה">רכזת/מדריכה</option>
              <option value="אחר">אחר</option>
            </select>
          </div>
          {isOtherRole && (
            <div className={styles['join-form-group']}>
              <label className={styles['join-form-label']}>אנא פרטי:<span className={styles['join-form-required']}>*</span></label>
              <input
                type="text"
                value={otherRole}
                onChange={(e) => setOtherRole(e.target.value)}
                required
                className={styles['join-form-input']}
              />
            </div>
          )}
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מספר טלפון של אשת הקשר:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="tel"
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מייל של אשת הקשר:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="email"
              value={workerEmail}
              onChange={(e) => setWorkerEmail(e.target.value)}
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שם האישה הפונה:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="text"
              value={girlName}
              onChange={(e) => setGirlName(e.target.value)}
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מספר טלפון של האישה הפונה:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="tel"
              value={girlPhone}
              onChange={(e) => setGirlPhone(e.target.value)}
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מעמד - יש לסמן רק אם היא חסרת מעמד:</label>
            <select value={girlRole} onChange={(e) => setGirlRole(e.target.value)} className={styles['join-form-select']}>
              <option value=""></option>
              <option value="חסרת מעמד">חסרת מעמד</option>
            </select>
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>גיל האישה הפונה:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              required
              className={styles['join-form-input']}
            />
          </div>
          {/* Add the new language selection field */}
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שפות מדוברות:<span className={styles['join-form-required']}>*</span></label>
            <Select
              isMulti
              options={languageOptions}
              value={languageOptions.filter(option => languages.includes(option.value))}
              onChange={handleLanguageChange}
              required
              className={styles['join-form-select']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>האם האישה הפונה אומצה בילדותה? או הייתה במשפחת אומנה?<span className={styles['join-form-required']}>*</span></label>
            <select value={fosterFamily} onChange={(e) => setFosterFamily(e.target.value)} required className={styles['join-form-select']}>
              <option value=""></option>
              <option value="כן">כן</option>
              <option value="לא">לא</option>
              <option value="לא יודעת">לא יודעת</option>
            </select>
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>תאריך לידה משוער של האישה הפונה (מתי היא צריכה ללדת):<span className={styles['join-form-required']}>*</span><br /><span className={styles['join-form-sub-label']}> אם לא ידוע-סמני 15 לחודש המשוער</span></label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              showMonthDropdown
              locale="he"
              placeholderText="dd/MM/yyyy"
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מספר היריון:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="number"
              value={pregnancyNum}
              onChange={(e) => setPregnancyNum(e.target.value)}
              placeholder="Ex. 1234"
              min="0"
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מספר לידה:<span className={styles['join-form-required']}>*</span><br/>
            <span className={styles['join-form-sub-label']}>כולל לידה שקטה</span></label>
            <input
              type="number"
              value={birthNum}
              onChange={(e) => setBirthNum(e.target.value)}
              placeholder="Ex. 5678"
              min="0"
              required
              className={styles['join-form-input']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>עיר מגורים של האישה הפונה:<span className={styles['join-form-required']}>*</span></label>
            <select value={city} onChange={(e) => setCity(e.target.value)} required className={styles['join-form-select']}>
              <option value=""></option>
              {cities.map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>לאיזה סוג ליווי האישה הפונה זקוקה ומבקשת<span className={styles['join-form-required']}>*</span></label>
            <Select
              isMulti
              options={supportOptions}
              value={supportsType}
              onChange={setSupportsType}
              required
              className={styles['join-form-select']}
              classNamePrefix="join-form-select"
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>בית יולדות שבו היא תרצה ללדת<span className={styles['join-form-required']}>*</span><br />
            <span className={styles['join-form-sub-label']}> אם היא עדיין לא יודעת אנא סמני "עדיין לא בחרה", אם יש צורך רק בפגישות - סמני "פגישה"</span></label>
            <select value={hospital} onChange={(e) => setHospital(e.target.value)} required className={styles['join-form-select']}>
              <option value=""></option>
              {hospitals.map((hospital, index) => (
                <option key={index} value={hospital}>{hospital}</option>
              ))}
            </select>
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מידע חשוב נוסף שחשוב שנדע על האישה הפונה שיעזור לנו בהתאם הליווי והתומכת המתמאימה:</label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className={styles['join-form-textarea']}
            />
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>האם האישה הפונה פנתה לאשת מקצוע באופן פרטי? ואם כן לאיזה סוג ליווי?<span className={styles['join-form-required']}>*</span><br />
            <span className={styles['join-form-sub-label']}>במידה וקבעה לדוגמה עם דולה באופן פרטי לא נוכל לספק את סוג התמיכה הזה</span></label>
            <textarea
              value={contactWithWorker}
              onChange={(e) => setContactWithWorker(e.target.value)}
              required
              className={styles['join-form-textarea']}
            />
          </div>
          <button type="submit" className={styles['join-form-button']}>שלח</button>
        </form>
      </div>
    </div>
  );
};

export default JoinForm;
