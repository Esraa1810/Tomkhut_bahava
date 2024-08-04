import React from 'react';
import styles from './FormDetailsModal.module.css';

const FormDetailsVolunteer = ({ isOpen, onClose, form }) => {
  if (!isOpen) return null;

  const religiousStatus = form.religious ? 'דתי' : 'לא דתי';
  const availableTimes = form.able ? form.able.join(', ') : 'לא זמין'; // Updated to join array directly

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} dir="rtl">
        <h2>פרטי הטופס</h2>
        <div className={styles.detailsContent}>
          <table className={styles.detailsTable}>
            <tbody>
              <tr>
                <th>שם  המתנדבת</th>
                <td>{form.firstname || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>שם משפחה</th>
                <td>{form.lastname || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מספר טלפון</th>
                <td>{form.phoneNumber || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מספר תעודת זהות</th>
                <td>{form.id || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מייל</th>
                <td>{form.email || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>שפות מדוברות</th>
                <td>{form.languages ? form.languages.join(', ') : 'לא זמין'}</td>
              </tr>
              
              <tr>
                <th>האם דתי?</th>
                <td>{religiousStatus}</td>
              </tr>
              <tr>
                <th>עיר מגורים-צעירה</th>
                <td>{form.city || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>זמני זמינות</th>
                <td>{availableTimes}</td>
              </tr>
              <tr>
                <th>הערות</th>
                <td>{form.comments || ' '}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={onClose} className={styles.closeButton}>סגור</button>
      </div>
    </div>
  );
};

export default FormDetailsVolunteer;
