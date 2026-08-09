import React from 'react';
import logoImage from '/doka-logo-alt.png';

const Logo = ({ width = 712, height = 196 }) => {
  return <img src={logoImage} alt="Doka Logo" width={width} height={height} />;
};

export default Logo;
