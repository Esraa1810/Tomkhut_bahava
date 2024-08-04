import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const addDocument = async (collectionName, document) => {
  try {
    console.log('Adding document to Firestore:', document); // Debugging
    await addDoc(collection(db, collectionName), document);
    console.log('Document added successfully');
  } catch (e) {
    console.error("Error adding document: ", e.message);
  }
};

const getDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    let documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    console.log('Fetched documents:', documents); // Debugging
    return documents;
  } catch (e) {
    console.error("Error getting documents: ", e.message);
    return [];
  }
};

const updateDocument = async (collectionName, docId, updatedDocument) => {
  try {
    const documentRef = doc(db, collectionName, docId);
    await updateDoc(documentRef, updatedDocument);
  } catch (e) {
    console.error("Error updating document: ", e.message);
  }
};

const deleteDocument = async (collectionName, docId) => {
  try {
    const documentRef = doc(db, collectionName, docId);
    await deleteDoc(documentRef);
  } catch (e) {
    console.error("Error deleting document: ", e.message);
  }
};

export { addDocument, getDocuments, updateDocument, deleteDocument };
