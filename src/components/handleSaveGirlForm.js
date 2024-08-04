import { collection, query, where, getDocs, addDoc, setDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const handleSaveGirlForm = async (form) => {
  try {
    const branchName = form.branch;
    const frameworkName = form.frameWork;
    let frameworkCreated = false;

    // Check if the branch exists
    const branchesCollection = collection(db, 'branches');
    const branchQuery = query(branchesCollection, where('branchName', '==', branchName));
    const branchSnapshot = await getDocs(branchQuery);

    if (branchSnapshot.empty) {
      // Check if the framework exists
      const frameworkCollection = collection(db, 'Framework');
      const frameworkQuery = query(frameworkCollection, where('name', '==', frameworkName));
      const frameworkSnapshot = await getDocs(frameworkQuery);

      if (!frameworkSnapshot.empty) {
        // Framework exists but branch does not
        if (window.confirm(`הסניף ${branchName} לא מוגדר במסגרת המלווה ${frameworkName}, האם ברצונך להגדיר את הסניף הזה למסגרת המלווה?`)) {
          await addDoc(branchesCollection, {
            branchName,
            frameWorkName: frameworkName,
            contacts: [form.workerPhone]
          });
          alert('The branch has been added to the framework.');
        } else {
          return; // Exit without saving if user does not want to add the branch
        }
      } else {
        // Framework does not exist
        if (window.confirm(`המסגרת המלווה הזו לא נמצאת במערכת, האם ברצונך ליצור אותה?`)) {
          await addDoc(frameworkCollection, {
            name: frameworkName,
            check: false
          });
          await addDoc(branchesCollection, {
            branchName: frameworkName, // Save branchName as frameworkName
            frameWorkName: frameworkName,
            contacts: [form.workerPhone]
          });
          alert('The framework and branch have been added to the system.');
          frameworkCreated = true;
        } else {
          return; // Exit without saving if user does not want to add the framework
        }
      }
    } else {
      // Branch exists, check if the workerPhone is in contacts
      const branchDoc = branchSnapshot.docs[0];
      const branchData = branchDoc.data();
      const contacts = branchData.contacts || []; // Ensure contacts is an array
      if (!contacts.includes(form.workerPhone)) {
        await updateDoc(doc(branchesCollection, branchDoc.id), {
          contacts: arrayUnion(form.workerPhone)
        });
        alert('The worker phone has been added to the branch contacts.');
      }
    }

    // Proceed with saving the girl and worker data
    const girlsCollection = collection(db, 'girls');
    const girlsQuery = query(girlsCollection, where('phoneNumber', '==', form.girlPhone));
    const girlsSnapshot = await getDocs(girlsQuery);

    if (!girlsSnapshot.empty) {
      const girlDoc = girlsSnapshot.docs[0];
      await setDoc(doc(girlsCollection, girlDoc.id), {
        firstName: form.girlName,
        phoneNumber: form.girlPhone,
        languages: form.languages || [],
        girlRole: form.girlRole || '',
        fosterFamily: form.fosterFamily || '',
        city: form.city || ''
      });
      alert('The girl information has been updated.');
    } else {
      const newGirlData = {
        firstName: form.girlName,
        phoneNumber: form.girlPhone,
        languages: form.languages || [],
        girlRole: form.girlRole || '',
        fosterFamily: form.fosterFamily || '',
        city: form.city || ''
      };
      await addDoc(girlsCollection, newGirlData);
      alert('The girl has been added to the system.');
    }

    const workersCollection = collection(db, 'workers');
    const workersQuery = query(workersCollection, where('phone', '==', form.workerPhone));
    const workersSnapshot = await getDocs(workersQuery);

    if (!workersSnapshot.empty) {
      const workerDoc = workersSnapshot.docs[0];
      await setDoc(doc(workersCollection, workerDoc.id), {
        name: form.workerName,
        role: form.workerRole,
        phone: form.workerPhone,
        email: form.workerEmail
      });
      alert('The worker information has been updated.');
    } else {
      const newWorkerData = {
        name: form.workerName,
        role: form.workerRole,
        phone: form.workerPhone,
        email: form.workerEmail
      };
      await addDoc(workersCollection, newWorkerData);
      alert('The worker has been added to the system.');
    }

    const helpRecordCollection = collection(db, 'help_record');
    const supportsType = form.supportsType || [];
    const branchOrFrameworkName = frameworkCreated ? frameworkName : branchName;

    for (const supportType of supportsType) {
      const newHelpRecord = {
        girlPhone: form.girlPhone,
        supportType,
        workers: arrayUnion(form.workerPhone), // Save worker phone in array field called "workers"
        branch: branchOrFrameworkName, // Save framework name if it was created, otherwise save branch name
        frameWork: frameworkName, // Always save the framework name
        dueDate: form.dueDate || '',
        hospital: form.hospital || '',
        pregnancyNum: form.pregnancyNum || '',
        birthNum: form.birthNum || '',
        startDate: form.startDate || '',
        additionalDetails: form.additionalDetails || '',
        contactWithWorker: form.contactWithWorker || '',
        age: form.age || '' // Save age in help_record
      };
      await addDoc(helpRecordCollection, newHelpRecord);
    }

    alert('Help records have been created.');
  } catch (error) {
    console.error('Error location:', error.stack); // Log the stack trace for better debugging
    console.error('Error saving girl or worker data:', error);
    alert('Error saving girl or worker data: ' + error.message);
  }
};

export default handleSaveGirlForm;
