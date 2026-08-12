import React, {Suspense, useMemo, useRef} from 'react';
import {
     Float,
     MeshPortalMaterial,
     OrbitControls,
     PerspectiveCamera, Sparkles, Stars,
     useMatcapTexture, useTexture
} from "@react-three/drei";
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from "three";
import {Bloom, ChromaticAberration, DotScreen, EffectComposer, Noise, Scanline} from "@react-three/postprocessing";
import {BlendFunction} from "postprocessing";
import {TextureLoader, Vector2} from "three";
import {useFrame, useLoader} from "@react-three/fiber";
import {CameraParallax} from "../Scene1/index.jsx";

// 9B9994_E1E0DB_474643_544C4C
// 323C4D_B79039_7C6A44_605C48


function Model() {
     const { scene } = useGLTF('/model/scene2/Prop.glb');
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
               floatingRange={[-0.2, 0.2]} // Движение строго вверх/вниз относительно центра
               speed={1.5}                 // Скорость движения
               floatIntensity={1}          // Множитель высоты плавания
               rotationIntensity={0.3}       // ОТКЛЮЧАЕТ круговое вращение (объект не делает круг)
          >
               <mesh position={[-2.4, -1.2, 5.2]} rotation={[1+ Math.PI/ 2,0,1+ Math.PI/ 2]}>
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
               floatingRange={[-0.2, 0.2]} // Движение строго вверх/вниз относительно центра
               speed={1.5}                 // Скорость движения
               floatIntensity={1}          // Множитель высоты плавания
               rotationIntensity={0.3}       // ОТКЛЮЧАЕТ круговое вращение (объект не делает круг)
          >
               <mesh position={[3, -1, 4.5]} rotation={[6.4+ Math.PI / 20, 5+ Math.PI / 24, 4.8+ Math.PI / 2]}>
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
               floatingRange={[-0.2, 0.2]} // Движение строго вверх/вниз относительно центра
               speed={1.2}                 // Скорость движения
               floatIntensity={1.2}          // Множитель высоты плавания
               rotationIntensity={0.3}       // ОТКЛЮЧАЕТ круговое вращение (объект не делает круг)
          >
               <mesh position={[2, 1, 4.5]} rotation={[5.2+ Math.PI / 2,5.2+ Math.PI / 2,5+ Math.PI / 2]}>
                    <primitive object={scene} scale={1.5} position={[0, 0, 0]} />

               </mesh>

          </Float>
     );
}

function Model3() {
     const { scene } = useGLTF('/model/scene2/Wall.glb');
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
               floatingRange={[-0.2, 0.2]} // Движение строго вверх/вниз относительно центра
               speed={1.2}                 // Скорость движения
               floatIntensity={1.2}          // Множитель высоты плавания
               rotationIntensity={0.3}       // ОТКЛЮЧАЕТ круговое вращение (объект не делает круг)
          >
               <mesh position={[-2.8, .9, 5.5]} rotation={[0.4,4.2,0]}>
                    <primitive object={scene} scale={1.2} position={[0, 0, 0]} />

               </mesh>

          </Float>
     );
}

function Model4() {
     const { scene } = useGLTF('/model/scene2/Column.glb');
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
               floatingRange={[-0.2, 0.2]} // Движение строго вверх/вниз относительно центра
               speed={1.2}                 // Скорость движения
               floatIntensity={1.2}          // Множитель высоты плавания
               rotationIntensity={0.3}       // ОТКЛЮЧАЕТ круговое вращение (объект не делает круг)
          >
               <mesh position={[-1.5, 1, 4.5]} rotation={[0.5,1+Math.PI / 2,0.2]}>
                    <primitive object={scene} scale={1.5} position={[0, 0, 0]} />

               </mesh>

          </Float>
     );
}




