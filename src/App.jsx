import './App.css';
import {Canvas} from '@react-three/fiber';
import SceneManager from './components/canvas/SceneManager.jsx';
import HeaderSection from './components/dom/HeaderSection.jsx';
import {Environment, Fisheye, OrbitControls, Texture, useHelper,} from "@react-three/drei";
import Scene1 from "./components/canvas/scenes/Scene1/index.jsx";
import {EffectComposer, Bloom, Noise, ChromaticAberration, Scanline} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

import * as THREE from 'three'
import React, {Suspense, useEffect, useRef, useState} from "react";
import {Vector2} from "three";
import {ScrollCameraPath} from "./components/canvas/ViewportCanvas.jsx";
import Scene2, {PortalToSceneTwo} from "./components/canvas/scenes/Scene2/index.jsx";
import {VHSScreenGlitchR3F} from "./components/canvas/TransitionShader.jsx";
import {MatrixRainScreenR3F} from "./components/canvas/TranisitionMatrixShader.jsx";
import GoldenTwilightScene from "./components/canvas/scenes/Scene4/index.jsx";

// import Lights from "./components/canvas/scenes/Scene1/Lights.jsx";
function Lights() {
  const light = useRef()
  useHelper(light, THREE.SpotLightHelper, 2)
  return <spotLight
    ref={light}

    // Позиция и цвет
    position={[-15, 20, 5]}
    color="yellow"
    intensity={20}

    // Параметры луча
    angle={0.5}               // Угол конуса
    penumbra={0.8}             // Мягкие края пятна
    distance={20}              // Дальность света
    decay={2}                  // Физическое затухание
    target-position={[0, 5, 0]}
    // Тени
    castShadow
    shadow-mapSize-width={2048} // Качество тени (512 / 1024 / 2048)
    shadow-mapSize-height={2048}
    shadow-bias={-0.0001}       // Избавление от артефактов
    shadow-normalBias={0.05}
  />
}


export default function App() {
     const [loading, setLoading] = useState(true);

     // Имитация загрузки ресурсов (например 3 секунды)
     useEffect(() => {
          const timer = setTimeout(() => {
               setLoading(false); // Запускаем 0.7s плавающий fade-out
          }, 3000);

          return () => clearTimeout(timer);
     }, []);

  return (
    <div className="main-wrapper" style={{ height: '100vh', width: '100vw' }}>
      <HeaderSection />
      {/* Фиксированный Canvas для 4 сцен */}
      <Canvas className="fixed-canvas"
              camera={{ position: [0, 10, 45], fov: 30 }}
              shadows
              gl={{ antialias: true, toneMappingExposure: 1.15 }}
      >
        {/*<SceneManager />*/}
        <color attach="background" args={['#1a1a1a']} />
           <fog attach="fog" args={['#1a1a1a', 15, 80]} />
        {/*<fog attach="fog" args={['#1a1a1a', 15, 50]} />*/}
        <OrbitControls />
        {/*   <ScrollCameraPath />*/}
           {/*<Environment preset="forest" background blur={0.4}/>*/}
        {/*<Scene1 />*/}
           <Scene2 />
        {/*   <VHSScreenGlitchR3F*/}
        {/*        active={loading}*/}
        {/*        duration={2.5}*/}
        {/*        fadeDuration={0.1}*/}
        {/*        intensity={1.0}*/}
        {/*        onFinished={() => console.log('Заставка полностью исчезла!')}*/}
        {/*   />*/}
           {/*<MatrixRainScreenR3F*/}
           {/*     active={loading}*/}
           {/*     fadeDuration={0.7}*/}
           {/*     onFinished={() => console.log('Matrix Rain полностью закрылся')}*/}
           {/*/>*/}
           <PortalToSceneTwo />
           {/*     <GoldenTwilightScene />*/}


        <EffectComposer>
          <Bloom intensity={0.2} luminanceThreshold={0.4}
            luminanceSmoothing={0.5} mipmapBlur />
             <Noise
                  opacity={0.60}
                  premultiply
                  // 2. Використовуємо blendFunction замість blendMode
                  blendFunction={BlendFunction.NORMAL}
             />
             <ChromaticAberration
                  offset={new Vector2(0.001, 0.001)} // Сдвиг красного и синего каналов
             />
        </EffectComposer>
      </Canvas>

      {/* Проставка для виртуального скролла WebGL */}
      <div className="scroll-spacer" />

      {/* Нативный HTML-контент */}
      <main className="html-content">
        {/*<ContentSection />*/}
      </main>
    </div>
  );
}
