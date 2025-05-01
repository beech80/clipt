import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGamepad, faVideo, faUser } from '@fortawesome/free-solid-svg-icons';
import '../styles/discovery-retro.css';

const DiscoveryNew = () => {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <div className="discovery-page">
      <div className="discovery-container">
        {/* Main Content */}
        <motion.div 
          className="stream-display-container"
          layout
          transition={{ duration: 0.3 }}
        >
          <div className="header">
            <div className="header-right">
              <div className="header-circular-buttons">
                <button 
                  className="circular-button search-button"
                  title="Search"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faSearch} size="lg" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="content-placeholder">
            <h2>Discovery Page Content</h2>
            <p>This is a simplified version of the Discovery page to fix syntax errors.</p>
          </div>
        </motion.div>
        
        {/* Search Panel */}
        <AnimatePresence>
          {searchModalOpen && (
            <motion.div 
              className="search-panel"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3 }}
            >
              <div className="search-container">
                <div className="search-header">
                  <h2><FontAwesomeIcon icon={faSearch} /> Search</h2>
                  <button onClick={() => setSearchModalOpen(false)}>Close</button>
                </div>
                <div className="search-content">
                  <p>Search functionality would go here</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiscoveryNew;
