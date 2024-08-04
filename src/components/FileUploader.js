import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { storage, db } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import './FileUploader.css';

const FileUploader = ({ girlPhoneNumber, onClose, onSave }) => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileTypesAllowed] = useState(['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUploadedFiles();
      } else {
        setCurrentUser(null);
        alert("Please log in to upload files");
      }
    });
  }, []);

  const fetchUploadedFiles = async () => {
    const filesSnapshot = await getDocs(collection(db, 'documents'));
    const filesList = filesSnapshot.docs.map(doc => doc.data());
    setUploadedFiles(filesList);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => fileTypesAllowed.includes(file.type));

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were not allowed. Only JPEG, PNG, PDF, and Word files are accepted.');
    } else {
      setError(null);
    }

    setFiles(validFiles);
  };

  const handleUpload = () => {
    if (!currentUser) {
      alert("Please log in to upload files");
      return;
    }

    files.forEach((file) => {
      const storageRef = ref(storage, `documents/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        },
        (error) => {
          setError('Error uploading file: ' + error.message);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const docRef = await addDoc(collection(db, 'documents'), {
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadURL,
            girlPhoneNumber: girlPhoneNumber // Link the file to the girl's phone number
          });
          setFiles([]);
          fetchUploadedFiles();
          onSave({ ...file, id: docRef.id, url: downloadURL });
        }
      );
    });
  };

  return (
    <div className="file-uploader-modal">
      <div className="file-uploader-content">
        <h2>העלה קבצים</h2>
        <input type="file" multiple onChange={handleFileChange} />
        <p>סוגים מותרים: JPEG, PNG, PDF, Word</p>
        <button onClick={handleUpload}>העלה</button>
        <button onClick={onClose}>ביטול</button>
        {error && <p className="error">{error}</p>}
        <div className="upload-progress">
          {files.map((file) => (
            <div key={file.name}>
              <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${uploadProgress[file.name] || 0}%` }}></div>
              </div>
              <span>{uploadProgress[file.name] ? `${Math.round(uploadProgress[file.name])}%` : '0%'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
