// Header.js
import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className={styles.logo} />
        <div className={styles.textBox}>
          <p>עמותת תומכות באהבה ע"ר 580739282</p>
          <p>0502247196</p>
          <p>tomchot.lev@gmail.com</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
// HeaderComponent.js
// import React from 'react';
// import styles from './Header.module.css';

// const HeaderComponent = () => {
//   return (
//     <header className="App-header">
//       <div className="logo-container">
//         <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="logo" />
//       </div>
//     </header>
//   );
// };

// export default HeaderComponent;
