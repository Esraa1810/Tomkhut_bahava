import React, { useState } from 'react';
import Select from 'react-select';
import './EditDocumentation.css';

const EditDocumentation = ({ doc, onSave, onCancel, onMentionChange, admins, onMention }) => {
  const [content, setContent] = useState(doc);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContent({
      ...content,
      [name]: value
    });
  };

  const handleSave = () => {
    onSave(content);
    if (content.mention) {
      onMention(content.mention); // Send notification when saving if mention exists
    }
  };

  const adminOptions = admins.map(admin => ({ value: admin.id, label: admin.name }));

  const handleMentionChange = (selectedOption) => {
    if (selectedOption) {
      const mentionedAdmin = admins.find(admin => admin.id === selectedOption.value);
      if (mentionedAdmin) {
        setContent(prevContent => ({
          ...prevContent,
          mention: mentionedAdmin.id,
          to: mentionedAdmin.name // Update the "to" field with the admin's name
        }));
      }
    }
  };

  return (
    <div className="edit-documentation">
      <div className="edit-window">
        <h2>ערוך עדכון</h2>
        <div className="edit-content">
          <label>מאת:</label>
          <input type="text" name="from" value={content.from} onChange={handleChange} />
          <label>ל:</label>
          <input type="text" name="to" value={content.to} onChange={handleChange} />
          <label>תיוג צוות:</label>
          <input type="text" name="teamCoordination" value={content.teamCoordination} onChange={handleChange} />
          <label>תיוג אשת מקצוע:</label>
          <input type="text" name="professionalNetworkCoordination" value={content.professionalNetworkCoordination} onChange={handleChange} />
          <label>תיוג מסגרת מלווה:</label>
          <input type="text" name="logicalCoordination" value={content.logicalCoordination} onChange={handleChange} />
          <label>תיוג אשת קשר במסגרת מלווה:</label>
          <input type="text" name="contactCoordination" value={content.contactCoordination} onChange={handleChange} />
          <label>טקסט:</label>
          <input type="text" name="text" value={content.text} onChange={handleChange} />
          <label>אזכור:</label>
          <Select
            options={adminOptions}
            name="mention"
            value={adminOptions.find(option => option.value === content.mention)}
            onChange={handleMentionChange}
          />
        </div>
        <div className="edit-actions">
          <button className="save-button" onClick={handleSave}>שמירה</button>
          <button className="cancel-button" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
};

export default EditDocumentation;
