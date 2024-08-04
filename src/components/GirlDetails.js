import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { fetchCities } from './cityService';
import AddSupportModal from './AddSupportModal';
import EditGirlModal from './EditGirlModal';
import AddDocumentation from './AddDocumentation';
import Documentation from './Documentation';
import ViewAllSupports from './ViewAllSupports'; // Import the new component
import './GirlDetails.css';
import editIcon from './pen.png';
import styles from './RecentForms.module.css';

import HomeButton from './HomeButton';
import SearchComponent from './SearchComponent';
import ActiveSupportList from './ActiveSupportList';
import ViewFiles from './ViewFiles';

const GirlDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [girl, setGirl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedGirl, setUpdatedGirl] = useState({});
  const [girlDocId, setGirlDocId] = useState(null);
  const [errors, setErrors] = useState({});
  const [generalErrors, setGeneralErrors] = useState([]);
  const [cities, setCities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);
  const [supportData, setSupportData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [activeSupportIndex, setActiveSupportIndex] = useState(0);
  const [isSupportDetailsVisible, setIsSupportDetailsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('פרטי הצעירה'); // State to manage active tab

  useEffect(() => {
    const fetchGirl = async () => {
      try {
        const girlDoc = await getDoc(doc(db, 'girls', id));
        if (girlDoc.exists()) {
          const girlData = girlDoc.data();
          setGirl(girlData);
          setUpdatedGirl({
            ...girlData,
            birthDate: girlData.birthDate?.seconds
              ? new Date(girlData.birthDate.seconds * 1000).toISOString().split('T')[0]
              : ''
          });
          setGirlDocId(girlDoc.id);
          fetchSupportData(girlData.phoneNumber);
        } else {
          console.error('No document found for the given ID');
        }
      } catch (error) {
        console.error('Error fetching girl details: ', error);
      }
    };

    const loadCities = async () => {
      const citiesList = await fetchCities();
      setCities(citiesList);
    };

    const fetchBranches = async () => {
      try {
        const branchesRef = collection(db, 'branches');
        const branchesSnapshot = await getDocs(branchesRef);
        setBranches(branchesSnapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error('Error fetching branches: ', error);
      }
    };

    const fetchVolunteers = async () => {
      try {
        const volunteersRef = collection(db, 'volunteer');
        const volunteersSnapshot = await getDocs(volunteersRef);
        setVolunteers(volunteersSnapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error('Error fetching volunteers: ', error);
      }
    };

    const fetchWorkers = async () => {
      try {
        const workersRef = collection(db, 'workers');
        const workersSnapshot = await getDocs(workersRef);
        setWorkers(workersSnapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error('Error fetching workers: ', error);
      }
    };

    const fetchSupportData = async (phoneNumber) => {
      try {
        const helpRecordRef = collection(db, 'help_record');
        const q = query(helpRecordRef, where('girlPhone', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const supports = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const startDate = data.startDate?.seconds ? new Date(data.startDate.seconds * 1000) : null;
          const endDate = data.endDate?.seconds ? new Date(data.endDate.seconds * 1000) : null;

          const isActive = (startDate <= today && (!endDate || today <= endDate));

          return { id: doc.id, ...data, isActive };
        });

        setSupportData(supports);
      } catch (error) {
        console.error('Error fetching support data: ', error);
      }
    };

    fetchGirl();
    loadCities();
    fetchBranches();
    fetchVolunteers();
    fetchWorkers();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedGirl({ ...updatedGirl, [name]: value });
  };

  const validateFields = async () => {
    let fieldErrors = {};
    let generalErrors = [];

    if (!updatedGirl.firstName) fieldErrors.firstName = true;
    if (!updatedGirl.lastName) fieldErrors.lastName = true;
    if (!updatedGirl.phoneNumber) {
      fieldErrors.phoneNumber = true;
    } else {
      try {
        const girlsRef = collection(db, 'girls');
        const q = query(girlsRef, where('phoneNumber', '==', updatedGirl.phoneNumber));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== girlDocId) {
          fieldErrors.phoneNumber = true;
          generalErrors.push('מספר טלפון זה כבר קיים במערכת');
        }
      } catch (error) {
        generalErrors.push('אירעה שגיאה בבדיקת מספר הטלפון במערכת');
        console.error('Error checking phone number: ', error);
      }
    }
    if (!updatedGirl.city) fieldErrors.city = true;

    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      if (fieldErrors.firstName) generalErrors.push('חובה להזין שם פרטי');
      if (fieldErrors.lastName) generalErrors.push('חובה להזין שם משפחה');
      if (fieldErrors.phoneNumber && !generalErrors.includes('מספר טלפון זה כבר קיים במערכת')) generalErrors.push('חובה להזין מספר טלפון');
      if (fieldErrors.city) generalErrors.push('חובה להזין עיר');
      setGeneralErrors(generalErrors);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!(await validateFields())) {
      return;
    }

    if (!girlDocId) {
      console.error('No document ID found for this girl');
      return;
    }

    try {
      const girlDoc = doc(db, 'girls', girlDocId);
      await updateDoc(girlDoc, {
        ...updatedGirl,
        birthDate: updatedGirl.birthDate ? new Date(updatedGirl.birthDate) : null
      });

      if (updatedGirl.phoneNumber !== girl.phoneNumber) {
        const helpRecordRef = collection(db, 'help_record');
        const q = query(helpRecordRef, where('girlPhone', '==', girl.phoneNumber));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (helpRecordDoc) => {
          await updateDoc(helpRecordDoc.ref, {
            girlPhone: updatedGirl.phoneNumber
          });
        });
      }

      setGirl(updatedGirl);
      setIsEditing(false);
      setErrors({});
      setGeneralErrors([]);
      console.log('Document successfully updated:', updatedGirl);
    } catch (error) {
      console.error('Error updating girl details: ', error);
    }
  };

  const handleAddSupport = async (support) => {
    try {
      if (!girlDocId) {
        console.error('No document ID found for this girl');
        return;
      }

      console.log('Support Data being added:', support);

      const helpRecordRef = collection(db, 'help_record');
      const supportDocRef = await addDoc(helpRecordRef, {
        girlPhone: girl.phoneNumber,
        ...support
      });

      setSupportData([...supportData, { ...support, id: supportDocRef.id }]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding support: ', error);
    }
  };

  const handleDeleteSupport = async (supportId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this support?');
    if (!confirmDelete) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'help_record', supportId));
      setSupportData(supportData.filter(support => support.id !== supportId));
    } catch (error) {
      console.error('Error deleting support: ', error);
    }
  };

  const handleDeleteGirl = async () => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך למחוק את הצעירה מהמערכת?');
    if (!confirmDelete) {
      return;
    }

    try {
      // Delete girl from "girls" collection
      await deleteDoc(doc(db, 'girls', id));

      // Delete girl's supports from "help_record" collection
      const helpRecordQuery = query(collection(db, 'help_record'), where('girlPhone', '==', girl.phoneNumber));
      const helpRecordSnapshot = await getDocs(helpRecordQuery);
      helpRecordSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Delete girl's documentation from "documentation" collection
      const documentationQuery = query(collection(db, 'documentation'), where('girlPhoneNumber', '==', girl.phoneNumber));
      const documentationSnapshot = await getDocs(documentationQuery);
      documentationSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      alert('הצעירה נמחקה בהצלחה מהמערכת.');
      navigate('/home'); // Redirect to home page or another appropriate page
    } catch (error) {
      console.error('Error deleting girl: ', error);
      alert('שגיאה במחיקת הצעירה מהמערכת.');
    }
  };

  const handleEditSupport = (supportId) => {
    // Handle the logic to open the edit modal and populate it with the support data
    // Implement the functionality as needed
  };

  const toggleAdditionalInfo = () => {
    document.querySelector('.GirlDetails-additional-info').classList.toggle('hidden');
  };

  const toggleSupportDetailsVisibility = () => {
    setIsSupportDetailsVisible(!isSupportDetailsVisible);
  };

  if (!girl) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <HomeButton />

      <div className="GirlDetails-form-container" dir="rtl">
        <SearchComponent />

        <div className="tabs-and-container">
          <div className="GirlDetails-tabs-container">
            <button
              className={`tab-button ${activeTab === 'פרטי הצעירה' ? 'active' : ''}`}
              onClick={() => setActiveTab('פרטי הצעירה')}
            >
              פרטי הצעירה
            </button>
            <button
              className={`tab-button ${activeTab === 'קבצים' ? 'active' : ''}`}
              onClick={() => setActiveTab('קבצים')}
            >
              קבצים
            </button>
            <button
              className={`tab-button ${activeTab === 'כל הליווים' ? 'active' : ''}`}
              onClick={() => setActiveTab('כל הליווים')}
            >
              כל הליווים
            </button>
          </div>

          <div className="GirlDetails-details-container" style={{ position: 'relative' }}>
            {activeTab === 'פרטי הצעירה' && (
              <>
                <div className="GirlDetails-additional-info-container" onClick={toggleAdditionalInfo}>
                  <img
                    src={editIcon}
                    alt="Edit"
                    className="GirlDetails-edit-icon"
                    onClick={() => setIsEditing(true)}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/volunteerDelete.png`} // Add delete icon
                    alt="Delete"
                    className="GirlDetails-delete-icon"
                    onClick={handleDeleteGirl} // Add click handler
                  />
                  <img src={`${process.env.PUBLIC_URL}/angle-down.png`} alt="Toggle" className="GirlDetails-toggle-icon" />
                </div>
                <EditGirlModal
                  isOpen={isEditing}
                  onRequestClose={() => setIsEditing(false)}
                  girl={updatedGirl}
                  onChange={handleChange}
                  onSave={handleSave}
                  cities={cities}
                  errors={errors}
                  generalErrors={generalErrors}
                />
                <br />
                <div className="GirlDetails-details-row">
                  <div className={`GirlDetails-details-group ${errors.firstName ? 'error' : ''}`}>
                    <label>שם פרטי:</label>
                    <p>{girl.firstName}</p>
                  </div>
                  <div className={`GirlDetails-details-group ${errors.lastName ? 'error' : ''}`}>
                    <label>שם משפחה:</label>
                    <p>{girl.lastName}</p>
                  </div>
                </div>
                <div className="GirlDetails-details-row">
                  <div className={`GirlDetails-details-group ${errors.phoneNumber ? 'error' : ''}`}>
                    <label>מספר טלפון:</label>
                    <p>{girl.phoneNumber}</p>
                  </div>
                  <div className={`GirlDetails-details-group ${errors.city ? 'error' : ''}`}>
                    <label>עיר:</label>
                    <p>{girl.city}</p>
                  </div>
                </div>

                <div className="GirlDetails-additional-info hidden">
                  <div className="GirlDetails-details-row">
                    <div className={`GirlDetails-details-group ${errors.languages ? 'error' : ''}`}>
                      <label>שפות מדוברות:</label>
                      <p>{girl.languages && girl.languages.join(', ')}</p>
                    </div>
                    <div className={`GirlDetails-details-group ${errors.fosterFamily ? 'error' : ''}`}>
                      <label>האם הצעירה אומצה בילדותה?</label>
                      <p>{girl.fosterFamily}</p>
                    </div>
                  </div>
                  <div className="GirlDetails-details-row">
                    <div className={`GirlDetails-details-group ${errors.details ? 'error' : ''}`}>
                      <label>הערות:</label>
                      <p>{girl.details}</p>
                    </div>
                  </div>
                </div>
                <div className="GirlDetails-additional-info-container">
                  <img src="/add.png" alt="Add" className="GirlDetails-add-icon" onClick={() => setIsModalOpen(true)} />
                  <h2>ליווים פעילים</h2>
                  <img src="/angle-down.png" alt="Toggle" className="GirlDetails-toggle-icon" onClick={toggleSupportDetailsVisibility} />
                </div>
                <ActiveSupportList
                  supportData={supportData}
                  activeSupportIndex={activeSupportIndex}
                  setActiveSupportIndex={setActiveSupportIndex}
                  handleDeleteSupport={handleDeleteSupport}
                  handleEditSupport={handleEditSupport}
                  isSupportDetailsVisible={isSupportDetailsVisible}
                  toggleSupportDetailsVisibility={toggleSupportDetailsVisibility}
                />
                <div className="GirlDetails-additional-info-container">
                  <img src="/add.png" alt="Add" className="GirlDetails-add-icon" onClick={() => setIsDocumentationModalOpen(true)} />
                  <h2>תיעוד פניות</h2>
                  <img src="/angle-down.png" alt="Toggle" className="GirlDetails-toggle-icon" />
                </div>
                <Documentation girlPhoneNumber={girl.phoneNumber} />
              </>
            )}

            {activeTab === 'קבצים' && (
              <ViewFiles girlPhoneNumber={girl.phoneNumber} />
            )}

            {activeTab === 'כל הליווים' && (
              <ViewAllSupports supportData={supportData} handleDeleteSupport={handleDeleteSupport} />
            )}
          </div>
        </div>

        <AddDocumentation
          isOpen={isDocumentationModalOpen}
          onRequestClose={() => setIsDocumentationModalOpen(false)}
          girlPhoneNumber={girl.phoneNumber}
        />
        <AddSupportModal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          onSave={handleAddSupport}
          branches={branches}
          volunteers={volunteers}
          workers={workers}
        />
      </div>
    </>
  );
};

export default GirlDetails;
