import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import SearchComponent from './SearchComponent';
import Footer from './Footer';
import HomeButton from './HomeButton';
import './CreateFramework.css';

function CreateFramework() {
  const [inputText, setInputText] = useState('');
  const [frameError, setFrameError] = useState('');
  const [check, setCheck] = useState('');
  const [branches, setBranches] = useState([{ branchName: '', branchCity: '' }]);
  const [contacts, setContacts] = useState([[]]);

  const roles = ['רכזת', 'עובדת סוציאלית', 'אחר'];

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validatePhone = (phone) => {
    const regex = /^0(5[^7]|[2-4]|[8-9]|7[0-9])[0-9]{7}$/;
    return regex.test(phone);
  };

  const checkUniquePhone = async (phone) => {
    const q = query(collection(db, 'workers'), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const addFrame = async (e) => {
    e.preventDefault();
    setFrameError('');

    if (inputText.trim() === '') {
      setFrameError('שם המסגרת לא יכול להיות ריק');
      return;
    }

    if (check === '') {
      setFrameError('יש לבחור אם יש יותר מסניף אחד');
      return;
    }

    if (check === 'true') {
      if (branches.length < 2) {
        setFrameError('צריך להוסיף לפחות שני סניפים');
        return;
      }

      let validBranches = true;
      branches.forEach((branch, branchIndex) => {
        if (branch.branchName.trim() === '') {
          validBranches = false;
          setFrameError('כל השדות חייבים להיות מלאים עבור סניף מרובה');
          return;
        }

        contacts[branchIndex].forEach(async (contact) => {
          if (contact.name.trim() === '' || contact.phone.trim() === '' || contact.email.trim() === '' || contact.role === '') {
            validBranches = false;
            setFrameError('כל השדות של איש הקשר חייבים להיות מלאים');
            return;
          }
          if (!validateEmail(contact.email)) {
            validBranches = false;
            setFrameError('אימייל לא חוקי');
            return;
          }
          if (!validatePhone(contact.phone)) {
            validBranches = false;
            setFrameError('מספר טלפון לא חוקי');
            return;
          }

          const isPhoneUnique = await checkUniquePhone(contact.phone);
          if (!isPhoneUnique) {
            validBranches = false;
            setFrameError('מספר הטלפון חייב להיות ייחודי');
            return;
          }
        });
      });

      if (!validBranches) {
        return;
      }
    }

    if (check === 'false') {
      let validContacts = true;
      for (const branchContacts of contacts) {
        for (const contact of branchContacts) {
          if (contact.name.trim() === '' || contact.phone.trim() === '' || contact.email.trim() === '' || contact.role === '') {
            validContacts = false;
            setFrameError('כל השדות של איש הקשר חייבים להיות מלאים');
            return;
          }
          if (!validateEmail(contact.email)) {
            validContacts = false;
            setFrameError('אימייל לא חוקי');
            return;
          }
          if (!validatePhone(contact.phone)) {
            validContacts = false;
            setFrameError('מספר טלפון לא חוקי');
            return;
          }

          const isPhoneUnique = await checkUniquePhone(contact.phone);
          if (!isPhoneUnique) {
            validContacts = false;
            setFrameError('מספר הטלפון חייב להיות ייחודי');
            return;
          }
        }
      }

      if (!validContacts) {
        return;
      }
    }

    try {
      const q = query(collection(db, 'Framework'), where('name', '==', inputText));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setFrameError('שם המסגרת חייב להיות ייחודי');
        return;
      }

      const frameworkData = {
        name: inputText,
        check: check,
      };

      await addDoc(collection(db, 'Framework'), frameworkData);

      if (check === 'true') {
        for (const [index, branch] of branches.entries()) {
          const branchData = {
            frameWorkName: inputText,
            branchName: branch.branchName,
            branchCity: branch.branchCity,
            contacts: contacts[index].map(contact => contact.phone),
          };
          await addDoc(collection(db, 'branches'), branchData);

          for (const contact of contacts[index]) {
            const workerData = {
              name: contact.name,
              phone: contact.phone,
              email: contact.email,
              role: contact.role === 'אחר' ? contact.customRole : contact.role,
            };
            await addDoc(collection(db, 'workers'), workerData);
          }
        }
      }

      if (check === 'false') {
        const branchData = {
          frameWorkName: inputText,
          branchName: inputText, // Set branchName to the same name as the framework
          branchCity: branches[0].branchCity.trim() !== '' ? branches[0].branchCity : null,
          contacts: contacts[0].map(contact => contact.phone),
        };
        await addDoc(collection(db, 'branches'), branchData);

        for (const contact of contacts[0]) {
          const workerData = {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            role: contact.role === 'אחר' ? contact.customRole : contact.role,
          };
          await addDoc(collection(db, 'workers'), workerData);
        }
      }

      setInputText('');
      setCheck('');
      setBranches([{ branchName: '', branchCity: '' }]);
      setContacts([[]]);

      alert('המסגרת נוספה בהצלחה');
    } catch (error) {
      console.error('Error adding framework:', error);
      alert('אירעה שגיאה בעת הוספת המסגרת. נסה שוב מאוחר יותר.');
    }
  };

  const handleBranchChange = (index, field, value) => {
    const newBranches = [...branches];
    newBranches[index][field] = value;
    setBranches(newBranches);
  };

  const addBranch = () => {
    setBranches([...branches, { branchName: '', branchCity: '' }]);
    setContacts([...contacts, []]);
  };

  const handleContactChange = (branchIndex, contactIndex, field, value) => {
    const newContacts = [...contacts];
    newContacts[branchIndex][contactIndex] = {
      ...newContacts[branchIndex][contactIndex],
      [field]: value,
    };
    setContacts(newContacts);
  };

  const addContact = (branchIndex) => {
    const newContacts = [...contacts];
    newContacts[branchIndex] = [...newContacts[branchIndex], { name: '', phone: '', email: '', role: '', customRole: '' }];
    setContacts(newContacts);
  };

  return (
    <div>
      <div className="form-container" dir="rtl">
        <SearchComponent />
        <div className='home-button-container'>
          <HomeButton />
        </div>
        <h1>הוספת מסגרת מלווה</h1>
        {frameError && (
          <div className="error-container">
            <h3>בעיות מונעות את השמירה</h3>
            <ul>
              <li>{frameError}</li>
            </ul>
          </div>
        )}
        <form className="volunteer-form" onSubmit={addFrame} noValidate>
          <div className="form-group">
            <label htmlFor="nameInput">שם:</label>
            <input
              type="text"
              id="nameInput"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="שם מסגרת מלווה"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="branchesDropdown">יש יותר מסניף אחד?</label>
            <select
              id="branchesDropdown"
              value={check}
              onChange={(e) => setCheck(e.target.value)}
              required
            >
              <option value="">בחר...</option>
              <option value="true">כן</option>
              <option value="false">לא</option>
            </select>
          </div>
          {check === 'true' && (
            <>
              {branches.map((branch, branchIndex) => (
                <div key={branchIndex}>
                  <div className="form-group">
                    <label htmlFor={`branchNameInput${branchIndex}`}>שם הסניף:</label>
                    <input
                      type="text"
                      id={`branchNameInput${branchIndex}`}
                      value={branch.branchName}
                      onChange={(e) => handleBranchChange(branchIndex, 'branchName', e.target.value)}
                      placeholder="שם הסניף"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`branchCityInput${branchIndex}`}>עיר:</label>
                    <input
                      type="text"
                      id={`branchCityInput${branchIndex}`}
                      value={branch.branchCity}
                      onChange={(e) => handleBranchChange(branchIndex, 'branchCity', e.target.value)}
                      placeholder="עיר"
                    />
                  </div>
                  <button type="button" onClick={() => addContact(branchIndex)}>הוסף איש קשר לסניף</button>
                  {contacts[branchIndex].map((contact, contactIndex) => (
                    <div key={contactIndex}>
                      <div className="form-group">
                        <label htmlFor={`contactNameInput${branchIndex}-${contactIndex}`}>שם:</label>
                        <input
                          type="text"
                          id={`contactNameInput${branchIndex}-${contactIndex}`}
                          value={contact.name}
                          onChange={(e) => handleContactChange(branchIndex, contactIndex, 'name', e.target.value)}
                          placeholder="שם איש קשר"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`contactPhoneInput${branchIndex}-${contactIndex}`}>טלפון:</label>
                        <input
                          type="tel"
                          id={`contactPhoneInput${branchIndex}-${contactIndex}`}
                          value={contact.phone}
                          onChange={(e) => handleContactChange(branchIndex, contactIndex, 'phone', e.target.value)}
                          placeholder="מספר טלפון"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`contactEmailInput${branchIndex}-${contactIndex}`}>אימייל:</label>
                        <input
                          type="email"
                          id={`contactEmailInput${branchIndex}-${contactIndex}`}
                          value={contact.email}
                          onChange={(e) => handleContactChange(branchIndex, contactIndex, 'email', e.target.value)}
                          placeholder="כתובת אימייל"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`contactRoleInput${branchIndex}-${contactIndex}`}>תפקיד:</label>
                        <select
                          id={`contactRoleInput${branchIndex}-${contactIndex}`}
                          value={contact.role}
                          onChange={(e) => handleContactChange(branchIndex, contactIndex, 'role', e.target.value)}
                          required
                        >
                          <option value="">בחר...</option>
                          {roles.map((role, index) => (
                            <option key={index} value={role}>{role}</option>
                          ))}
                        </select>
                        {contact.role === 'אחר' && (
                          <input
                            type="text"
                            value={contact.customRole}
                            onChange={(e) => handleContactChange(branchIndex, contactIndex, 'customRole', e.target.value)}
                            placeholder="תפקיד מותאם אישית"
                            required
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" onClick={addBranch}>הוסף סניף</button>
            </>
          )}
          {check === 'false' && (
            <div>
              <div className="form-group">
                <label htmlFor="branchCityInputSingle">עיר:</label>
                <input
                  type="text"
                  id="branchCityInputSingle"
                  value={branches[0].branchCity}
                  onChange={(e) => handleBranchChange(0, 'branchCity', e.target.value)}
                  placeholder="עיר"
                />
              </div>
              <button type="button" onClick={() => addContact(0)}>הוסף איש קשר לסניף</button>
              {contacts[0].map((contact, contactIndex) => (
                <div key={contactIndex}>
                  <div className="form-group">
                    <label htmlFor={`contactNameInput0-${contactIndex}`}>שם:</label>
                    <input
                      type="text"
                      id={`contactNameInput0-${contactIndex}`}
                      value={contact.name}
                      onChange={(e) => handleContactChange(0, contactIndex, 'name', e.target.value)}
                      placeholder="שם איש קשר"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`contactPhoneInput0-${contactIndex}`}>טלפון:</label>
                    <input
                      type="tel"
                      id={`contactPhoneInput0-${contactIndex}`}
                      value={contact.phone}
                      onChange={(e) => handleContactChange(0, contactIndex, 'phone', e.target.value)}
                      placeholder="מספר טלפון"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`contactEmailInput0-${contactIndex}`}>אימייל:</label>
                    <input
                      type="email"
                      id={`contactEmailInput0-${contactIndex}`}
                      value={contact.email}
                      onChange={(e) => handleContactChange(0, contactIndex, 'email', e.target.value)}
                      placeholder="כתובת אימייל"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`contactRoleInput0-${contactIndex}`}>תפקיד:</label>
                    <select
                      id={`contactRoleInput0-${contactIndex}`}
                      value={contact.role}
                      onChange={(e) => handleContactChange(0, contactIndex, 'role', e.target.value)}
                      required
                    >
                      <option value="">בחר...</option>
                      {roles.map((role, index) => (
                        <option key={index} value={role}>{role}</option>
                      ))}
                    </select>
                    {contact.role === 'אחר' && (
                      <input
                        type="text"
                        value={contact.customRole}
                        onChange={(e) => handleContactChange(0, contactIndex, 'customRole', e.target.value)}
                        placeholder="תפקיד מותאם אישית"
                        required
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="submit">שמור</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default CreateFramework;
