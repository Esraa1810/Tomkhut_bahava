import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './Messaging.css';

const Messaging = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAdmins();
    fetchAllMessages();
  }, []);

  useEffect(() => {
    if (selectedRecipient) {
      const q = query(
        collection(db, 'messages'),
        where('senderId', 'in', [auth.currentUser.uid, selectedRecipient]),
        where('recipientId', 'in', [auth.currentUser.uid, selectedRecipient]),
        orderBy('timestamp')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(messagesList);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [selectedRecipient]);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins: ', error);
    }
  };

  const fetchAllMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('timestamp'));
      const querySnapshot = await getDocs(q);
      const allMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMessages);
      setStarredMessages(allMessages.filter(msg => msg.starred));
    } catch (error) {
      console.error('Error fetching all messages: ', error);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() || attachment) {
      try {
        await addDoc(collection(db, 'messages'), {
          senderId: auth.currentUser.uid,
          recipientId: selectedRecipient,
          message,
          attachment,
          timestamp: new Date(),
          starred: false
        });
        setMessage('');
        setAttachment(null);
        setIsComposing(false);
      } catch (error) {
        console.error('Error sending message: ', error);
      }
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
      fetchAllMessages(); // Refresh messages
    } catch (error) {
      console.error('Error deleting message: ', error);
    }
  };

  const handleStarMessage = async (id, starred) => {
    try {
      await updateDoc(doc(db, 'messages', id), { starred: !starred });
      fetchAllMessages(); // Refresh messages to update starred messages list
    } catch (error) {
      console.error('Error starring message: ', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="messaging-container">
      <h2>Messaging</h2>
      <select value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)}>
        <option value="">Select Recipient</option>
        {admins.map(admin => (
          <option key={admin.id} value={admin.id}>{admin.name}</option>
        ))}
      </select>
      <button className="compose-button" onClick={() => setIsComposing(true)}>new Message</button>
      <button className="starred-button" onClick={() => setShowStarred(!showStarred)}>
        {showStarred ? 'Show All Messages' : 'Show Starred Messages'}
      </button>
      <div className="messages">
        {(showStarred ? starredMessages : messages).map((msg, index) => {
          const senderName = msg.senderId === auth.currentUser.uid ? 'You' : admins.find(admin => admin.id === msg.senderId)?.name;
          const recipientName = admins.find(admin => admin.id === msg.recipientId)?.name;
          const timestamp = new Date(msg.timestamp?.seconds * 1000).toLocaleString();
          return (
            <div key={index} className={`message ${msg.senderId === auth.currentUser.uid ? 'User1' : 'User2'}`}>
              <div className="message-icons">
                <button className="star-button" onClick={() => handleStarMessage(msg.id, msg.starred)}>
                  {msg.starred ? '★' : '☆'}
                </button>
                <button className="delete-button" onClick={() => handleDeleteMessage(msg.id)}>🗑️</button>
              </div>
              <p><strong>{senderName}</strong> to <strong>{recipientName}</strong></p>
              <p>{msg.message}</p>
              {msg.attachment && <p>Attachment: {msg.attachment.name}</p>}
              <span>{timestamp}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {isComposing && (
        <div className="compose-window">
          <h3>send new Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleSendMessage} disabled={!selectedRecipient}>Send</button>
          <button onClick={() => setIsComposing(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default Messaging;
