import React, {useMemo} from 'react';
import {
     Float,
     MeshPortalMaterial,
     OrbitControls,
     PerspectiveCamera,
     useMatcapTexture
} from "@react-three/drei";
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from "three";
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
               position={[-2.5, 1.25, 0.5]}
               rotation={[0, 0.6, 0]}
               speed={2.5}
               rotationIntensity={2}
               floatIntensity={3}
          >
          <mesh position={[0, 0, 0]}>
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
               position={[-2.5, 1.25, 0.5]}
               rotation={[0, 0.6, 0]}
               speed={2.5}
               rotationIntensity={2}
               floatIntensity={3}
          >
               <mesh position={[3, 0, -1.5]}>
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
               {/*<mesh position={[0, 0, 0]}>*/}
               {/*     <torusKnotGeometry args={[0.4, 0.3, 10, 2]} />*/}
               {/*     <meshStandardMaterial color="hotpink" roughness={0.1} />*/}
               {/*</mesh>*/}
               <mesh>
                    <icosahedronGeometry />
                    <meshPhysicalMaterial
                         roughness={0}
                         metalness={0}
                         thickness={3.12}
                         ior={1.74}
                         transmission={1.0}
                    />
               </mesh>

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
                    <OrbitControls />
                    {/* Цвет фона остаётся, но теперь он заперт ВНУТРИ портала */}
                    <color attach="background" args={['#1a1a2e']} />

                    {/*<ambientLight intensity={1.5} />*/}
                         <SceneTwo />


               </MeshPortalMaterial>
          </mesh>
     );
}
