import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Select from 'react-select';
import { Link } from 'react-router-dom';
import { writeFile, utils } from 'xlsx';
import './frameWorkReport.css';
import HomeButton from '../HomeButton'; // Adjust the import path as needed

const FrameWorkReport = () => {
  const [frameworks, setFrameworks] = useState([]);
  const [filteredFrameworks, setFilteredFrameworks] = useState([]);
  const [frameworkOptions, setFrameworkOptions] = useState([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState([]);

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Framework'));
      if (querySnapshot.empty) {
        console.warn('No documents found in the Framework collection');
        return;
      }

      const frameworksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        check: doc.data().check,
      }));

      const options = frameworksData.map(framework => ({
        value: framework.name,
        label: framework.name,
      }));
      setFrameworkOptions(options);

      // Fetch branches, contacts, and worker details for frameworks
      const frameworksWithDetails = await Promise.all(
        frameworksData.map(async (framework) => {
          const branchesQuery = query(
            collection(db, 'branches'),
            where('frameWorkName', '==', framework.name)
          );
          const branchesSnapshot = await getDocs(branchesQuery);
          const branches = await Promise.all(branchesSnapshot.docs.map(async branchDoc => {
            const contacts = branchDoc.data().contacts;
            const workerDetails = await fetchWorkerDetails(contacts);
            return {
              branchName: branchDoc.data().branchName,
              contacts: contacts.join(', '),
              workerNames: workerDetails.map(worker => worker.name).join(', '),
              workerEmails: workerDetails.map(worker => worker.email).join(', '),
              workerRoles: workerDetails.map(worker => worker.role).join(', ')
            };
          }));

          return {
            ...framework,
            branches,
          };
        })
      );

      setFrameworks(frameworksWithDetails);
      setFilteredFrameworks(frameworksWithDetails);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
    }
  };

  const fetchWorkerDetails = async (contacts) => {
    try {
      const workersPromises = contacts.map(async (contact) => {
        const workerQuery = query(
          collection(db, 'workers'),
          where('phone', '==', contact)
        );
        const workerSnapshot = await getDocs(workerQuery);
        if (!workerSnapshot.empty) {
          const workerDoc = workerSnapshot.docs[0];
          return {
            name: workerDoc.data().name,
            email: workerDoc.data().email,
            role: workerDoc.data().role
          };
        }
        return { name: '', email: '', role: '' };
      });

      const workers = await Promise.all(workersPromises);
      return workers;
    } catch (error) {
      console.error('Error fetching workers:', error);
      return [];
    }
  };

  const handleFilterChange = (selectedOptions) => {
    setSelectedFrameworks(selectedOptions);
    const selectedNames = selectedOptions.map(option => option.value);
    const filtered = frameworks.filter(framework => selectedNames.includes(framework.name));
    setFilteredFrameworks(filtered.length > 0 ? filtered : frameworks);
  };

  const exportToExcel = () => {
    const data = filteredFrameworks.flatMap(framework =>
      framework.branches.flatMap(branch =>
        ({
          'שם מסגרת המלווה': framework.name,
          'יותר מסניף אחד': framework.check === 'true' ? 'כן' : 'לא',
          'סניפים': branch.branchName,
          'אנשי קשר': branch.contacts,
          'שמות אנשי קשר': branch.workerNames,
          'מייל נשות קשר': branch.workerEmails,
          'תפקיד': branch.workerRoles
        })
      )
    );

    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Framework Report');
    writeFile(workbook, 'Framework_Report.xlsx');
  };

  return (
    <div className="frameWork-report-container">
      <HomeButton />
      <div className="Addess">
        <h1>דו"ח מסגרות המלווה</h1>
      </div>
      <div className="filter-container">
        <label>סנן לפי שם מסגרת:</label>
        <Select
          isMulti
          options={frameworkOptions}
          onChange={handleFilterChange}
          placeholder="בחר שם מסגרת"
        />
      </div>
      <div className="export-button-container">
        <button onClick={exportToExcel} className="export-button">
          יצוא לאקסל
        </button>
      </div>
      <table className="frameWork-report-table">
        <thead>
          <tr>
            <th>שם מסגרת המלווה</th>
            <th>יותר מסניף אחד</th>
            <th>סניפים</th>
            <th>אנשי קשר</th>
            <th>שמות אנשי קשר</th>
            <th>מייל נשות קשר</th>
            <th>תפקיד</th>
          </tr>
        </thead>
        <tbody>
          {filteredFrameworks.map((framework) => (
            <React.Fragment key={framework.id}>
              {framework.branches.map((branch, index) => (
                <tr key={`${framework.id}-${index}`}>
                  {index === 0 && (
                    <>
                      <td rowSpan={framework.branches.length}>
                        <Link to={`/frameworkdetails/${framework.id}`}>{framework.name}</Link>
                      </td>
                      <td rowSpan={framework.branches.length}>{framework.check === 'true' ? 'כן' : 'לא'}</td>
                    </>
                  )}
                  <td>{branch.branchName}</td>
                  <td>{branch.contacts}</td>
                  <td>{branch.workerNames}</td>
                  <td>{branch.workerEmails}</td>
                  <td>{branch.workerRoles}</td>
                </tr>
              ))}
              {framework.branches.length === 0 && (
                <tr>
                  <td>
                    <Link to={`/frameworkdetails/${framework.id}`}>{framework.name}</Link>
                  </td>
                  <td>{framework.check === 'true' ? 'כן' : 'לא'}</td>
                  <td>אין סניפים</td>
                  <td>אין אנשי קשר</td>
                  <td>אין שמות אנשי קשר</td>
                  <td>אין מייל נשות קשר</td>
                  <td>אין תפקיד</td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FrameWorkReport;
