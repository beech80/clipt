import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const DiscoveryNew = () => {
  // Simplified version for testing
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <div className="discovery-page">
      <div className="discovery-container">
        {/* Top Half - Stream Display */}
        <motion.div className="stream-display-container">
          <div className="content">Test content</div>
        </motion.div>
        
        {/* Bottom Half Search Panel */}
        <AnimatePresence>
          {searchModalOpen && (
            <motion.div className="search-panel">
              <div className="search-container">
                Search content here
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiscoveryNew;
