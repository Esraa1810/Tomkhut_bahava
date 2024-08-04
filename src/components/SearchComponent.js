import React, { useState } from 'react';
import { collection, query, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './SearchComponent.css';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setResults([]);
      setNoResults(false);
      return;
    }

    try {
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();

      const girlsRef = collection(db, 'girls');
      const volunteersRef = collection(db, 'volunteer');
      const frameworksRef = collection(db, 'Framework');

      const createQueries = (ref, field) => [
        query(ref, orderBy(field), startAt(trimmedSearchTerm), endAt(trimmedSearchTerm + '\uf8ff'))
      ];

      const girlQueries = [
        ...createQueries(girlsRef, 'phoneNumber'),
        ...createQueries(girlsRef, 'firstName'),
        ...createQueries(girlsRef, 'lastName')
      ];

      const volunteerQueries = [
        ...createQueries(volunteersRef, 'phoneNumber'),
        ...createQueries(volunteersRef, 'firstname'),
        ...createQueries(volunteersRef, 'lastname')
      ];

      const frameworkQueries = [
        ...createQueries(frameworksRef, 'name')
      ];

      const querySnapshots = await Promise.all([
        ...girlQueries.map(getDocs),
        ...volunteerQueries.map(getDocs),
        ...frameworkQueries.map(getDocs)
      ]);

      const girlResults = querySnapshots.slice(0, 3).flatMap(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'girl' })));
      const volunteerResults = querySnapshots.slice(3, 6).flatMap(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'volunteer' })));
      const frameworkResults = querySnapshots.slice(6).flatMap(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'framework' })));

      const allResults = [...girlResults, ...volunteerResults, ...frameworkResults];
      setResults(allResults);
      setNoResults(allResults.length === 0);
    } catch (error) {
      console.error('Error searching: ', error);
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'girl') {
      navigate(`/girldetails/${result.id}`);
    } else if (result.type === 'volunteer') {
      navigate(`/volunteerdetails/${result.id}`);
    } else if (result.type === 'framework') {
      navigate(`/frameworkdetails/${result.id}`);
    }
  };

  return (
    <div>
      {!showSearchBox && (
        <div
          className="fixed-icon"
          onClick={() => setShowSearchBox(true)}
        >
          <img src={`${process.env.PUBLIC_URL}/search.png`} alt="Search" style={{ width: '150px', height: '150px' }} />
        </div>
      )}
      {showSearchBox && (
        <div className="search-box">
          <div className="search-box-header">
            <h3 className="search-box-title">חיפוש אנשי קשר</h3>
            <img
              src={`${process.env.PUBLIC_URL}/xclose.png`}
              alt="Close"
              className="search-box-close"
              onClick={() => setShowSearchBox(false)}
            />
          </div>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון"
              className="search-input"
            />
            <button type="submit" className="search-button">חפש</button>
          </form>
          {noResults && <p className="no-results">אין תוצאות</p>}
          {results.length > 0 && (
            <div className="results-container">
              <table className="results-table">
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} onClick={() => handleResultClick(result)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            src={`${process.env.PUBLIC_URL}/${result.type === 'girl' ? 'pregnant.png' : result.type === 'volunteer' ? 'volunteer.png' : 'frameworkLogo.png'}`}
                            alt="Icon"
                            style={{ width: '14px', height: '14px', marginRight: '5px' }}
                          />
                          {result.type === 'volunteer' && (
                            <>
                              {result.firstname} {result.lastname}
                            </>
                          )}
                          {result.type === 'framework' && (
                            <>
                              {result.name}
                            </>
                          )}
                          {result.type === 'girl' && (
                            <>
                              {result.firstName} {result.lastName}
                            </>
                          )}
                        </div>
                      </td>
                      {result.city && <td style={{ paddingLeft: '10px' }}>{result.city}</td>}
                      {result.phoneNumber && <td style={{ paddingLeft: '10px' }}>{result.phoneNumber}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
