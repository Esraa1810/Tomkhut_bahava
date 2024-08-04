import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const handleSaveVolunteerForm = async (form) => {
  try {
    const phoneNumber = form.phoneNumber;

    // Check if the phone number exists in the volunteer collection
    const volunteerCollection = collection(db, 'volunteer');
    const volunteerQuery = query(volunteerCollection, where('phoneNumber', '==', phoneNumber));
    const volunteerSnapshot = await getDocs(volunteerQuery);

    console.log('Volunteer snapshot:', volunteerSnapshot.docs);

    if (!volunteerSnapshot.empty) {
      // Phone number found in the volunteer collection, update the existing document
      const volunteerDoc = volunteerSnapshot.docs[0];
      const volunteerDocRef = doc(volunteerCollection, volunteerDoc.id);

      await setDoc(volunteerDocRef, {
        ...form,
        createdAt: volunteerDoc.data().createdAt || Timestamp.fromDate(new Date()), // Add or keep existing createdAt timestamp
      }, { merge: true });

      alert('המתנדבת כבר במערכת, את בטוחה לעדכן המידע שלה ?');
    } else {
      // Phone number not found in the volunteer collection, create a new document
      const newVolunteerData = {
        ...form,
        createdAt: Timestamp.fromDate(new Date()), // Add createdAt timestamp for new document
      };

      await addDoc(volunteerCollection, newVolunteerData);
      alert('מידע המתנדבת עודכן בהצלחה!');
    }

    // Check if the phone number exists in the phoneNumber collection
    const phoneNumberCollection = collection(db, 'phoneNumber');
    const phoneNumberQuery = query(phoneNumberCollection, where('phoneNumber', '==', phoneNumber));
    const phoneNumberSnapshot = await getDocs(phoneNumberQuery);

    console.log('PhoneNumber snapshot:', phoneNumberSnapshot.docs);

    if (phoneNumberSnapshot.empty) {
      // Add new phone number document if not exists
      await addDoc(phoneNumberCollection, {
        phoneNumber,
        contacts: [form.phoneNumber]
      });
      // alert('The phone number has been added to the framework.');
    } else {
      const phoneNumberDoc = phoneNumberSnapshot.docs[0];
      const phoneNumberDocRef = doc(phoneNumberCollection, phoneNumberDoc.id);

      await updateDoc(phoneNumberDocRef, {
        contacts: arrayUnion(form.phoneNumber)
      });
      alert('The phone number has been updated with new contact.');
    }
  } catch (error) {
    console.error('Error saving volunteer data:', error);
    alert('Error saving volunteer data. Please try again.');
  }
};

export default handleSaveVolunteerForm;
