import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const allowedEmails = ['esraabetony17@gmail.com', 'admin2@example.com']; // Replace with actual emails
const initialPassword = 'pass123'; // Replace with a secure initial password

// Registration function
export const register = async (email, name) => {
  if (!allowedEmails.includes(email)) {
    throw new Error('Registration is restricted to specific users');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, initialPassword);
    const user = userCredential.user;
    const userRef = doc(db, 'admins', user.uid);
    await setDoc(userRef, {
      name: name,
      email: email,
      phoneNumber: '',
      passwordChanged: false
    });
    console.log('User registered:', user);
  } catch (error) {
    console.error("Error registering user: ", error.message);
    throw new Error(error.message);
  }
};

// Login function
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user);
  } catch (error) {
    console.error("Error logging in user: ", error.message);
    throw new Error(error.message);
  }
};

// Password change function
export const changePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
      const userRef = doc(db, 'admins', user.uid);
      await setDoc(userRef, { passwordChanged: true }, { merge: true });
      console.log('Password changed successfully');
    }
  } catch (error) {
    console.error("Error changing password: ", error.message);
    throw new Error(error.message);
  }
};

// Fetch admin details
export const getAdminDetails = async (uid) => {
  try {
    const userRef = doc(db, 'admins', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('No such document!');
    }
  } catch (error) {
    console.error("Error fetching admin details: ", error.message);
    throw new Error(error.message);
  }
};
