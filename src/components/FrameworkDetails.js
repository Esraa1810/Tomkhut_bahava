import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import HomeButton from './HomeButton';
import './FrameworkDetails.css';

const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^(0[2-9]\d{7}|050\d{7}|052\d{7}|053\d{7}|054\d{7}|055\d{7})$/;
    return phoneRegex.test(phone);
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const FrameworkDetails = () => {
    const { id } = useParams();
    const [framework, setFramework] = useState(null);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
    const [newBranch, setNewBranch] = useState({
        branchName: '',
        branchCity: '',
    });
    const [newBranchContact, setNewBranchContact] = useState({ name: '', phone: '', email: '', role: '' });
    const [currentBranchIndex, setCurrentBranchIndex] = useState(null);
    const [branchError, setBranchError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchFramework = async () => {
            try {
                const docRef = doc(db, 'Framework', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const frameworkData = docSnap.data();
                    setFramework(frameworkData);
                    await fetchBranches(frameworkData.name);
                } else {
                    setError('מסגרת לא נמצאה');
                }
            } catch (err) {
                console.error('Error getting framework:', err);
                setError('שגיאה בהבאת הנתונים');
            } finally {
                setLoading(false);
            }
        };

        const fetchBranches = async (frameworkName) => {
            const branchesRef = collection(db, 'branches');
            const branchesQuery = query(branchesRef, where('frameWorkName', '==', frameworkName));
            const branchesSnapshot = await getDocs(branchesQuery);
            const branchesData = branchesSnapshot.docs.map(branchDoc => {
                const branchData = branchDoc.data();
                branchData.contacts = branchData.contacts.map(contact => 
                    typeof contact === 'string' ? { phone: contact } : contact
                );
                return { ...branchData, id: branchDoc.id };
            });

            const workersRef = collection(db, 'workers');
            const workersSnapshot = await getDocs(workersRef);
            const workersData = workersSnapshot.docs.reduce((acc, workerDoc) => {
                const worker = workerDoc.data();
                acc[worker.phone] = worker;
                return acc;
            }, {});

            branchesData.forEach(branch => {
                branch.contacts = branch.contacts.map(contact => {
                    const workerDetails = workersData[contact.phone];
                    if (workerDetails) {
                        return {
                            phone: contact.phone,
                            name: workerDetails.name,
                            email: workerDetails.email,
                            role: workerDetails.role
                        };
                    }
                    return { phone: contact.phone };
                });
            });

            setBranches(branchesData);
        };

        fetchFramework();
    }, [id]);

    const handleEditClick = () => {
        setIsEditing(prevEdit => !prevEdit);
    };

    const handleUpdate = async () => {
        try {
            const docRef = doc(db, 'Framework', id);
            const newCheckValue = branches && branches.length > 1;
    
            await updateDoc(docRef, {
                name: framework.name,
                check: newCheckValue,
            });
            setFramework((prevFramework) => ({
                ...prevFramework,
                check: newCheckValue,
            }));
    
            const updateBranchPromises = branches.map(async (branch) => {
                if (branch) { // הוספת בדיקה זו
                    const branchCity = branch.branchCity || '';
                    const branchRef = doc(db, 'branches', branch.id);
                    const newBranchName = newCheckValue === false ? framework.name : branch.branchName;
    
                    await updateDoc(branchRef, {
                        branchName: newBranchName,
                        branchCity,
                        contacts: branch.contacts.map(c => c.phone),
                        frameWorkName: framework.name
                    });
                }
            });
    
            await Promise.all(updateBranchPromises);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating framework:', err);
        }
    };
    
    const addBranch = async () => {
        try {
            if (!newBranch.branchName || !newBranch.branchCity) {
                setBranchError('אנא מלא את כל השדות.');
                return;
            }
      
            const newBranchRef = await addDoc(collection(db, 'branches'), {
                ...newBranch,
                frameWorkName: framework.name,
                contacts: [], // אין אנשי קשר עבור הסניף החדש
            });

            const newBranchWithId = { ...newBranch, id: newBranchRef.id };
            setBranches([...branches, newBranchWithId]);

            setNewBranch({
                branchName: '',
                branchCity: '',
            });
            setIsAddBranchModalOpen(false);
        } catch (err) {
            console.error("Error adding branch:", err);
        }
    };

    const handleNewBranchInputChange = (field, value) => {
        setNewBranch({ ...newBranch, [field]: value });
    };

    const handleNewBranchContactChange = (field, value) => {
        setNewBranchContact({ ...newBranchContact, [field]: value });
    };

    const handleBranchChange = (index, field, value) => {
        const updatedBranches = [...branches];
        updatedBranches[index][field] = value;
        setBranches(updatedBranches);
    };

    const handleContactChange = async (branchIndex, contactIndex, field, value) => {
        const updatedBranches = [...branches];
        const contact = updatedBranches[branchIndex].contacts[contactIndex];

        if (typeof contact === 'string') {
            updatedBranches[branchIndex].contacts[contactIndex] = { phone: contact };
        }

        const updatedContact = { ...updatedBranches[branchIndex].contacts[contactIndex] };

        if (field === 'phone') {
          
            const oldPhone = updatedContact.phone;
            updatedContact.phone = value;

            const workersRef = collection(db, 'workers');
            const workersQuery = query(workersRef, where('phone', '==', oldPhone));
            const workersSnapshot = await getDocs(workersQuery);

            if (!workersSnapshot.empty) {
                const workerRef = doc(workersRef, workersSnapshot.docs[0].id);
                await updateDoc(workerRef, { phone: value });
            }
        } else {
            updatedContact[field] = value;
        }

        updatedBranches[branchIndex].contacts[contactIndex] = updatedContact;
        setBranches(updatedBranches);
    };

    const removeContact = async (branchIndex, contactIndex) => {
        const updatedBranches = [...branches];
        const contactToRemove = updatedBranches[branchIndex].contacts[contactIndex];

        const workersRef = collection(db, 'workers');
        const workersQuery = query(workersRef, where('phone', '==', contactToRemove.phone));
        const workersSnapshot = await getDocs(workersQuery);

        if (!workersSnapshot.empty) {
            const workerRef = doc(workersRef, workersSnapshot.docs[0].id);
            await deleteDoc(workerRef);
        }

        updatedBranches[branchIndex].contacts.splice(contactIndex, 1);
        setBranches(updatedBranches);
    };

    const addContact = (branchIndex) => {
        setCurrentBranchIndex(branchIndex);
        setIsAddContactModalOpen(true); // פתח את המודאל להוספת איש קשר
    };

    const confirmAddContact = async () => {
        try {
            if (!isValidPhoneNumber(newBranchContact.phone)) {
                setBranchError('מספר הטלפון אינו חוקי. אנא הקלד מספר טלפון ישראלי תקין.');
                return;
            }

            if (!isValidEmail(newBranchContact.email)) {
                setBranchError('כתובת המייל אינה חוקית. אנא הקלד כתובת מייל חוקית.');
                return;
            }
            
            const updatedBranches = [...branches];
            const branchToUpdate = updatedBranches[currentBranchIndex];

            // הוסף את איש הקשר לסניף הנבחר
            branchToUpdate.contacts.push({ ...newBranchContact });

            await addDoc(collection(db, 'workers'), {
                ...newBranchContact,
                phone: newBranchContact.phone,
            });

            setBranches(updatedBranches);
            setNewBranchContact({ name: '', phone: '', email: '', role: '' }); // Reset contact fields
            setIsAddContactModalOpen(false); // סגור את המודאל
        } catch (err) {
            console.error("Error adding contact:", err);
        }
    };

    const removeBranch = async (branchIndex) => {
        const branchToRemove = branches[branchIndex];

        const workersRef = collection(db, 'workers');
        await Promise.all(branchToRemove.contacts.map(async (contact) => {
            const workersQuery = query(workersRef, where('phone', '==', contact.phone));
            const workersSnapshot = await getDocs(workersQuery);
            if (!workersSnapshot.empty) {
                await deleteDoc(doc(workersRef, workersSnapshot.docs[0].id));
            }
        }));

        const branchRef = doc(db, 'branches', branchToRemove.id);
        await deleteDoc(branchRef);

        const updatedBranches = branches.filter((_, index) => index !== branchIndex);
        setBranches(updatedBranches);
    };

    const removeFramework = async () => {
        try {
            const branchPromises = branches.map(async (branch) => {
                const workersRef = collection(db, 'workers');
                await Promise.all(branch.contacts.map(async (contact) => {
                    const workersQuery = query(workersRef, where('phone', '==', contact.phone));
                    const workersSnapshot = await getDocs(workersQuery);
                    if (!workersSnapshot.empty) {
                        await deleteDoc(doc(workersRef, workersSnapshot.docs[0].id));
                    }
                }));

                const branchRef = doc(db, 'branches', branch.id);
                await deleteDoc(branchRef);
            });

            const frameworkRef = doc(db, 'Framework', id);
            await deleteDoc(frameworkRef);

            await Promise.all(branchPromises);

            setBranches([]);
            setFramework(null);
            setSuccessMessage('המסגרת נמחקה בהצלחה!');
        } catch (err) {
            console.error('Error removing framework:', err);
            setError('שגיאה במחיקת המסגרת');
        }
    };

    const handleInputChange = (field, value) => {
        setFramework({ ...framework, [field]: value });
    };

    if (loading) {
        return <p>טוען...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="framework-details-outer-container">
            <header className="framework-header">
                <HomeButton />
            </header>
            <div className="framework-details-container">
                {error && <p>{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                {!framework ? (
                    <p>המסגרת נמחקה בהצלחה!</p>
                ) : (
                    <>
                        <h2 className="framework-title">
                            פרטי מסגרת
                            <div style={{ position: 'relative' }}>
    <img
        src="/edit.png"
        alt="Edit"
        onClick={handleEditClick}
        style={{ cursor: 'pointer', position: 'absolute', left: '-37px',top: '-70px', padding: '0 20px', width: '30px', height: '30px' }}
    />
</div>


                            {isEditing && (
                                <button 
                                    onClick={removeFramework} 
                                    style={{ cursor: 'pointer', marginLeft: '10px', backgroundColor: 'white', color: 'black', border: 'none', padding: '5px 10px' }}
                                >
                                    <img src="/delete.png" alt="Delete" style={{ width: '20px', height: '20px' }} />
                                </button>
                            )}
                        </h2>

                        <div className="edit-form">
                            {loading ? (
                                <p>טוען...</p>
                            ) : (
                                <>
                                    <div>
                                        <label>שם המסגרת:</label>
                                        
                                        <input
                                            type="text"
                                            value={framework.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div>
                                        <label>אם יש יותר מסניף אחד:</label>
                                        <select
                                            value={framework.check}
                                            onChange={(e) => handleInputChange('check', e.target.value)}
                                            disabled={!isEditing}
                                        >
                                            <option value="true">כן</option>
                                            <option value="false">לא</option>
                                        </select>
                                    </div>
                                    {isEditing && (
                                        <>
                                            <button onClick={() => setIsAddBranchModalOpen(true)}>הוסף סניף חדש</button>
                                        </>
                                    )}
                                    <fieldset>

                                    <h3>סניפים:</h3>
                                    {branches && branches.length > 0 ? (
                                        branches.map((branch, index) => (
                                            <div key={branch.id}>
                                                <h4>פרטי הסניף:</h4>
                                                <div>
                                                    <label>שם הסניף:</label>
                                                    <input
                                                        type="text"
                                                        value={branch.branchName}
                                                        onChange={(e) => handleBranchChange(index, 'branchName', e.target.value)}
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                                <div>
                                                    <label>עיר:</label>
                                                    <input
                                                        type="text"
                                                        value={branch.branchCity}
                                                        onChange={(e) => handleBranchChange(index, 'branchCity', e.target.value)}
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                                <div>
                                                    <h5>אנשי קשר:</h5>
                                                    {branch.contacts && branch.contacts.length > 0 ? (
                                                        branch.contacts.map((contact, contactIndex) => (
                                                            <div key={contactIndex}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="טלפון"
                                                                    value={contact.phone}
                                                                    onChange={(e) => handleContactChange(index, contactIndex, 'phone', e.target.value)}
                                                                    disabled={!isEditing}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="שם איש קשר"
                                                                    value={contact.name}
                                                                    onChange={(e) => handleContactChange(index, contactIndex, 'name', e.target.value)}
                                                                    disabled={!isEditing}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="מייל"
                                                                    value={contact.email}
                                                                    onChange={(e) => handleContactChange(index, contactIndex, 'email', e.target.value)}
                                                                    disabled={!isEditing}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="תפקיד"
                                                                    value={contact.role}
                                                                    onChange={(e) => handleContactChange(index, contactIndex, 'role', e.target.value)}
                                                                    disabled={!isEditing}
                                                                />
                                                                {isEditing && (
                                                                    <button onClick={() => removeContact(index, contactIndex)}>הסר איש קשר</button>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p>אין אנשי קשר לסניף זה</p>
                                                    )}
                                                    {isEditing && <button onClick={() => addContact(index)}>הוסף איש קשר</button>}
                                                </div>
                                                {isEditing && branches.length > 1 && (
                                                    <button onClick={() => removeBranch(index)}>הסר סניף</button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p>אין סניפים להציג</p>
                                    )}
                                                                        </fieldset>

                                    {isEditing && (
                                        <>
                                            <button onClick={handleUpdate}>שמירה</button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* Modal for adding new branch */}
                {isAddBranchModalOpen && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>הוסף סניף חדש</h2>
                            <div className="FrameworkDetails-details-group">
                                <label>שם סניף:</label>
                                <input
                                    type="text"
                                    value={newBranch.branchName}
                                    onChange={(e) => handleNewBranchInputChange('branchName', e.target.value)}
                                />
                            </div>
                            <div className="FrameworkDetails-details-group">
                                <label>עיר:</label>
                                <input
                                    type="text"
                                    value={newBranch.branchCity}
                                    onChange={(e) => handleNewBranchInputChange('branchCity', e.target.value)}
                                />
                            </div>

                            {branchError && <div className="FrameworkDetails-error">{branchError}</div>}
                            <button onClick={addBranch}>הוסף סניף</button>
                            <button onClick={() => setIsAddBranchModalOpen(false)}>ביטול</button>
                        </div>
                    </div>
                )}

                {/* Modal for adding new contact */}
                {isAddContactModalOpen && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>הוסף איש קשר חדש</h2>
                            <div className="FrameworkDetails-details-group">
                                <label>שם:</label>
                                <input
                                    type="text"
                                    value={newBranchContact.name}
                                    onChange={(e) => handleNewBranchContactChange('name', e.target.value)}
                                />
                            </div>
                            <div className="FrameworkDetails-details-group">
                                <label>מייל:</label>
                                <input
                                    type="email"
                                    value={newBranchContact.email}
                                    onChange={(e) => handleNewBranchContactChange('email', e.target.value)}
                                />
                            </div>
                            <div className="FrameworkDetails-details-group">
                                <label>מס' טלפון:</label>
                                <input
                                    type="text"
                                    value={newBranchContact.phone}
                                    onChange={(e) => handleNewBranchContactChange('phone', e.target.value)}
                                />
                            </div>
                            <div className="FrameworkDetails-details-group">
                                <label>תפקיד:</label>
                                <input
                                    type="text"
                                    value={newBranchContact.role}
                                    onChange={(e) => handleNewBranchContactChange('role', e.target.value)}
                                />
                            </div>

                            {branchError && <div className="FrameworkDetails-error">{branchError}</div>}
                            <button onClick={confirmAddContact}>הוסף איש קשר</button>
                            <button onClick={() => setIsAddContactModalOpen(false)}>ביטול</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrameworkDetails;
