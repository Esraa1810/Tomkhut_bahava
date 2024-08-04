import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import './Messaging.css';
import HomeButton from './HomeButton';
import Footer from './Footer'; // Import the Footer component
import SearchComponent from './SearchComponent'; // Import the SearchComponent

const Messaging = ({ navigateTo }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAdmins();
    fetchMessages();
  }, []);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins: ', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc')); // Order by timestamp descending
      const querySnapshot = await getDocs(q);
      const allMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMessages);
      setReceivedMessages(allMessages.filter(msg => msg.recipientId === auth.currentUser.uid));
      setSentMessages(allMessages.filter(msg => msg.senderId === auth.currentUser.uid));
      setStarredMessages(allMessages.filter(msg => msg.starred));
    } catch (error) {
      console.error('Error fetching messages: ', error);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      try {
        const sender = auth.currentUser;
        const senderName = sender.displayName || sender.email; // Use email as fallback
        await addDoc(collection(db, 'messages'), {
          senderId: sender.uid,
          senderName: senderName,
          recipientId: selectedRecipient,
          message,
          timestamp: new Date(),
          starred: false
        });
        setMessage('');
        setIsComposing(false);
        notifyAdmin(selectedRecipient, `קיבלת הודעה חדשה מאת ${senderName}`);
        fetchMessages(); // Refresh messages
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const notifyAdmin = async (recipientId, message) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        message,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || auth.currentUser.email, // Add senderName here
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
      fetchMessages();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleDeleteAllMessages = async () => {
    try {
      const batch = writeBatch(db);
      const querySnapshot = await getDocs(collection(db, 'messages'));
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setMessages([]);
      setReceivedMessages([]);
      setSentMessages([]);
      setStarredMessages([]);
      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error('Error deleting all messages:', error);
    }
  };

  const handleStarMessage = async (id, starred) => {
    try {
      await updateDoc(doc(db, 'messages', id), { starred: !starred });
      fetchMessages();
    } catch (error) {
      console.error('Error starring message:', error);
    }
  };
  
  const renderMessages = (messageList) => {
    return messageList
      .filter(msg => msg.message.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((msg, index) => {
        const senderName = msg.senderId === auth.currentUser.uid ? 'You' : admins.find(admin => admin.id === msg.senderId)?.name;
        const recipientName = admins.find(admin => admin.id === msg.recipientId)?.name;
        const timestamp = new Date(msg.timestamp?.seconds * 1000).toLocaleString();
        const messageType = msg.senderId === auth.currentUser.uid ? 'ל' : senderName;
  
        return (
          <div key={index} className={`message ${msg.senderId === auth.currentUser.uid ? 'sent-message' : 'received-message'}`}>
            <div className="message-icons">
              <button className="delete-button" onClick={() => {
                setShowDeleteConfirm(true);
                setMessageToDelete(msg.id);
              }}>🗑️</button>
              <button className="star-button" onClick={() => handleStarMessage(msg.id, msg.starred)}>
                {msg.starred ? '★' : '☆'}
              </button>
            </div>
            <p className="sender-recipient">
              <span><strong>{messageType}:</strong> {recipientName || msg.message}</span>
              <p>{msg.message}</p>

              <span className="timestamp">{timestamp}</span>
            </p>
          </div>
        );
      });
  };
  
  return (
    <div className="messaging-container">
      <div className="header">
        <HomeButton />
      </div>
      <div className="header">
        <input
          type="text"
          placeholder="חפש..."
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="sidebar">
        <button className="compose-button" onClick={() => setIsComposing(true)}>+ לכתוב הודעה חדשה</button>
        <button className="sidebar" onClick={() => setActiveTab('received')}>הודעות שהתקבלו</button>
        <button className="sidebar" onClick={() => setActiveTab('sent')}>הודעות שנשלחו</button>
        <button className="sidebar" onClick={() => setActiveTab('starred')}>הודעות מועדפות </button>
        <button className="delete-all-button" onClick={() => setShowDeleteAllConfirm(true)}>מחק את כל ההודעות</button>
      </div>
      <div className="message-content">
        {activeTab === 'received' && renderMessages(receivedMessages)}
        {activeTab === 'sent' && renderMessages(sentMessages)}
        {activeTab === 'starred' && renderMessages(starredMessages)}
        {isComposing && (
          <div className="compose-window">
            <h3>שלח הודעה חדשה</h3>
            <select value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)}>
              <option value="">נא לבחור</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="כתוב הודעה..."
            />
            <button onClick={handleSendMessage} disabled={!selectedRecipient}>שליחה</button>
            <button onClick={() => setIsComposing(false)}>סגור</button>
          </div>
        )}
        <SearchComponent /> {/* Include SearchComponent here */}
        <div ref={messagesEndRef} />
      </div>
      <Footer /> {/* Add Footer component here */}

      {showDeleteConfirm && (
        <div className="delete-confirm-container">
          <p>האם אתה בטוח שברצונך למחוק הודעה זו?</p>
          <button onClick={() => handleDeleteMessage(messageToDelete)}>כן</button>
          <button onClick={() => setShowDeleteConfirm(false)}>לא</button>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="delete-confirm-container">
          <p>האם אתה בטוח שברצונך למחוק את כל ההודעות?</p>
          <button onClick={handleDeleteAllMessages}>כן</button>
          <button onClick={() => setShowDeleteAllConfirm(false)}>לא</button>
        </div>
      )}
    </div>
  );
};

export default Messaging;
