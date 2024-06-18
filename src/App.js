import React, { useState } from 'react';
import Loginn from './components/loginn';
import Admin from './components/Admin';
import './App.css'; // Import the updated CSS

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('admin');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  let page;
  if (currentPage === 'login') {
    page = <Loginn onLogin={handleLogin} />;
  } else if (currentPage === 'admin') {
    page = <Admin onLogout={handleLogout} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Admin Management</h1>
      </header>
      <main>
        {page}
      </main>
    </div>
  );
}

export default App;
