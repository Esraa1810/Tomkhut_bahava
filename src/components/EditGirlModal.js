import React from 'react';
import Select from 'react-select';
import DatePicker, { registerLocale } from 'react-datepicker';
import he from 'date-fns/locale/he';
import 'react-datepicker/dist/react-datepicker.css';
import './EditGirlModal.css';

registerLocale('he', he);

const religionOptions = [
  { value: 'יהדות', label: 'יהדות' },
  { value: 'אסלאם', label: 'אסלאם' },
  { value: 'נצרות', label: 'נצרות' },
  { value: 'דרוזים', label: 'דרוזים' },
  { value: 'בהאים', label: 'בהאים' },
  { value: 'אחר', label: 'אחר' }
];

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

const fosterFamilyOptions = [
  { value: 'כן', label: 'כן' },
  { value: 'לא', label: 'לא' },
  { value: 'לא יודעת', label: 'לא יודעת' }
];

const EditGirlModal = ({ isOpen, onRequestClose, girl, onChange, onSave, cities, errors = {}, generalErrors = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-unique">
      <div className="modal-content-unique">
        <img src="/close.png" alt="Close" className="close-icon-unique" onClick={onRequestClose} />
        <h2>עריכת פרטי הילדה</h2>
        {generalErrors.length > 0 && (
          <div className="error-container-unique">
            <h3>בעיות מונעות את השמירה ⚠️</h3>
            <ul>
              {generalErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="modal-form-unique">
          <div className="form-row-unique">
            <div className={`form-group-unique ${errors.firstName ? 'error' : ''}`}>
              <label>שם פרטי:</label>
              <input type="text" name="firstName" className="editable-unique" value={girl.firstName} onChange={onChange} />
            </div>
            <div className={`form-group-unique ${errors.lastName ? 'error' : ''}`}>
              <label>שם משפחה:</label>
              <input type="text" name="lastName" className="editable-unique" value={girl.lastName} onChange={onChange} />
            </div>
          </div>
          <div className="form-row-unique">
            <div className={`form-group-unique ${errors.phoneNumber ? 'error' : ''}`}>
              <label>מספר טלפון:</label>
              <input type="text" name="phoneNumber" className="editable-unique" value={girl.phoneNumber} onChange={onChange} />
            </div>
            <div className={`form-group-unique ${errors.city ? 'error' : ''}`}>
              <label>עיר:</label>
              <select name="city" className="editable-unique" value={girl.city} onChange={onChange}>
                <option value="">בחר עיר</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row-unique">
            <div className={`form-group-unique ${errors.languages ? 'error' : ''}`}>
              <label>שפות מדוברות:</label>
              <Select
                isMulti
                options={languageOptions}
                name="languages"
                value={languageOptions.filter(option => girl.languages.includes(option.value))}
                onChange={(selectedOptions) => onChange({ target: { name: 'languages', value: selectedOptions.map(option => option.value) } })}
              />
            </div>
            <div className={`form-group-unique ${errors.fosterFamily ? 'error' : ''}`}>
              <label>האם הצעירה אומצה בילדותה?</label>
              <Select
                options={fosterFamilyOptions}
                name="fosterFamily"
                value={fosterFamilyOptions.find(option => option.value === girl.fosterFamily)}
                onChange={(selectedOption) => onChange({ target: { name: 'fosterFamily', value: selectedOption.value } })}
              />
            </div>
          </div>
          <div className="form-row-unique">
            <div className={`form-group-unique ${errors.details ? 'error' : ''}`}>
              <label>הערות:</label>
              <textarea type="text" name="details" className="editable-unique" value={girl.details} onChange={onChange} />
            </div>
          </div>
        </div>
        <button className="save-btn-unique" onClick={onSave}>שמור</button>
      </div>
    </div>
  );
};

export default EditGirlModal;
