import React, {Suspense, useEffect, useState} from 'react';
import ExpoScene from "./scenes/Scene1/index.jsx";
import {PortalToSceneTwo} from "./scenes/Scene2/index.jsx";
import ExcavationPitScene from "./scenes/Scene3/index.jsx";
import GoldenMonolithScene from "./scenes/Scene4/index.jsx";
import {VHSScreenGlitchR3F} from "./TransitionShader.jsx";
import {MatrixRainScreenR3F} from "./TranisitionMatrixShader.jsx";
import ContactText from "./scenes/Scene6/contact-text.jsx";
import Scene6 from "./scenes/Scene6/index.jsx";

const SceneManager = () => {


     const [excavationActive, setExcavationActive] = useState(false);
     const [excCamera, setExcCamera] = useState(false);
     const [expo, setExpo] = useState(true);
     const [monolith, setMonolith] = useState(false);

     const handleTransition = () => {
          setExcavationActive(true);
          setExpo(false);
     };



     return (
          <>
               <Suspense fallback={null}>
                    <VHSScreenGlitchR3F
                         active={true}
                         duration={2.5}
                         fadeDuration={0.1}
                         intensity={1.0}
                         onFinished={() => console.log('Заставка полностью исчезла!')}
                    />
                    {expo && <ExpoScene  />}
                    {!excavationActive && <PortalToSceneTwo onTransitionComplete={handleTransition} excCamera={setExcCamera}  />}
                    {excavationActive && <ExcavationPitScene  active={excCamera}  />}
                    {monolith && <MatrixRainScreenR3F active={true} />}
                    {monolith  && <GoldenMonolithScene />}
                    {/*<Scene6 />*/}

               </Suspense>
          </>
     );
};

export default SceneManager;
