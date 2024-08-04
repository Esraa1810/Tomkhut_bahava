import React, { useState, useEffect } from 'react';
import './ViewFiles.css';
import FileUploader from './FileUploader'; // Import the FileUploader component
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ViewFiles = ({ girlPhoneNumber }) => {
  const [isFileUploaderOpen, setIsFileUploaderOpen] = useState(false);
  const [isFilesVisible, setIsFilesVisible] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (girlPhoneNumber) {
      fetchUploadedFiles();
    }
  }, [girlPhoneNumber]);

  const fetchUploadedFiles = async () => {
    const filesSnapshot = await getDocs(
      query(collection(db, 'documents'), where('girlPhoneNumber', '==', girlPhoneNumber))
    );
    const filesList = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUploadedFiles(filesList);
  };

  const toggleFileUploaderVisibility = () => setIsFileUploaderOpen(!isFileUploaderOpen);
  const toggleFilesVisibility = () => setIsFilesVisible(!isFilesVisible);

  const handleFileUploadSuccess = (file) => {
    setUploadedFiles([...uploadedFiles, file]);
    toggleFileUploaderVisibility();
  };

  const handleDownloadFile = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank'; // Open in a new tab
    link.rel = 'noopener noreferrer'; // Security measure
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000); // Hide the success message after 3 seconds
  };
  

  const handleDeleteFile = async (id, name) => {
    await deleteDoc(doc(db, 'documents', id));
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  return (
    <div className="view-files-container">
      <div className="GirlDetails-additional-info-container">
        <img src="/add.png" alt="Add" className="GirlDetails-add-icon" onClick={toggleFileUploaderVisibility} />
        <h2>קבצים</h2>
        <img src="/angle-down.png" alt="Toggle" className="GirlDetails-toggle-icon" onClick={toggleFilesVisibility} />
      </div>
      {isFileUploaderOpen && (
        <FileUploader
          girlPhoneNumber={girlPhoneNumber}
          onClose={toggleFileUploaderVisibility}
          onSave={handleFileUploadSuccess}
        />
      )}
      {isFilesVisible && (
        <div className="file-list">
          <h3>קבצים שהועלו</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index} className="file-item">
                <div className="file-info">
                  <span>{file.name}</span>
                  <div className="file-actions">
                    <img
                      src="/show.png"
                      alt="Show"
                      onClick={() => setFilePreviewUrl(file.url)}
                    />
                    <img
                      src="/download.png"
                      alt="Download"
                      onClick={() => handleDownloadFile(file.url, file.name)}
                    />
                    <img
                      src="/trash.png"
                      alt="Delete"
                      onClick={() => handleDeleteFile(file.id, file.name)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {downloadSuccess && (
        <div className="download-success-popup">
          הקובץ הורד בהצלחה!
        </div>
      )}
      {filePreviewUrl && (
        <div className="file-preview">
          <h3>תצוגה מקדימה של קובץ</h3>
          <iframe src={filePreviewUrl} title="File Preview" />
          <button onClick={() => setFilePreviewUrl(null)}>סגור תצוגה מקדימה</button>
        </div>
      )}
    </div>
  );
};

export default ViewFiles;
