import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import styles from './RecentForms.module.css';
import FormDetailsModal from './FormDetailsModal';
import FormDetailsVolunteer from './FormDetailsVolunteer';
import handleSaveGirlForm from './handleSaveGirlForm';
import handleSaveVolunteerForm from './handleSaveVolunteerForm';
import HomeButton from './HomeButton';
import SearchComponent from './SearchComponent';  // Import the SearchComponent

const RecentForms = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [filter, setFilter] = useState('הכל'); // Default filter is 'הכל'
  const [showFilterOptions, setShowFilterOptions] = useState(false); // Toggle filter options

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const formsCollection = collection(db, 'joinForms');
        const formsSnapshot = await getDocs(formsCollection);
        const formsData = formsSnapshot.docs.map(doc => ({
          DocId: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched Forms:', formsData); // Debugging log
        setForms(formsData);
      } catch (error) {
        console.error('Error fetching forms: ', error);
      }
    };

    fetchForms();
  }, []);

  const handleOpenModal = (form) => {
    setSelectedForm(form);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedForm(null);
  };

  const handleAcceptForm = (form) => {
    setSelectedForm(form);
    setIsWarningOpen(true);
  };

  const handleConfirmAccept = async (accept) => {
    if (accept && selectedForm) {
      try {
        // Handle form save based on form type
        if (selectedForm.formType === 'צעירה') {
          await handleSaveGirlForm(selectedForm);
        } else if (selectedForm.formType === 'מתנדב') {
          await handleSaveVolunteerForm(selectedForm);
        }

        // Update form status in Firestore
        await updateDoc(doc(db, 'joinForms', selectedForm.DocId), {
          accepted: true // Set status to accepted
        });

        console.log('Update successful');

        // Update state to reflect the status change
        setForms(prevForms =>
          prevForms.map(form =>
            form.DocId === selectedForm.DocId ? { ...form, accepted: true } : form
          )
        );

        // Optionally display a success alert or notification here

      } catch (error) {
        console.error('Error updating form status: ', error);
      } finally {
        setIsWarningOpen(false);
        setSelectedForm(null);
      }
    } else {
      // If the user pressed "ביטול", just close the modal and reset
      setIsWarningOpen(false);
      setSelectedForm(null);
    }
  };

  const handleCloseWarning = () => {
    setIsWarningOpen(false);
  };

  // Sort and filter forms based on the selected filter
  const sortedForms = [...forms].sort((a, b) => 
    ((b.createdAt?.seconds || b.created_at?.seconds || 0) - (a.createdAt?.seconds || a.created_at?.seconds || 0))
  );

  const filteredForms = sortedForms.filter(form => {
    console.log('Form Status:', form.accepted); // Debugging log
    if (filter === 'הכל') return true;
    if (filter === 'מאושר') return form.accepted === true;
    if (filter === 'לא מאושר') return form.accepted === false;
    return false;
  });

  console.log('Filtered Forms:', filteredForms); // Debugging log

  return (
    <div className={styles.recentFormsContainer}>
      <div className="header">
        <HomeButton />
      </div>

      <div className={styles.formsContainer}>
        <div className={styles.titleContainer}>
          <h1>טפסים שהתקבלו לאחרונה</h1>
          <div className={styles.iconWrapper}>
            <img
              src={process.env.PUBLIC_URL + '/filter.png'}
              alt="filter"
              className={styles.icon}
              onClick={() => setShowFilterOptions(prev => !prev)}
            />
            <span className={styles.filterLabel}></span> {/* Add a label for filtering */}
            {showFilterOptions && (
              <div className={`${styles.filterOptions} ${styles.show}`}>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <label>
                          <input
                            type="radio"
                            name="filter"
                            checked={filter === 'הכל'}
                            onChange={() => setFilter('הכל')}
                          />
                          הכל
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label>
                          <input
                            type="radio"
                            name="filter"
                            checked={filter === 'מאושר'}
                            onChange={() => setFilter('מאושר')}
                          />
                          מאושר
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label>
                          <input
                            type="radio"
                            name="filter"
                            checked={filter === 'לא מאושר'}
                            onChange={() => setFilter('לא מאושר')}
                          />
                          לא מאושר
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <SearchComponent />  {/* Include the SearchComponent here */}

        {filteredForms.length > 0 ? (
          filteredForms.map(form => (
            <div key={form.DocId} className={styles.formRectangle}>
              <p>
                התקבל ב: {form.createdAt?.seconds 
                  ? new Date(form.createdAt.seconds * 1000).toLocaleString() 
                  : form.created_at?.seconds 
                    ? new Date(form.created_at.seconds * 1000).toLocaleString() 
                    : 'לא זמין'}
              </p>
              <h5>
                {form.formType === 'צעירה' 
                  ? 'טופס פנייה ראשוני-צעירה' 
                  : 'טופס פנייה ראשוני-מתנדבת'}
              </h5>
              <div className={styles.formDetails}>
                {form.formType === 'צעירה' ? (
                  <>
                    <span><b>שם:</b> {form.girlName}</span>
                    <span><b>גיל:</b> {form.age || 'לא זמין'}</span> {/* Display the age */}
                    <span><b>טלפון-צעירה:</b> {form.girlPhone}</span>
                  </>
                ) : (
                  <>
                    <span><b>שם:</b> {form.firstname}</span>
                    <span><b>טלפון-מתנדבת:</b> {form.phoneNumber}</span>
                    <span><b>עיר:</b> {form.city}</span>
                  </>
                )}
              </div>
              <a href="#!" onClick={(e) => { e.preventDefault(); handleOpenModal(form); }}>לחץ כאן לראות את הטופס המלא</a>
              {!form.accepted && (
              <button onClick={() => handleAcceptForm(form)} className={styles.acceptButtonRecentForm}>אישור קבלת טופס</button>              )}
            </div>
          ))
        ) : (
          <p>לא נמצאו טפסים עבור הסינון הנוכחי.</p>
        )}
      </div>

      {isModalOpen && selectedForm && selectedForm.formType === 'מתנדב' && (
        <FormDetailsVolunteer
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          form={selectedForm}
        />
      )}
      {isModalOpen && selectedForm && selectedForm.formType === 'צעירה' && (
        <FormDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          form={selectedForm}
        />
      )}
      {isWarningOpen && (
        <div className={styles.warningOverlay}>
          <div className={styles.warningBox} dir="rtl">
            <p>האם אתה בטוח שברצונך לאשר את הטופס? זה יכול לשנות את הנתונים במערכת.</p>
            <button onClick={() => handleConfirmAccept(true)} className={styles.confirmButton}>אישור</button>
            <button onClick={() => handleConfirmAccept(false)} className={styles.cancelButton}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentForms;