export function ConveyorBelt() {
     const meshRef = useRef();
     const materialRef = useRef();

     const boardWidth = 1.8;
     const boardLength = 24;
     const segmentsY = 120;

     // 2. Склеиваем любое количество изображений вертикально
     const canvasTexture = useMemo(() => {
          const imgSources = ['/draw/1.jpg', '/draw/2.jpg', '/draw/3.jpg', '/draw/4.jpg', '/draw/5.jpg'];

          const canvas = document.createElement('canvas');
          const imageHeight = 1024; // Высота одной картинки

          canvas.width = 1024;
          // ИСПРАВЛЕНО: Высота холста теперь подстраивается под все 5 изображений (1024 * 5 = 5120)
          canvas.height = imageHeight * imgSources.length;

          const ctx = canvas.getContext('2d');

          imgSources.forEach((src, index) => {
               const img = new Image();
               img.src = src;
               img.onload = () => {
                    // Рисуем изображения строго друг под другом
                    ctx.drawImage(img, 0, index * imageHeight, 1024, imageHeight);
                    texture.needsUpdate = true;
               };
          });

          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          return texture;
     }, []);

     // 3. Деформируем плоскость, превращая её края в закругления
     const geometry = useMemo(() => {
          const geo = new THREE.PlaneGeometry(boardWidth, boardLength, 1, segmentsY);
          const position = geo.attributes.position;
          const radius = 1.5;
          const halfLength = boardLength / 2;
          const straightLength = halfLength - radius;

          for (let i = 0; i < position.count; i++) {
               let y = position.getY(i);
               let z = position.getZ(i);

               if (y > straightLength) {
                    const angle = ((y - straightLength) / radius) * (Math.PI / 1.2);
                    position.setY(i, straightLength + Math.sin(angle) * radius);
                    position.setZ(i, z - (radius - Math.cos(angle) * radius));
               }
               else if (y < -straightLength) {
                    const angle = ((-y - straightLength) / radius) * (Math.PI / 1.2);
                    position.setY(i, -(straightLength + Math.sin(angle) * radius));
                    position.setZ(i, z - (radius - Math.cos(angle) * radius));
               }
          }

          geo.computeVertexNormals();
          return geo;
     }, []);

     // 4. Двигаем текстуру
     useFrame((state, delta) => {
          if (materialRef.current && materialRef.current.map) {
               materialRef.current.map.offset.y += delta * 0.04;
          }
     });

     return (
          <mesh
               geometry={geometry}
               rotation={[-Math.PI / 2.2, 0, 0]}
               position={[0, 0, 0]}
          >
               <meshStandardMaterial
                    ref={materialRef}
                    map={canvasTexture}
                    side={THREE.DoubleSide}
                    roughness={0.2}
               />
          </mesh>
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
               <Model3 />
               <Model4 />
               <Stars radius={100} depth={50} count={5000} factor={4} saturation={2} fade speed={3} />

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
               {/*<CameraParallax intensity={0.3} factor={0.05} />*/}
               <OrbitControls />
               <ConveyorBelt />
               <mesh position={[0, -0.5, -45]}>
                    <circleGeometry args={[18, 32]} />
                    <meshBasicMaterial
                         color="#0088cc"                   // 👈 Яркий голубой цвет свечения
                         transparent={true}
                         opacity={0.35}                    // 👈 Прозрачность
                         blending={THREE.AdditiveBlending} // 👈 Режим свечения!
                         depthWrite={false}                // 👈 Не блокирует задний план
                    />
               </mesh>

               {/* 2. Тонкая контурная орбита (кольцо) */}
               <mesh position={[0, -0.5, -44]}>
                    <ringGeometry args={[10, 10.3, 32]} />
                    <meshBasicMaterial
                         color={'black'}
                         transparent
                         opacity={0.4}
                    />
               </mesh>
               <fog attach="fog" args={['#031427', 10, 55]} />

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
                    {/*<color attach="background" args={['#1a1a2e']} />*/}

                    {/*<ambientLight intensity={1.5} />*/}
                         <SceneTwo />

               </MeshPortalMaterial>
          </mesh>
     );
}
