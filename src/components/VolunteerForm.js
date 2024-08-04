import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import languages from './languages';
import profession from './profession';
import { fetchCities } from './cityService';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SearchComponent from './SearchComponent';
import HomeButton from './HomeButton';
import Footer from './Footer'; // Importing the Footer component
import './VolunteerForm.css';

const isFutureDate = (date) => {
  const today = new Date();
  return new Date(date) > today;
};

const VolunteerForm = ({ onFormSubmit }) => {
  const initialFormData = {
    id: '',
    firstname: '',
    lastname: '',
    phoneNumber: '',
    email: '',
    languages: [],
    profession: [],
    birthDate: '',
    religious: false,
    able: [],
    comments: '',
    city: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [availableProfession, setAvailableProfession] = useState([]);
  const [availableAble, setAvailableAble] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [errors, setErrors] = useState({});
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setAvailableLanguages(languages.map(lang => ({ value: lang.value, label: lang.label })));
      const allCities = await fetchCities();
      setAvailableCities(allCities.map(city => ({ value: city, label: city })));
      setAvailableProfession(profession.map(prof => ({ value: prof.value, label: prof.label })));
      setAvailableAble([
        { value: 'בוקר', label: 'בוקר' },
        { value: 'ערב', label: 'ערב' },
        { value: 'לילה', label: 'לילה' },
      ]);
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, birthDate: date });
  };

  const handleLanguageChange = (selectedOptions) => {
    setFormData({ ...formData, languages: selectedOptions ? selectedOptions.map(option => option.value) : [] });
  };

  const handleProfessionChange = (selectedOptions) => {
    setFormData({ ...formData, profession: selectedOptions ? selectedOptions.map(option => option.value) : [] });
  };

  const handleAbleChange = (selectedOptions) => {
    setFormData({ ...formData, able: selectedOptions ? selectedOptions.map(option => option.value) : [] });
  };

  const handleCityChange = (selectedOption) => {
    setFormData({ ...formData, city: selectedOption ? selectedOption.value : '' });
  };

  const validatePhoneNumber = async (phoneNumber) => {
    const volunteerRef = collection(db, 'volunteer');
    const q = query(volunteerRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const validateForm = async () => {
    const errors = {};
    setPhoneNumberError('');
    const idRegex = /^\d{9}$/;
    const phoneNumberRegex = /^05\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[^\d]+$/;
    const requiredFields = ['id', 'firstname', 'lastname', 'phoneNumber', 'email'];

    for (const field of requiredFields) {
      if (!formData[field]) {
        errors[field] = 'השדה חייב להיות מלא';
      }
    }

    if (!formData.id || !idRegex.test(formData.id)) {
      errors.id = 'תעודת זהות חייבת להיות בדיוק 9 ספרות';
    }

    if (!formData.firstname || !nameRegex.test(formData.firstname)) {
      errors.firstname = 'שם פרטי לא יכול להכיל מספרים';
    }

    if (!formData.lastname || !nameRegex.test(formData.lastname)) {
      errors.lastname = 'שם משפחה לא יכול להכיל מספרים';
    }

    if (isFutureDate(formData.birthDate)) {
      errors.birthDate = 'תאריך הלידה לא יכול להיות בעתיד';
    }

    if (!formData.phoneNumber || !phoneNumberRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = 'מספר הטלפון לא חוקי';
    } else {
      const phoneNumberExists = await validatePhoneNumber(formData.phoneNumber);
      if (phoneNumberExists) {
        errors.phoneNumber = 'מספר הטלפון קיים במערכת';
        setPhoneNumberError('מספר הטלפון קיים במערכת');
      }
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'דואר אלקטרוני לא חוקי';
    }

    if (!formData.city) {
      errors.city = 'עליך לבחור עיר אחת לפחות';
    }

    if (formData.languages.length === 0) {
      errors.languages = 'עליך לבחור לפחות שפה אחת';
    }

    if (formData.profession.length === 0) {
      errors.profession = 'עליך לבחור לפחות מקצוע אחד';
    }

    if (formData.able.length === 0) {
      errors.able = 'עליך לבחור לפחות זמן אחת';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    const createdAtTimestamp = serverTimestamp();
    const updatedFormData = {
      ...formData,
      createdAt: createdAtTimestamp,
    };

    try {
      const volunteerRef = collection(db, 'volunteer');
      const docRef = await addDoc(volunteerRef, updatedFormData);
      setFormData(initialFormData);
      setErrors({});
      setPhoneNumberError('');
      setSuccessMessage('!הנתונים נשמרו בהצלחה');
      if (onFormSubmit) {
        onFormSubmit(docRef.id);
      }
    } catch (error) {
      console.error('Error submitting form:', error.message);
    }
  };

  return (
    <>
      <div className="form-container" dir="rtl">
        <SearchComponent />
        <div className="home-button-container">
          <HomeButton />
        </div>
        {phoneNumberError && (
          <div className="error-container">
            <p className="error-message">{phoneNumberError}</p>
          </div>
        )}
        {successMessage && (
          <div className="success-container">
            <p className="success-message">{successMessage}</p>
          </div>
        )}
        <form className="volunteer-form" onSubmit={handleSubmit} noValidate>
          <h1>יצירת מתנדבת במערכת</h1>
          {/* {Object.keys(errors).length > 0 && (
            <div className="error-container">
              <h3>בעיות מונעות את השמירה</h3>
              <ul>
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )} */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstname">שם פרטי:</label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
              {errors.firstname && <span className="error-message">{errors.firstname}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastname">שם משפחה:</label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
              {errors.lastname && <span className="error-message">{errors.lastname}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="id">תעודת זהות:</label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                required
              />
              {errors.id && <span className="error-message">{errors.id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">מספר טלפון:</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">דואר אלקטרוני:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="birthDate">תאריך לידה:</label>
              <DatePicker
                id="birthDate"
                selected={formData.birthDate}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                placeholderText="dd/MM/yyyy"
                required
              />
              {errors.birthDate && <span className="error-message">{errors.birthDate}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">עיר:</label>
              <Select
                id="city"
                name="city"
                options={availableCities}
                value={availableCities.find(option => option.value === formData.city)}
                onChange={handleCityChange}
                isClearable
                placeholder="בחר עיר"
                className="select-dropdown"
                required
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="languages">שפות:</label>
              <Select
                id="languages"
                name="languages"
                options={availableLanguages}
                value={availableLanguages.filter(option => formData.languages.includes(option.value))}
                onChange={handleLanguageChange}
                isMulti
                placeholder="בחר שפות"
                className="select-dropdown"
                required
              />
              {errors.languages && <span className="error-message">{errors.languages}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profession">מקצוע:</label>
              <Select
                id="profession"
                name="profession"
                options={availableProfession}
                value={availableProfession.filter(option => formData.profession.includes(option.value))}
                onChange={handleProfessionChange}
                isMulti
                placeholder="בחר מקצוע"
                className="select-dropdown"
                required
              />
              {errors.profession && <span className="error-message">{errors.profession}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="religious">האם דתי:</label>
              <input
                type="checkbox"
                id="religious"
                name="religious"
                checked={formData.religious}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="able">פנוי:</label>
              <Select
                id="able"
                name="able"
                options={availableAble}
                value={availableAble.filter(option => formData.able.includes(option.value))}
                onChange={handleAbleChange}
                isMulti
                placeholder="בחר זמן"
                className="select-dropdown"
                required
              />
              {errors.able && <span className="error-message">{errors.able}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="comments">הערות:</label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
              />
            </div>
          </div>
          <button type="submit">שמירה</button>
        </form>
      </div>
      <Footer /> {/* Including the Footer component outside of form-container */}
    </>
  );
};

export default VolunteerForm;
