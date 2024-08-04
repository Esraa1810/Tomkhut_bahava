import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Documentation.css';

const Documentation = ({ girlPhoneNumber }) => {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docsRef = collection(db, 'documentation');
        const q = query(docsRef, where('girlPhoneNumber', '==', girlPhoneNumber));
        const querySnapshot = await getDocs(q);
        const docList = await Promise.all(querySnapshot.docs.map(async docSnapshot => {
          const docData = docSnapshot.data();

          // Fetch admin names
          const mentionToAdminNames = await Promise.all((docData.mentionToAdmin || []).map(async adminId => {
            const adminDoc = await getDoc(doc(db, 'admins', adminId));
            return adminDoc.exists() ? adminDoc.data().name : 'Unknown Admin';
          }));

          return { id: docSnapshot.id, ...docData, mentionToAdminNames };
        }));

        // Sort by date, from most recent to oldest
        docList.sort((a, b) => b.date.seconds - a.date.seconds);

        setDocs(docList);
      } catch (error) {
        console.error('Error fetching documents: ', error);
      }
    };

    fetchDocs();
  }, [girlPhoneNumber]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך למחוק פניה זו?');
    if (!confirmDelete) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'documentation', id));
      setDocs(docs.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
  };

  return (
    <div className="documentation-container">
      {docs.length > 0 ? (
        docs.map(doc => (
          <div key={doc.id} className="documentation-box">
            <div className="doc-header">
              <img 
                src="/delete.png" 
                alt="Delete" 
                className="delete-icon" 
                onClick={() => handleDelete(doc.id)} 
              />
              <div className="doc-date">{new Date(doc.date.seconds * 1000).toLocaleDateString('en-GB')}</div>
            </div>
            <div className="doc-content">
              <div className="doc-item">
                <span className="doc-label">תיוג מנהל:</span>
                <span className="doc-value">{doc.mentionToAdminNames.join(', ')}</span>
              </div>
              <div className="doc-item">
                <span className="doc-label">תוכן הפניה:</span>
                <br/>
                <span className="doc-value">{doc.text}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>אין פניות להצגה</p>
      )}
    </div>
  );
};

export default Documentation;
