import React, {useRef} from 'react';
import {OrbitControls, OrthographicCamera, PerspectiveCamera, Stars, useGLTF} from "@react-three/drei";
import * as THREE from "three";
import {useFrame, useThree} from "@react-three/fiber";
import {MathUtils} from "three";

function LedLineWithRealLight() {
     return (
          <group position={[200, 202.9, -30]}>
               {/* 1. Визуальная светящаяся полоса (то, что видит камера) */}
               <mesh>
                    <boxGeometry args={[20, 0.2, 0.2]} /> {/* Длина 20 единиц */}
                    <meshBasicMaterial color={[10, 10, 10]} />
               </mesh>

               {/* 2. Настоящий физический свет, который падает вниз на сцену */}
               <rectAreaLight
                    width={20}          // Ширина источника света (должна совпадать с длиной меша)
                    height={0.5}        // Высота источника света
                    intensity={5}       // Яркость света
                    color="#ffffff"
                    position={[0, -0.2, 0]} // Смещаем чуть ниже корпуса ламп
                    rotation={[-Math.PI / 2, 0, 0]} // Разворачиваем свет строго вниз
               />
          </group>
     )
}

function LedLine({ position, rotation }) {
     return (
          <mesh position={position} rotation={rotation}>
               {/* Длинный тонкий цилиндр или вытянутый бокс */}
               <boxGeometry args={[0.4, 0.4, 8]} />

               {/*
        MeshBasicMaterial не требует внешнего света.
        Перемножение цвета в массиве [r, g, b] на число (например, 10)
        заставляет его светиться в HDR для эффекта Bloom.
      */}
               <meshBasicMaterial
                    color={[10, 10, 10]} // Сверхъяркий белый цвет
               />
          </mesh>
     )
}



function ModelIndustrial() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Industrial.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;

               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={10} position={[210, 193.4, 25]} rotation={[0,1.2,0]} />;
}

function ModelDamaged() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Damaged- Concrete.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;

               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={[15,15,15]} position={[175, 195.4, -10]} rotation={[0,1,0]} />;
}

function ModelStairk() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Stairk.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;

               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={11} position={[212, 195.7, 12]} rotation={[0,6,0]} />;
}

function ModelGrate() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Grate.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;

               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={19} position={[191, 197.4, -15]} rotation={[0,1,0]} />;
}


function ModelFortress() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Fortress.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;

               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={31} position={[215, 201.4, -15]} rotation={[0,5,0]} />;
}

function ModelBox() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/scaled.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;
               // MeshStandardMaterial
               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshStandardMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={[20,17,30]} position={[200, 202.9, 0]} rotation={[0,1,0]} />;
}
export function CameraLogger() {
     const { camera } = useThree();
     const targetRef = useRef(new THREE.Vector3());

     useFrame(() => {
          // 1. Вычисляем точку направления взгляда (LookAt)
          camera.getWorldDirection(targetRef.current);
          const lookAtPoint = camera.position.clone().add(targetRef.current);

          // 2. Переводим радианы поворота камеры в градусы
          const rotX = (camera.rotation.x * (180 / Math.PI)).toFixed(1);
          const rotY = (camera.rotation.y * (180 / Math.PI)).toFixed(1);
          const rotZ = (camera.rotation.z * (180 / Math.PI)).toFixed(1);

          // 3. Выводим дебаг-информацию в консоль
          console.log(
               `[Camera] \n` +
               `Position: [${camera.position.toArray().map(n => n.toFixed(2)).join(', ')}] \n` +
               `Rotation (deg): [${rotX}, ${rotY}, ${rotZ}] \n` +
               `LookAt target: [${lookAtPoint.toArray().map(n => n.toFixed(2)).join(', ')}]`
          );
     });

     return null;
}

const ExcavationPitScene = () => {
     const rotX = MathUtils.degToRad(0.5)
     const rotY = MathUtils.degToRad(-41.6)
     const rotZ = MathUtils.degToRad(0.4)

     return (
          <>
               <PerspectiveCamera makeDefault position={[178.61, 199.77, 29.08]} fov={70} far={10000}  rotation={[rotX, rotY, rotZ]} />
               {/*<OrthographicCamera makeDefault position={[0, 0, 100]} zoom={1} />*/}
               <ambientLight intensity={2.6} />
               <directionalLight
                    position={[200, 350, 25]}
                    intensity={0.5}
               />
               <hemisphereLight
                    skyColor={"#ffffff"}
                    groundColor={"#444444"}
                    intensity={3.5}
               />
               <color attach="background" args={['#1a1a2e']} />
               <OrbitControls target={[200, 200, 5]} />
               <mesh
                    name='portal'
                    position={[233.61, 199.77, -20.08]}
                    rotation={[0,3.4+ Math.PI / 2, 0]}
                    scale={[4, 6, 4]} // Увеличивает высоту, превращая круг в овал
               >
                    <circleGeometry args={[1, 32]} />
                    <meshStandardMaterial side={THREE.DoubleSide} color="aquamarine" />
               </mesh>
               <CameraLogger />
               <ModelBox />
               <ModelFortress />
               <ModelStairk />
               <ModelGrate />
               <ModelDamaged />
               <ModelIndustrial />
               <LedLine position={[241.2, 212, 15]} rotation={[0, 2.6, 0]} />
               <LedLine position={[173, 212, -38]} rotation={[0, 2.6, 0]} />
          </>
     );
};

export default ExcavationPitScene;
// <PerspectiveCamera makeDefault position={[0, 0, 10]} />
// Position: [178.61, 199.77, 29.08]
// Rotation (deg): [0.5, -41.6, 0.4]
// LookAt target: [179.28, 199.78, 28.33]
