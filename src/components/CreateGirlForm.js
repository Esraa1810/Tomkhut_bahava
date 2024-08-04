import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker, { registerLocale } from 'react-datepicker';
import he from 'date-fns/locale/he';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { fetchCities } from './cityService';
import SearchComponent from './SearchComponent';
import './CreateGirlForm.css';
import 'react-datepicker/dist/react-datepicker.css';
import HomeButton from './HomeButton'; // Import HomeButton component
import Footer from './Footer'; // Import Footer component

registerLocale('he', he);

const CreateGirlForm = () => {
  const initialFormData = {
    firstName: '',
    lastName: '',
    birthDate: '',
    phoneNumber: '',
    status: 'פעיל',
    city: '',
    languages: [],
    details: '',
    fosterFamily: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState([]);
  const [cities, setCities] = useState([]);

  const languageOptions = [
    { value: 'עברית', label: 'עברית' },
    { value: 'ערבית', label: 'ערבית' },
    { value: 'רוסית', label: 'רוסית' },
    { value: 'אנגלית', label: 'אנגלית' },
    { value: 'רומנית', label: 'רומנית' },
    { value: 'יידיש', label: 'יידיש' },
    { value: 'צרפתית', label: 'צרפתית' },
    { value: 'גרמנית', label: 'גרמנית' },
    { value: 'ספרדית', label: 'ספרדית' },
    { value: 'אחר', label: 'אחר' }
  ];

  useEffect(() => {
    const loadCities = async () => {
      const citiesList = await fetchCities();
      setCities(citiesList);
    };

    loadCities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, birthDate: date });
  };

  const isValidIsraeliPhoneNumber = (phoneNumber) => {
    const phoneRegex = /^05\d{8}$/;
    return phoneRegex.test(phoneNumber);
  };

  const isFutureDate = (date) => {
    const today = new Date();
    return new Date(date) > today;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = [];

    if (isFutureDate(formData.birthDate)) {
      validationErrors.push('תאריך הלידה לא יכול להיות בעתיד');
    }
    if (!isValidIsraeliPhoneNumber(formData.phoneNumber)) {
      validationErrors.push('מספר טלפון לא חוקי');
    }
    if (!formData.city) {
      validationErrors.push('חובה להזין עיר');
    }
 
    if (formData.languages.length === 0) {
      validationErrors.push('חובה להזין לפחות שפה אחת');
    }
    if (!formData.fosterFamily) {
      validationErrors.push('חובה להזין אם האישה אומצה בילדותה');
    }

    try {
      const girlsRef = collection(db, 'girls');
      const q = query(girlsRef, where("phoneNumber", "==", formData.phoneNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        validationErrors.push('מספר טלפון זה כבר קיים במערכת');
      }
    } catch (error) {
      validationErrors.push('אירעה שגיאה בבדיקת הנתונים במערכת');
      console.error('Error checking document: ', error);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        birthDate: new Date(formData.birthDate)
      };
      await addDoc(collection(db, 'girls'), dataToSave); // Add document to 'girls' collection

      alert('הילדה נוספה בהצלחה!'); // Show success alert
      setFormData(initialFormData); // Reset form fields
    } catch (error) {
      console.error('Error adding document: ', error);
      setErrors(['אירעה שגיאה בהוספת הנתונים']);
    }
  };

  const handleLanguageChange = (selectedOptions) => {
    setFormData({ ...formData, languages: selectedOptions ? selectedOptions.map(option => option.value) : [] });
  };

  return (
    <div>
      <div className="form-container" dir="rtl">
        <SearchComponent /> {/* Pass navigateTo as prop */}
        <div className='home-button-container'>
          <HomeButton /> {/* Add the HomeButton component */}
        </div>

        <h1>הוספת צעירה במערכת</h1>
        {errors.length > 0 && (
          <div className="error-container">
            <h3>בעיות מונעות את השמירה</h3>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <form className="girl-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label>שם פרטי:</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>שם משפחה:</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>תאריך לידה:</label>
              <DatePicker
                selected={formData.birthDate}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                locale="he"
                placeholderText="dd/MM/yyyy"
                required
              />
            </div>
            <div className="form-group">
              <label>מספר טלפון:</label>
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="חייב להתחיל ב-05" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>עיר:</label>
              <select name="city" value={formData.city} onChange={handleChange} required>
                <option value="">בחר עיר</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>שפות מדוברות:</label>
              <Select
                isMulti
                options={languageOptions}
                name="languages"
                value={languageOptions.filter(option => formData.languages.includes(option.value))}
                onChange={handleLanguageChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>האם האישה הפונה אומצה בילדותה? </label>
              <select name="fosterFamily" value={formData.fosterFamily} onChange={handleChange} required>
                <option value=""></option>
                <option value="כן">כן</option>
                <option value="לא">לא</option>
                <option value="לא יודעת">לא יודעת</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>הערות:</label>
              <textarea type="text" name="details" value={formData.details} onChange={handleChange} />
            </div>
          </div>
          <button type="submit">הוסף צעירה</button>
        </form>
      </div>
      <Footer /> {/* Move Footer component outside form-container */}
    </div>
  );
};

export default CreateGirlForm;
