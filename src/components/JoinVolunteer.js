import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './JoinVolunteerForm.module.css';
import languageOptions from './languages'; // Import language options from external file
import professionOptions from './profession'; // Import profession options from external file
import { fetchCities } from './cityService'; // Import fetchCities function from external file
import { Timestamp, collection, addDoc } from 'firebase/firestore'; // Import Timestamp, collection, addDoc from Firebase Firestore
import { db } from '../firebaseConfig';

const JoinForm = () => {
  const [birthDate, setBirthDate] = useState(null);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [languages, setLanguages] = useState([]);
  const [profession, setProfession] = useState([]);
  const [religious, setReligious] = useState(false);
  const [city, setCity] = useState('');
  const [able, setAble] = useState([]);
  const [comments, setComments] = useState('');
  const [id, setId] = useState('');
  const [cityOptions, setCityOptions] = useState([]);
  const [formType, setFormType] = useState('מתנדב');
  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
    phoneNumber: '',
    email: '',
    city: '',
    languages: '',
    profession: '',
    able: '',
    id: '',
    isChecked: ''
  });
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedAccept, setIsCheckedAccept] = useState(false);

  const availableOptions = [
    { value: 'בוקר', label: 'בוקר' },
    { value: 'ערב', label: 'ערב' },
    { value: 'לילה', label: 'לילה' },
  ];

  useEffect(() => {
    const fetchCityOptions = async () => {
      const cities = await fetchCities();
      setCityOptions(cities.map(city => ({ value: city, label: city })));
    };

    fetchCityOptions();
  }, []);

  const handleAvailableChange = (selectedOptions) => {
    setAble(selectedOptions.map(option => option.value));
  };

  const handleLanguageChange = (selectedOptions) => {
    setLanguages(selectedOptions.map(option => option.value));
  };

  const handleProfessionChange = (selectedOptions) => {
    setProfession(selectedOptions.map(option => option.value));
  };

  const validateForm = () => {
    let newErrors = {};
    const currentDate = new Date();

    if (birthDate && birthDate > currentDate) newErrors.birthDate = 'תאריך הלידה לא יכול להיות בעתיד';
    if (!phoneNumber.match(/^05\d{8}$/)) newErrors.phoneNumber = 'מספר הטלפון חייב להיות 10 ספרות ולהתחיל ב-05';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'כתובת המייל אינה חוקית';
    if (!firstname) newErrors.firstname = 'חובה להזין שם פרטי';
    if (!lastname) newErrors.lastname = 'חובה להזין שם משפחה';
    if (!city) newErrors.city = 'חובה לבחור עיר';
    if (!languages.length) newErrors.languages = 'חובה לבחור שפות מדוברות';
    if (!profession.length) newErrors.profession = 'חובה לבחור מקצוע';
    if (!able.length) newErrors.able = 'חובה לבחור זמני זמינות';
    if (!id.match(/^\d{9}$/)) newErrors.id = 'מספר תעודת זהות חייב להיות 9 ספרות';
    if (!isChecked) newErrors.isChecked = 'חובה לאשר את תנאי השימוש והמדיניות'; 

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const joinFormData = {
        firstname,
        lastname,
        phoneNumber,
        id,
        email,
        languages,
        profession,
        able,
        religious,
        comments,
        city,
        formType,
        birthDate: Timestamp.fromDate(birthDate),
        createdAt: Timestamp.fromDate(new Date()),
        accepted: isCheckedAccept,

      };

      const joinFormRef = collection(db, 'joinForms');
      await addDoc(joinFormRef, joinFormData);

      // Reset form fields
      setFirstname('');
      setLastname('');
      setPhoneNumber('');
      setId('');
      setAble([]);
      setCity('');
      setComments('');
      setEmail('');
      setLanguages([]);
      setProfession([]);
      setReligious(false);
      setErrors({});
      setBirthDate(null);
      setIsChecked(false);
      alert('הנתונים נשמרו בהצלחה!');
    } catch (error) {
      console.error('Error saving data: ', error);
      setErrors({ general: 'אירעה שגיאה בשמירת הנתונים' });
    }
  };

  return (
    <div className={styles['join-form-container']}>
      <div className={styles['join-form']}>
        <div className={styles['join-form-header']}>
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className={styles['join-form-logo']} />
          <h2 className={styles['join-form-title']}>טופס פנייה ראשוני לעמותת תומכות באהבה</h2>
        </div>
        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className={styles['error-messages']}>
              <p className={styles['error-text']}>{errors.general}</p>
            </div>
          )}
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>הטופס ימולא ע"י המתנדבת:</label>
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שם פרטי:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="text"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className={styles['join-form-input']}
            />
            {errors.firstname && <p className={styles['join-form-error-text']}>{errors.firstname}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שם משפחה:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              className={styles['join-form-input']}
            />
            {errors.lastname && <p className={styles['join-form-error-text']}>{errors.lastname}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>תאריך הלידה של מתנדבת:<span className={styles['join-form-required']}>*</span></label>
            <DatePicker
              selected={birthDate}
              onChange={(date) => setBirthDate(date)}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              showMonthDropdown
              locale="he"
              placeholderText="dd/MM/yyyy"
              required
              className={styles['join-form-input']}
            />
              {errors.birthDate && <p className={styles['join-form-error-text']}>{errors.birthDate}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מספר טלפון:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={styles['join-form-input']}
              pattern="^05\d{8}$"
              title="מספר טלפון חייב להיות 10 ספרות ולהתחיל ב-05"
            />
            {errors.phoneNumber && <p className={styles['join-form-error-text']}>{errors.phoneNumber}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>תעודת זהות:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className={styles['join-form-input']}
              pattern="^\d{9}$"
              title="מספר תעודת זהות חייב להיות 9 ספרות"
            />
            {errors.id && <p className={styles['join-form-error-text']}>{errors.id}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>כתובת מייל:<span className={styles['join-form-required']}>*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles['join-form-input']}
            />
            {errors.email && <p className={styles['join-form-error-text']}>{errors.email}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>עיר מגורים:<span className={styles['join-form-required']}>*</span></label>
            <Select
              options={cityOptions}
              value={cityOptions.find(option => option.value === city)}
              onChange={(option) => setCity(option ? option.value : '')}
              className={styles['join-form-input']}
            />
            {errors.city && <p className={styles['join-form-error-text']}>{errors.city}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>שפות מדוברות:<span className={styles['join-form-required']}>*</span></label>
            <Select
              isMulti
              options={languageOptions}
              value={languageOptions.filter(option => languages.includes(option.value))}
              onChange={handleLanguageChange}
              className={styles['join-form-input']}
            />
            {errors.languages && <p className={styles['join-form-error-text']}>{errors.languages}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>מקצוע:<span className={styles['join-form-required']}>*</span></label>
            <Select
              isMulti
              options={professionOptions}
              value={professionOptions.filter(option => profession.includes(option.value))}
              onChange={handleProfessionChange}
              className={styles['join-form-input']}
            />
            {errors.profession && <p className={styles['join-form-error-text']}>{errors.profession}</p>}
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>זמני זמינות:<span className={styles['join-form-required']}>*</span></label>
            <Select
              isMulti
              options={availableOptions}
              value={availableOptions.filter(option => able.includes(option.value))}
              onChange={handleAvailableChange}
              className={styles['join-form-input']}
            />
            {errors.able && <p className={styles['join-form-error-text']}>{errors.able}</p>}
          </div>
          <div className={styles['join-form-group']}>
          <h4>נא לקרוא את שני הקבצים המצורפים ולחתום</h4>
            <label className={styles['join-form-label']}>
              <a href="https://docs.google.com/document/d/1xUAZuyotudDEUINmgMHzfTlwkeV4m0rZdJJSdF2ssmo/edit" target="_blank" rel="noopener noreferrer">
                התחייבות לשמירת סודיות
              </a>
            </label>
          </div>
          <div className={styles['join-form-group']}>
            <label className={styles['join-form-label']}>
              <a href="https://docs.google.com/document/d/1JffTzy5fz4zhxr2XZmZDX-Lbbe7hHM89fuDjj9byo9Q/edit" target="_blank" rel="noopener noreferrer">
                הסכם התנדבות
              </a>
            </label>
          </div>

          <div className={styles['join-form-group']}>
          <div className="text-center">
            <h4>אני מאשרת כי קראתי את שני הקבצים ,ואני מסכימה לתנאי השימוש</h4>
          </div>
          <div className="sec-text-center">
            <h4>והמדיניות של העמותה.</h4>
          </div>
          <label>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
            />
            {errors.isChecked && <p className={styles['join-form-error-text']}>{errors.isChecked}</p>}
          </label>
        </div>
          
          <button type="submit" className={styles['join-form-submit']}>שמור</button>
        </form>
      </div>
    </div>
  );
};

export default JoinForm;
