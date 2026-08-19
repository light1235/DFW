import React from 'react';
import ExpoScene from "./scenes/Scene1/index.jsx";
import {PortalToSceneTwo} from "./scenes/Scene2/index.jsx";

const SceneManager = () => {

     const showSingUpModal = () => {
          setIsModalSingUpVisible(true);
     };


     return (
          <>
               <ExpoScene />
               <PortalToSceneTwo />
          </>
     );
};

export default SceneManager;
