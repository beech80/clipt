import React from 'react';
import { Link } from 'react-router-dom';

const BasicLanding: React.FC = () => {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#000000',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <h1 style={{
        fontSize: '130px',
        color: '#FFFFFF',
        textShadow: '0 0 20px #00e5ff, 0 0 40px #00e5ff',
        marginBottom: '50px',
        fontWeight: 'bold'
      }}>
        CLIPT
      </h1>
      
      <Link to="/clipts" style={{ textDecoration: 'none' }}>
        <button style={{
          fontSize: '28px',
          padding: '20px 50px',
          backgroundColor: 'transparent',
          border: '3px solid #00e5ff',
          color: '#FFFFFF',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 0 15px rgba(0, 229, 255, 0.6)',
          textTransform: 'uppercase'
        }}>
          START GAME
        </button>
      </Link>
    </div>
  );
};

export default BasicLanding;
