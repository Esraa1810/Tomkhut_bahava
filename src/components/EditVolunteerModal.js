import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './EditVolunteerModal.css';
import { db } from '../firebaseConfig'; // Correct import statement for Firebase Firestore
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore'; // Ensure correct imports

const availabilityOptions = [
  { value: 'בוקר', label: 'בוקר' },
  { value: 'ערב', label: 'ערב' },
  { value: 'לילה', label: 'לילה' },
];



const EditVolunteerModal = ({ volunteer, onClose, onSave, cities, languages, profession, able, generalErrors }) => {
  const initialVolunteerState = {
    id: '',
    firstname: '',
    lastname: '',
    phoneNumber: '',
    email: '',
    able: [],
    city: '',
    languages: [],
    profession: [],
    birthDate: ''
  };

  const [updatedVolunteer, setUpdatedVolunteer] = useState(volunteer || initialVolunteerState);
  const [errors, setErrors] = useState({
    id: '',
    phoneNumber: '',
    email: '',
    firstname: '',
    lastname: '',
    able: '',
    city: '',
    languages: '',
    profession: '',
  });
  
  useEffect(() => {
    setErrors([]);
  }, [updatedVolunteer]);

  const handleChange = (name, value) => {
    setUpdatedVolunteer(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    handleChange(name, selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const handleSingleSelectChange = (name, selectedOption) => {
    handleChange(name, selectedOption ? selectedOption.value : '');
  };

  const validateForm = async () => {
    const newErrors = {
      id: '',
      phoneNumber: '',
      email: '',
      firstname: '',
      lastname: '',
      able: '',
      city: '',
      languages: '',
      profession: '',
    };
  
    const { id, phoneNumber, email, firstname, lastname, able, city, languages, profession } = updatedVolunteer;
  
    // Validate ID
    if (!/^\d{9}$/.test(id)) {
      newErrors.id = 'תעודת הזהות חייבת להיות מורכבת מ-9 ספרות';
    }
  
    // Validate phone number
    if (!/^05\d{8}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'מספר הטלפון חייב להיות בן 10 ספרות ולהתחיל ב-05';
    } else {
      try {
        // Check if phone number already exists in Firestore
        const volunteerSnapshot = await getDocs(query(collection(db, 'volunteers'), where('phoneNumber', '==', phoneNumber)));
        
        if (volunteerSnapshot.empty) {
          // Ensure that docs[0] exists and compare IDs
          const existingVolunteerId = volunteerSnapshot.docs[0]?.id;
          console.log(volunteer.id);
          console.log(existingVolunteerId);
          if (existingVolunteerId && existingVolunteerId !== volunteer.id) {
            newErrors.phoneNumber = 'מספר הטלפון כבר קיים במערכת';
          }
        }
      } catch (error) {
        console.error("Error querying Firestore:", error);
        newErrors.phoneNumber = 'שגיאה בעת בדיקת מספר הטלפון';
      }
    }
  
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'כתובת הדואר האלקטרוני לא חוקית';
    }
  
    // Validate firstname and lastname
    if (!firstname) {
      newErrors.firstname = 'שדה שם פרטי חובה';
    } else if (/\d/.test(firstname)) {
      newErrors.firstname = 'שם פרטי אינו יכול להכיל מספרים';
    }
  
    if (!lastname) {
      newErrors.lastname = 'שדה שם משפחה חובה';
    } else if (/\d/.test(lastname)) {
      newErrors.lastname = 'שם משפחה אינו יכול להכיל מספרים';
    }
  
    // Check for required fields
    if (!able.length) {
      newErrors.able = 'שדה פנוי חובה';
    }
    if (!city) {
      newErrors.city = 'שדה עיר חובה';
    }
    if (!languages.length) {
      newErrors.languages = 'שדה שפות חובה';
    }
    if (!profession.length) {
      newErrors.profession = 'שדה מקצוע חובה';
    }
  
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };
  
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
  
    if (isValid) {
      try {
        await onSave(updatedVolunteer);

        // Update help_record collection
        const helpRecordsRef = collection(db, 'help_record');
        const helpRecordsQuery = query(helpRecordsRef, where('volunteers', 'array-contains', volunteer.phoneNumber));
        const helpRecordsSnapshot = await getDocs(helpRecordsQuery);

        const batch = writeBatch(db); // Use writeBatch to create a batch

        helpRecordsSnapshot.forEach((recordDoc) => {
          const recordRef = doc(db, 'help_record', recordDoc.id);
          const recordData = recordDoc.data();
          const volunteersArray = recordData.volunteers || [];
          const updatedVolunteersArray = volunteersArray.map(num =>
            num === volunteer.phoneNumber ? updatedVolunteer.phoneNumber : num
          );
  
          batch.update(recordRef, { volunteers: updatedVolunteersArray });
        });

        await batch.commit(); // Commit batch update

        alert('פרטי המתנדב עודכנו בהצלחה');
        onClose();
      } catch (error) {
        console.error("Error updating volunteer or help records:", error);
        alert('שגיאה בעת עדכון פרטי המתנדב');
      }
    } else {
      alert('יש שגיאות בטופס, אנא תקן את השגיאות לפני השמירה.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>עריכת פרטי המתנדב</h2>
        
        <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-row">
  <div className="form-group">
    <label>שם פרטי:</label>
    <input
      type="text"
      name="firstname"
      value={updatedVolunteer.firstname || ''}
      onChange={(e) => handleChange('firstname', e.target.value)}
    />
    {errors.firstname && <p className="error-message">{errors.firstname}</p>}
  </div>
  <div className="form-group">
    <label>שם משפחה:</label>
    <input
      type="text"
      name="lastname"
      value={updatedVolunteer.lastname || ''}
      onChange={(e) => handleChange('lastname', e.target.value)}
    />
    {errors.lastname && <p className="error-message">{errors.lastname}</p>}
  </div>
</div>

<div className="form-row">
  <div className="form-group">
    <label>תעודת זהות:</label>
    <input
      type="text"
      name="id"
      value={updatedVolunteer.id || ''}
      onChange={(e) => handleChange('id', e.target.value)}
    />
    {errors.id && <p className="error-message">{errors.id}</p>}
  </div>
  <div className="form-group">
    <label>מספר טלפון:</label>
    <input
      type="text"
      name="phoneNumber"
      value={updatedVolunteer.phoneNumber || ''}
      onChange={(e) => handleChange('phoneNumber', e.target.value)}
    />
    {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
  </div>
</div>

<div className="form-row">
  <div className="form-group">
    <label>פנוי:</label>
    <Select
      id="able"
      name="able"
      options={able}
      value={able.filter(option => updatedVolunteer.able?.includes(option.value))}
      onChange={(options) => handleMultiSelectChange('able', options)}
      isMulti
      placeholder="בחר זמן"
      className="select-dropdown"
    />
    {errors.able && <p className="error-message">{errors.able}</p>}
  </div>
  <div className="form-group">
    <label>דואר אלקטרוני:</label>
    <input
      type="email"
      name="email"
      value={updatedVolunteer.email || ''}
      onChange={(e) => handleChange('email', e.target.value)}
    />
    {errors.email && <p className="error-message">{errors.email}</p>}
  </div>
</div>

<div className="form-row">
  <div className="form-group">
    <label>עיר:</label>
    <Select
      name="city"
      value={cities.find(city => city.value === updatedVolunteer.city) || null}
      options={cities}
      onChange={(option) => handleSingleSelectChange('city', option)}
      placeholder="בחר עיר"
    />
    {errors.city && <p className="error-message">{errors.city}</p>}
  </div>
  <div className="form-group">
    <label>שפות:</label>
    <Select
      name="languages"
      value={languages.filter(language => updatedVolunteer.languages?.includes(language.value))}
      options={languages}
      onChange={(options) => handleMultiSelectChange('languages', options)}
      isMulti
      placeholder="בחר שפה"
    />
    {errors.languages && <p className="error-message">{errors.languages}</p>}
  </div>
</div>

          <div className="form-row">
            
            <div className="form-group">
              <label>תאריך לידה:</label>
              <DatePicker
                selected={updatedVolunteer.birthDate ? new Date(updatedVolunteer.birthDate) : null}
                onChange={(date) => handleChange('birthDate', date ? date.toISOString() : '')}
                dateFormat="dd/MM/yyyy"
                placeholderText="בחר תאריך"
              />
            </div>
          </div>

          <div className="form-group">
            <label>הערות:</label>
            <textarea
              name="comments"
              value={updatedVolunteer.comments || ''}
              onChange={(e) => handleChange('comments', e.target.value)}
            ></textarea>
          </div>

          <div className="form-actions">
  <button type="submit" className="save-btn">שמור</button>
  <button type="button" onClick={onClose} className="close-btn">בטל</button>
</div>

        </form>
      </div>
    </div>
  );
};

EditVolunteerModal.propTypes = {
  volunteer: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  cities: PropTypes.array.isRequired,
  languages: PropTypes.array.isRequired,
  profession: PropTypes.array.isRequired,
  able: PropTypes.array.isRequired,
  generalErrors: PropTypes.array.isRequired,
};

export default EditVolunteerModal;
