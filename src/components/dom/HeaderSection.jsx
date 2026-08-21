import React from 'react';
import Logo from './Logo';

const Header = () => {
     return (

          <header className="fixed top-0  left-0 w-full z-2000  p-12 flex items-start justify-between ">
               <div className="absolute top-6 left-6">
                    <div className="w-8 h-8 border-t border-l border-white/20  z-20" />
                    <div style={{ position: 'relative', left: '-5px', top: '-25px', zIndex: '300' }} onClick={() => window.location.reload()}>
                        <Logo width={300} height={98}   />
                    </div>
               </div>

               <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/20 pointer-events-none z-20"></div>
          </header>
     );
};

export default Header;
