import React from 'react';
import styles from './FormDetailsModal.module.css';

const FormDetailsModal = ({ isOpen, onClose, form }) => {
  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} dir="rtl">
        <h2>פרטי הטופס</h2>
        <div className={styles.detailsContent}>
          <table className={styles.detailsTable}>
            <tbody>
              <tr>
                <th>שם המסגרת המפנה</th>
                <td>{form.frameWork || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>
                  שם הסניף של המסגרת המלווה (אם יש)
                  <br />
                  <span className={styles.note}>אם רשום "אחר" ז"א שאין יותר מסניף אחד או שהמשתמש רשם "אחר"</span>
                </th>
                <td>
                  {form.branch || 'לא זמין'}
                </td>
              </tr>
              <tr>
                <th>שם אשת הקשר מהמסגרת המלווה</th>
                <td>{form.workerName || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>תפקיד אשת קשר</th>
                <td>{form.workerRole || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מספר טלפון של אשת הקשר</th>
                <td>{form.workerPhone || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מייל של אשת הקשר</th>
                <td>{form.workerEmail || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>שם הצעירה</th>
                <td>{form.girlName || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מספר טלפון של הצעירה</th>
                <td>{form.girlPhone || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>שפות</th>
                <td>{form.languages ? form.languages.join(', ') : 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מעמד-צעירה</th>
                <td>{form.girlRole || ' '}</td>
              </tr>
              <tr>
                <th>גיל הצעירה</th>
                <td>{form.age || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>הצעירה אומצה בילדותה?</th>
                <td>{form.fosterFamily || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>תאריך לידה משוער של הצעירה</th>
                <td>{form.dueDate ? formatDate(form.dueDate) : 'לא זמין'}</td>
              </tr>
              <tr>
                <th>בית יולדות שבו היא תרצה ללדת</th>
                <td>{form.hospital || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מספר היריון</th>
                <td>{form.pregnancyNum || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מספר לידה</th>
                <td>{form.birthNum || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>עיר מגורים-צעירה</th>
                <td>{form.city || 'לא זמין'}</td>
              </tr>
              <tr>
                <th>ליווים</th>
                <td>{form.supportsType ? form.supportsType.join(', ') : 'לא זמין'}</td>
              </tr>
              <tr>
                <th>תאריך תחילת ליווי</th>
                <td>{form.startDate ? formatDate(form.startDate) : 'לא זמין'}</td>
              </tr>
              <tr>
                <th>מידע חשוב נוסף שחשוב שנדע על הצעירה</th>
                <td>{form.additionalDetails || ' '}</td>
              </tr>
              <tr>
                <th>האם האישה הפונה פנתה לאשת מקצוע באופן פרטי? ואם כן לאיזה סוג ליווי?</th>
                <td>{form.contactWithWorker || 'לא זמין'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={onClose} className={styles.closeButton}>סגור</button>
      </div>
    </div>
  );
};

export default FormDetailsModal;
