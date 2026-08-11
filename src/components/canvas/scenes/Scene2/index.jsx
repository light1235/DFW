import React, {Suspense, useMemo} from 'react';
import {
     Float,
     MeshPortalMaterial,
     OrbitControls,
     PerspectiveCamera, Sparkles, Stars,
     useMatcapTexture
} from "@react-three/drei";
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from "three";
import {Bloom, ChromaticAberration, DotScreen, EffectComposer, Noise, Scanline} from "@react-three/postprocessing";
import {BlendFunction} from "postprocessing";
import {Vector2} from "three";

// 9B9994_E1E0DB_474643_544C4C
// 323C4D_B79039_7C6A44_605C48
// 75723E_C0C3A0_2A1E0E_AFAE77


function Model() {
     const { scene } = useGLTF('/model/scene2/Prop.glb');
     const [matcapTexture] = useMatcapTexture('323C4D_B79039_7C6A44_605C48', 1024);

     // 2. Створюємо новий MatCap матеріал
     const matcapMaterial = useMemo(() => {
          return new THREE.MeshMatcapMaterial({
               matcap: matcapTexture,
          });
     }, [matcapTexture]);

     // 3. Проходимо по всій моделі та замінюємо старі матеріали на наш MatCap
     useMemo(() => {
          scene.traverse((child) => {
               if (child.isMesh) {
                    child.material = matcapMaterial;
               }
          });
     }, [scene, matcapMaterial]);

     return (
          <Float
               floatingRange={[-0.2, 0.2]} // Движение строго вверх/вниз относительно центра
               speed={1.5}                 // Скорость движения
               floatIntensity={1}          // Множитель высоты плавания
               rotationIntensity={0.3}       // ОТКЛЮЧАЕТ круговое вращение (объект не делает круг)
          >
               <mesh position={[-3, -0.5, 5]}>
                    <primitive object={scene} scale={1.5} position={[0, 0, 0]} />
               </mesh>
          </Float>


     );
}

function Model1() {
     const { scene } = useGLTF('/model/scene2/Impossible.glb');
     const [matcapTexture] = useMatcapTexture('9B9994_E1E0DB_474643_544C4C', 1024);

     // 2. Створюємо новий MatCap матеріал
     const matcapMaterial = useMemo(() => {
          return new THREE.MeshMatcapMaterial({
               matcap: matcapTexture,
          });
     }, [matcapTexture]);

     // 3. Проходимо по всій моделі та замінюємо старі матеріали на наш MatCap
     useMemo(() => {
          scene.traverse((child) => {
               if (child.isMesh) {
                    child.material = matcapMaterial;
               }
          });
     }, [scene, matcapMaterial]);

     return (
          <Float
               position={[-2.5, 0.5, 0.5]}
               rotation={[0, 0.6, 0]}
               speed={1.5}
               rotationIntensity={1}
               floatIntensity={1}
          >
               <mesh position={[3, 1, 4.5]}>
                    <primitive object={scene} scale={1.5} position={[0, 0, 0]} />
               </mesh>
          </Float>
     );
}

function Model2() {
     const { scene } = useGLTF('/model/scene2/Concrete.glb');
     const [matcapTexture] = useMatcapTexture('9B9994_E1E0DB_474643_544C4C', 1024);

     // 2. Створюємо новий MatCap матеріал
     const matcapMaterial = useMemo(() => {
          return new THREE.MeshMatcapMaterial({
               matcap: matcapTexture,
          });
     }, [matcapTexture]);

     // 3. Проходимо по всій моделі та замінюємо старі матеріали на наш MatCap
     useMemo(() => {
          scene.traverse((child) => {
               if (child.isMesh) {
                    child.material = matcapMaterial;
               }
          });
     }, [scene, matcapMaterial]);

     return (
          <Float
               position={[-2.5, 0.5, 0.5]}
               rotation={[0, 0.6, 0]}
               speed={1.5}
               rotationIntensity={1}
               floatIntensity={1}
          >
               <mesh position={[0, 1, 4.5]}>
                    <primitive object={scene} scale={1.5} position={[0, 0, 0]} />

               </mesh>

          </Float>
     );
}



const SceneTwo = () => {
     return (
          <>
               <ambientLight intensity={1.5} />
               <directionalLight position={[5, 5, 5]} intensity={2} />
               <color attach="background" args={['#1a1a2e']} />
               <Model />
               <Model1 />
               <Model2 />
               <Stars radius={100} depth={50} count={5000} factor={4} saturation={2} fade speed={3} />

               {/*<mesh position={[0, 0, 0]}>*/}
               {/*     <torusKnotGeometry args={[0.4, 0.3, 10, 2]} />*/}
               {/*     <meshStandardMaterial color="hotpink" roughness={0.1} />*/}
               {/*</mesh>*/}
               {/*<mesh>*/}
               {/*     <icosahedronGeometry />*/}
               {/*     <meshPhysicalMaterial*/}
               {/*          roughness={0}*/}
               {/*          metalness={0}*/}
               {/*          thickness={3.12}*/}
               {/*          ior={1.74}*/}
               {/*          transmission={1.0}*/}
               {/*     />*/}
               {/*</mesh>*/}
               <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, 0, 0]}>
                    {/* аргументы [ширина, высота, сегменты_по_ширине, сегменты_по_высоте] */}
                    <planeGeometry args={[1.8, 24, 1, 1]} />

                    {/* Материал плоскости, например, двусторонний синий */}
                    <meshStandardMaterial color="royalblue" side={2} />
               </mesh>

               {/*<EffectComposer>*/}

               {/*     <Scanline*/}
               {/*          blendFunction={BlendFunction.OVERLAY} // blend mode*/}
               {/*          density={1.25} // scanline density*/}
               {/*     />*/}
               {/*</EffectComposer>*/}

          </>
     );
};

export default SceneTwo;


export function PortalToSceneTwo() {
     return (
          // Портал стоит на своем месте в первой сцене
          <mesh position={[1.393, 7.104, -10.86]} rotation={[0, -115 * (Math.PI / 180), 0]}>
               <circleGeometry args={[0.26, 64]}  />

               <MeshPortalMaterial
                    blend={1} // На старте края жесткие, чтобы это было четкое окно
                    // makeDefault={false}
               >
                    {/* Внутренняя камера портала НЕ должна быть дефолтной на старте */}
                     <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                    {/*<OrbitControls />*/}
                    {/* Цвет фона остаётся, но теперь он заперт ВНУТРИ портала */}
                    <color attach="background" args={['#1a1a2e']} />

                    {/*<ambientLight intensity={1.5} />*/}
                         <SceneTwo />


               </MeshPortalMaterial>
          </mesh>
     );
}
