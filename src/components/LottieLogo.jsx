import React from 'react';
import Lottie from 'lottie-react'; // Updated to use lottie-react
import animationData from '../assets/lottie/local-ledger-logo-animation.json';

const LottieLogo = () => {
  return (
    <div style={{ width: 200, height: 200 }}>
      <Lottie animationData={animationData} loop={true} autoplay={true} />
    </div>
  );
};

export default LottieLogo;