import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, query, where, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationWindowOpen, setIsNotificationWindowOpen] = useState(false);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    const fetchAdmins = async (user) => {
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched Admins:', adminList); // Log the fetched admins
        setAdmins(adminList);
      } catch (error) {
        console.error('Error fetching admins: ', error);
      }
    };

    const fetchNotifications = async (user) => {
      try {
        const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched Notifications:', fetchedNotifications); // Log the fetched notifications
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications: ', error);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAdmins(user);
        fetchNotifications(user);

        const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
          fetchNotifications(user);
        });

        return () => unsubscribe();
      } else {
        console.error('User is not authenticated');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationWindowOpen(!isNotificationWindowOpen);
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification: ', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        setNotifications([]);
      } else {
        console.error('User is not authenticated');
      }
    } catch (error) {
      console.error('Error deleting all notifications: ', error);
    }
  };

  const getAdminNameById = (id) => {
    const admin = admins.find(admin => admin.id === id);
    return admin ? admin.name : 'Unknown';
  };

  return (
    <div className="notification-container">
      <div className="notification-icon" onClick={handleNotificationClick}>
        <button>
          <img src="https://cdn3.iconfinder.com/data/icons/font/216/bell-512.png" alt="Notifications" width="30" height="30" />
          {notifications.length > 0 && (
            <span className="notification-count">{notifications.length}</span>
          )}
        </button>
      </div>
      {isNotificationWindowOpen && (
        <div id="notificationWindow" className="notification-window">
          <div className="notification-header">
            <img src="/deleteAll.png" alt="Delete All" onClick={handleDeleteAllNotifications} className="notification-delete-all-icon"/>
          </div>
          <div className="notification-content">
            {notifications.length > 0 ? (
              notifications
                .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
                .map((notification, index) => (
                  <div key={index} className="notification-item">
                    <div className="notification-timestamp">
                      {new Date(notification.timestamp.seconds * 1000).toLocaleString()}
                    </div>
                    <div className="notification-details">
                      <div className="notification-name">
                        {notification.senderId ? getAdminNameById(notification.senderId) : notification.senderName}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                    </div>
                    <img src="/delete.png" alt="Delete" onClick={() => handleDeleteNotification(notification.id)} className="notification-delete-icon"/>
                  </div>
                ))
            ) : (
              <p>אין התראות חדשות.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
