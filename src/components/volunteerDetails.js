import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import HomeButton from './HomeButton';
import EditVolunteerModal from './EditVolunteerModal';
import { fetchCities } from './cityService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import languages from './languages';
import profession from './profession';
import './volunteerDetails.css';
import editIcon from './pen.png';

const fetchAble = async () => [
  { value: 'בוקר', label: 'בוקר' },
  { value: 'ערב', label: 'ערב' },
  { value: 'לילה', label: 'לילה' },
];

const VolunteerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableLanguages] = useState(languages);
  const [availableProfession] = useState(profession);
  const [availableAble, setAvailableAble] = useState([]);
  const [generalErrors, setGeneralErrors] = useState([]);

  const fetchVolunteerData = useCallback(async () => {
    try {
      const docRef = doc(db, 'volunteer', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const volunteerData = docSnap.data();
        const { createdAt, birthDate, ...otherData } = volunteerData;

        const volunteerCreatedAt = createdAt ? createdAt.toDate() : null;
        const volunteerBirthDate = birthDate ? birthDate.toDate() : null;

        setVolunteer({
          ...otherData,
          createdAt: volunteerCreatedAt,
          birthDate: volunteerBirthDate,
          documentId: docSnap.id,
        });
      } else {
        console.error('No such document!');
      }
    } catch (error) {
      console.error('Error fetching volunteer details: ', error);
    }
  }, [id]);

  useEffect(() => {
    fetchVolunteerData();
    const fetchCitiesAndAble = async () => {
      try {
        const [cities, able] = await Promise.all([fetchCities(), fetchAble()]);
        setAvailableCities(cities.map(city => ({ value: city, label: city })));
        setAvailableAble(able);
      } catch (error) {
        console.error('Error fetching cities or able:', error);
      }
    };
    fetchCitiesAndAble();
  }, [fetchVolunteerData]);

  const handleSave = async (updatedVolunteer) => {
    try {
      // Reference to the volunteer collection
      const volunteersRef = collection(db, 'volunteer');
      const phoneNumberQuery = query(volunteersRef, where('phoneNumber', '==', updatedVolunteer.phoneNumber));
  
      // Check if the phone number already exists
      const querySnapshot = await getDocs(phoneNumberQuery);
  
      // If phone number exists in a different document
      if (!querySnapshot.empty && querySnapshot.docs[0].id !== id) {
        alert('מספר הטלפון  כבר קיים במערכת  ,אז  לא עודכן ');
        setGeneralErrors(['Phone number already exists in another volunteer record']);
        return;
      }
  
      // Proceed with saving or updating the volunteer record
      const volunteerRef = doc(db, 'volunteer', id);
      const { documentId, createdAt, birthDate, ...dataToUpdate } = updatedVolunteer;
      await updateDoc(volunteerRef, { ...dataToUpdate, createdAt, birthDate });
  
      // Fetch updated volunteer data
      await fetchVolunteerData();
  
      // Close the modal
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating volunteer details:', error);
      setGeneralErrors(['Error updating volunteer details']);
    }
  };
  

  const handleDelete = async () => {
    if (window.confirm('אתה בטוח שברצונך למחוק את המתנדב?')) {
      try {
        const volunteerRef = doc(db, 'volunteer', id);
        await deleteDoc(volunteerRef);
        
        // Navigate to the home page after deletion
        navigate('/home'); // Replace '/' with the appropriate path if necessary
      } catch (error) {
        console.error('Error deleting volunteer:', error);
      }
    }
  };
  

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (!volunteer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="VolunteerDetails-page-container">
      <HomeButton onClick={() => navigate('/search')} />
      <div className="VolunteerDetails-form-container">
        <div className="VolunteerDetails-details-container" style={{ position: 'relative', marginTop: '150px' }}>
          <h1>פרטי המתנדבת</h1>
          <div className="VolunteerDetails-additional-info-container">
            <img
               src={process.env.PUBLIC_URL + '/volunteerDelete.png'}
              alt="Delete"
              className="VolunteerDetails-delete-icon"
              onClick={handleDelete}
            />
            <img
              src={editIcon}
              alt="Edit"
              className="VolunteerDetails-edit-icon"
              onClick={openModal}
            />
          </div>
          
          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>שם פרטי:</label>
              <p>{volunteer.firstname || 'לא זמין'}</p>
            </div>
            <div className="VolunteerDetails-details-group">
              <label>שם משפחה:</label>
              <p>{volunteer.lastname || 'לא זמין'}</p>
            </div>
          </div>

          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>ת.ז.:</label>
              <p>{volunteer.id || 'לא זמין'}</p>
            </div>
            <div className="VolunteerDetails-details-group">
              <label>מספר טלפון:</label>
              <p>{volunteer.phoneNumber || 'לא זמין'}</p>
            </div>
          </div>

          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>פנוי:</label>
              <p>{volunteer.able ? volunteer.able.join(', ') : 'לא זמין'}</p>
            </div>
            <div className="VolunteerDetails-details-group">
              <label>אימייל:</label>
              <p>{volunteer.email || 'לא זמין'}</p>
            </div>
          </div>

          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>עיר:</label>
              <p>{volunteer.city || 'לא זמין'}</p>
            </div>
            <div className="VolunteerDetails-details-group">
              <label>שפות מדוברות:</label>
              <p>{volunteer.languages ? volunteer.languages.join(', ') : 'לא זמין'}</p>
            </div>
          </div>

          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>מקצוע:</label>
              <p>{volunteer.profession ? volunteer.profession.join(', ') : 'לא זמין'}</p>
            </div>
            <div className="VolunteerDetails-details-group">
              <label>דתיות:</label>
              <p>{volunteer.religious ? 'דתי' : 'לא דתי'}</p>
            </div>
          </div>

          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>תאריך לידה:</label>
              <DatePicker
                selected={volunteer.birthDate ? new Date(volunteer.birthDate) : null}
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                showMonthDropdown
                locale="he"
                placeholderText="dd/MM/yyyy"
                className="editable"
                readOnly
              />
            </div>
            <div className="VolunteerDetails-details-group"></div>
          </div>

          <div className="VolunteerDetails-details-row">
            <div className="VolunteerDetails-details-group">
              <label>הערות:</label>
              <p>{volunteer.comments || 'אין הערות'}</p>
            </div>
            <div className="VolunteerDetails-details-group">
              <label>נוצר בתאריך:</label>
              <p>{volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleString() : 'לא זמין'}</p>
            </div>
          </div>

          {isModalOpen && (
            <EditVolunteerModal
              volunteer={volunteer}
              onClose={closeModal}
              onSave={handleSave}
              cities={availableCities}
              languages={availableLanguages}
              profession={availableProfession}
              able={availableAble}
              generalErrors={generalErrors}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default VolunteerDetails;
