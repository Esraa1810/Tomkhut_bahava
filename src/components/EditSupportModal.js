import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import "react-datepicker/dist/react-datepicker.css";
import './EditSupportModal.css';
import { doc, updateDoc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the import path as needed
import hospitals from './hospitals';

const EditSupportModal = ({ isOpen, onRequestClose, support, onSave }) => {
  const [updatedSupport, setUpdatedSupport] = useState({
    supportType: '',
    frameWork: '',
    branch: '',
    volunteers: [],
    workers: [],
    startDate: null,
    endDate: null,
    dueDate: null,
    age: '',
    pregnancyNum: '',
    birthNum: '',
    hospital: '',
    additionalDetails: '',
    contactWithWorker: ''
  });

  const [frameworks, setFrameworks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [showBranch, setShowBranch] = useState(false);

  useEffect(() => {
    const fetchFrameworks = async () => {
      const frameworkSnapshot = await getDocs(collection(db, 'Framework'));
      setFrameworks(frameworkSnapshot.docs.map(doc => ({ value: doc.data().name, label: doc.data().name, check: doc.data().check })));
    };

    const fetchVolunteers = async () => {
      const volunteerSnapshot = await getDocs(collection(db, 'volunteer'));
      setVolunteers(volunteerSnapshot.docs.map(doc => {
        const data = doc.data();
        return { value: data.phoneNumber, label: `${data.firstname} - ${data.phoneNumber}` };
      }));
    };

    const fetchWorkers = async () => {
      const workerSnapshot = await getDocs(collection(db, 'workers'));
      setWorkers(workerSnapshot.docs.map(doc => {
        const data = doc.data();
        return { value: data.phone, label: `${data.name} - ${data.phone}` };
      }));
    };

    fetchFrameworks();
    fetchVolunteers();
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (support) {
      setUpdatedSupport({
        supportType: support.supportType || '',
        frameWork: support.frameWork || '',
        branch: support.branch || '',
        volunteers: support.volunteers || [],
        workers: support.workers || [],
        startDate: support.startDate ? new Date(support.startDate.seconds * 1000) : null,
        endDate: support.endDate ? new Date(support.endDate.seconds * 1000) : null,
        dueDate: support.dueDate ? new Date(support.dueDate.seconds * 1000) : null,
        age: support.age || '',
        pregnancyNum: support.pregnancyNum || '',
        birthNum: support.birthNum || '',
        hospital: support.hospital || '',
        additionalDetails: support.additionalDetails || '',
        contactWithWorker: support.contactWithWorker || ''
      });
    }
  }, [support]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedSupport({ ...updatedSupport, [name]: value });
  };

  const handleSelectChange = (selectedOption, { name }) => {
    setUpdatedSupport({ ...updatedSupport, [name]: selectedOption ? selectedOption.map(option => option.value) : [] });
  };

  const handleSingleSelectChange = (selectedOption, { name }) => {
    setUpdatedSupport({ ...updatedSupport, [name]: selectedOption ? selectedOption.value : '' });
  };

  const handleFrameworkChange = async (selectedOption) => {
    const selectedFramework = selectedOption ? selectedOption.value : '';
    const check = selectedOption ? selectedOption.check : 'false';
    setUpdatedSupport({ ...updatedSupport, frameWork: selectedFramework, branch: check === 'true' ? '' : selectedFramework });

    if (check === 'true') {
      const q = query(collection(db, 'branches'), where('frameWorkName', '==', selectedFramework));
      const querySnapshot = await getDocs(q);
      const branchesList = querySnapshot.docs.map(doc => doc.data().branchName);
      setBranchOptions(branchesList.map(branch => ({ value: branch, label: branch })));
      setShowBranch(true);
    } else {
      setShowBranch(false);
    }
  };

  const handleSave = async () => {
    if (support && support.id) {
      try {
        const supportRef = doc(db, 'help_record', support.id);
        const updatedData = {
          ...updatedSupport,
          startDate: updatedSupport.startDate ? Timestamp.fromDate(new Date(updatedSupport.startDate)) : null,
          endDate: updatedSupport.endDate ? Timestamp.fromDate(new Date(updatedSupport.endDate)) : null,
          dueDate: updatedSupport.dueDate ? Timestamp.fromDate(new Date(updatedSupport.dueDate)) : null,
          volunteers: updatedSupport.volunteers,
          workers: updatedSupport.workers,
          frameWork: updatedSupport.frameWork,
          branch: updatedSupport.branch || updatedSupport.frameWork, // Ensure branch is set to frameWork if not specified
          age: parseInt(updatedSupport.age, 10),
        };
        await updateDoc(supportRef, updatedData);
        onSave(updatedData);
        onRequestClose();
      } catch (error) {
        console.error("Error updating document:", error);
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onRequestClose} 
      contentLabel="Edit Support" 
      className="EditSupportModal" 
      overlayClassName="EditSupportModalOverlay"
    >
      <img src="/close.png" alt="Close" className="EditSupportModal-close-icon" onClick={onRequestClose} />
      <h2>עריכת פרטי הליווי</h2>
      <form className="modal-form">
        <div className="form-row">
          <div className="form-group">
            <label>סוג ליווי:</label>
            <input
              type="text"
              name="supportType"
              value={updatedSupport.supportType}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>מסגרת מלווה:</label>
            <Select
              options={frameworks}
              value={frameworks.find(option => option.value === updatedSupport.frameWork)}
              onChange={handleFrameworkChange}
            />
          </div>
        </div>
        {showBranch && (
          <div className="form-row">
            <div className="form-group">
              <label>סניף:</label>
              <Select
                options={branchOptions}
                value={branchOptions.find(option => option.value === updatedSupport.branch)}
                onChange={(selectedOption) => setUpdatedSupport({ ...updatedSupport, branch: selectedOption.value })}
              />
            </div>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>מתנדבים:</label>
            <Select
              isMulti
              options={volunteers}
              value={volunteers.filter(option => updatedSupport.volunteers.includes(option.value))}
              onChange={(selectedOptions) => setUpdatedSupport({ ...updatedSupport, volunteers: selectedOptions ? selectedOptions.map(option => option.value) : [] })}
              name="volunteers"
            />
          </div>
          <div className="form-group">
            <label>אשת מקצוע מלווה:</label>
            <Select
              isMulti
              options={workers}
              value={workers.filter(option => updatedSupport.workers.includes(option.value))}
              onChange={(selectedOptions) => setUpdatedSupport({ ...updatedSupport, workers: selectedOptions ? selectedOptions.map(option => option.value) : [] })}
              name="workers"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>תאריך התחלת ליווי:<span className="required">*</span></label>
            <DatePicker
              selected={updatedSupport.startDate}
              onChange={(date) => setUpdatedSupport({ ...updatedSupport, startDate: date })}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              showMonthDropdown
              locale="he"
              placeholderText="dd/MM/yyyy"
              className="editable"
            />
          </div>
          <div className="form-group">
            <label>תאריך סיום ליווי:<span className="required">*</span></label>
            <DatePicker
              selected={updatedSupport.endDate}
              onChange={(date) => setUpdatedSupport({ ...updatedSupport, endDate: date })}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              showMonthDropdown
              locale="he"
              placeholderText="dd/MM/yyyy"
              className="editable"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>גיל:</label>
            <input
              type="number"
              name="age"
              value={updatedSupport.age}
              onChange={(e) => handleChange(e)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>תאריך לידה משוער:<span className="required">*</span></label>
            <DatePicker
              selected={updatedSupport.dueDate}
              onChange={(date) => setUpdatedSupport({ ...updatedSupport, dueDate: date })}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              showMonthDropdown
              locale="he"
              placeholderText="dd/MM/yyyy"
              className="editable"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>מספר היריון:</label>
            <input
              type="number"
              name="pregnancyNum"
              value={updatedSupport.pregnancyNum}
              onChange={(e) => handleChange(e)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>מספר לידה:</label>
            <input
              type="number"
              name="birthNum"
              value={updatedSupport.birthNum}
              onChange={(e) => handleChange(e)}
              min="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>בית יולדות שבו היא תרצה ללדת:</label>
            <Select
              options={hospitals.map(hospital => ({ value: hospital, label: hospital }))}
              value={{ value: updatedSupport.hospital, label: updatedSupport.hospital }}
              onChange={(selectedOption) => handleSingleSelectChange(selectedOption, { name: 'hospital' })}
            />
          </div>
          <div className="form-group">
            <label>מידע חשוב נוסף שחשוב שנדע על האישה:</label>
            <textarea
              name="additionalDetails"
              value={updatedSupport.additionalDetails}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>
        <div className="form-group">
          <label>האם האישה הפונה פנתה לאשת מקצוע באופן פרטי?</label>
          <textarea
            name="contactWithWorker"
            value={updatedSupport.contactWithWorker}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-actions">
          <button type="button" onClick={handleSave} className="EditSupportModal-save-button">שמור</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSupportModal;
