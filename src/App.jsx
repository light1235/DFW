import './App.css';
import {Canvas} from '@react-three/fiber';
import HeaderSection from './components/dom/HeaderSection.jsx';
import {Environment, Fisheye, OrbitControls, Texture, useHelper,} from "@react-three/drei";
import {
     EffectComposer,
     Bloom,
     Noise,
     ChromaticAberration,
     Scanline,
     DotScreen,
     ToneMapping
} from '@react-three/postprocessing';
import {BlendFunction, ToneMappingMode} from 'postprocessing';

import React, { useEffect, useState} from "react";
import InteractivePoster from "./components/canvas/scenes/Scene5/index.jsx";
import { Stats } from '@react-three/drei'
import SceneManager from "./components/canvas/SceneManager.jsx";
import ShaderComponent from "./components/canvas/PostProcessing.jsx";
import ContactScene from "./components/canvas/scenes/Scene6/index.jsx";



export default function App() {
     const [loading, setLoading] = useState(true);
     const [poster, setPoster] = useState(false);
     const [contactSection, setContactSection] = useState(false);
     const [town, setTown] = useState(true);


     // Имитация загрузки ресурсов (например 3 секунды)
     useEffect(() => {
          const timer = setTimeout(() => {
               setLoading(false); // Запускаем 0.7s плавающий fade-out
          }, 3000);
          return () => clearTimeout(timer);
     }, []);


  return (
    <div className="main-wrapper" style={{ height: '100vh', width: '100vw',background: '#0A0015',overflowY: 'auto',overflowX: 'hidden', position:'relative'  }}>
         <HeaderSection />
         {/*style={{ display: town ? 'block' : 'none' }}*/}
      <Canvas  style={{ display: town ? 'block' : 'none' }} className="fixed-canvas z-30"
              camera={{ position: [0, 10, 45], fov: 30 }}
              shadows
              gl={{ antialias: true, toneMappingExposure: 1.15 }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <fog attach="fog" args={['#1a1a1a', 15, 80]} />
           <SceneManager poster={setPoster} town={town} />
         <ShaderComponent />
           {/*<Stats   />*/}
      </Canvas>

      <main className="html-content">
           {poster &&  <InteractivePoster town={setTown} contact={setContactSection} />}
      </main>
         {contactSection &&
              <div className="main-wrapper" style={{ height: '100vh', width: '100vw' }}>
                     <Canvas   shadows
                               gl={{ antialias: true, toneMappingExposure: 1.15 }}>
                          <ContactScene />
                        <ShaderComponent />
                     </Canvas>
              </div>
         }
    </div>
  );
}
