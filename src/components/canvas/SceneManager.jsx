import React, {Suspense, useEffect, useState} from 'react';
import ExpoScene from "./scenes/Scene1/index.jsx";
import {PortalToSceneTwo} from "./scenes/Scene2/index.jsx";
import ExcavationPitScene from "./scenes/Scene3/index.jsx";
import GoldenMonolithScene from "./scenes/Scene4/index.jsx";
import {VHSScreenGlitchR3F} from "./TransitionShader.jsx";
import {MatrixRainScreenR3F} from "./TranisitionMatrixShader.jsx";
import ContactText from "./scenes/Scene6/contact-text.jsx";
import Scene6 from "./scenes/Scene6/index.jsx";

const SceneManager = ({poster, town}) => {


     const [excavationActive, setExcavationActive] = useState(false);
     const [expo, setExpo] = useState(true);
     const [monolith, setMonolith] = useState(false);
     const [monolithCamera, setMonolithCamera] = useState(false);
     const [portalActive, setPortalActive] = useState(false);

     const handleTransition = () => {
          setExcavationActive(true);
          setExpo(false);
     };

     const transitionToMonolith = () => {
           setMonolithCamera(true)
          setMonolith(true)
     };

     useEffect(() =>{
         setPortalActive(true)
     },[portalActive])


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
                    {!excavationActive && portalActive && <PortalToSceneTwo onTransitionComplete={handleTransition}   />}
                    {excavationActive &&   <ExcavationPitScene monolith={transitionToMonolith} PitScene={setExcavationActive}  />}
                    {monolith && town  && <GoldenMonolithScene poster={poster} cameraMono={monolithCamera} />}
                    {monolith && <MatrixRainScreenR3F fadeDuration={0.7} active={true} />}
                    {/*<ExcavationPitScene   />*/}
               </Suspense>
          </>
     );
};

export default SceneManager;
