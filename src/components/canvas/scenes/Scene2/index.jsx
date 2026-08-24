import React, {useRef, useMemo, useState, useLayoutEffect, useEffect, Suspense} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {
     Html,
     MeshPortalMaterial,
     OrbitControls,
     PerspectiveCamera,
     Stars, useFont,
     useGLTF,
     useMatcapTexture
} from "@react-three/drei";
import * as THREE from "three";
import { animate } from 'animejs';
import 'animejs/adapters/three';
import {AnimatedText} from "../Scene3/index.jsx";


export function AnimatedTorus({ scale = 0.5, position = [0, 0, 0], rotation = [0, 0, 0] }) {
     const meshRef = useRef();

     const uniforms = useMemo(() => ({
          torus: { value: 2.0 },
          tube: { value: 0.2 }
     }), []);

     const handleBeforeCompile = useMemo(() => {
          return (shader) => {
               shader.uniforms.torus = uniforms.torus;
               shader.uniforms.tube = uniforms.tube;
               shader.vertexShader = `
        uniform float torus;
        uniform float tube;
        ${shader.vertexShader}
      `.replace(
                    `#include <begin_vertex>`,
                    `#include <begin_vertex>
        vec2 normalizedRadius = normalize(position.xy);
        vec3 nominalCenter = vec3(normalizedRadius * 2., 0.);
        vec3 dirFromNominalCenter = normalize(position - nominalCenter);
        vec3 tubeCenter = vec3(normalizedRadius * torus, 0.);
        vec3 tubeRadius = dirFromNominalCenter * tube;
        transformed = tubeCenter + tubeRadius;`
               );
          };
     }, [uniforms]);

     useFrame((state) => {
          const t = (state.clock.getElapsedTime() % 2) / 2;
          uniforms.torus.value = THREE.MathUtils.lerp(2, 3.3, t);
     });

     return (
          <mesh ref={meshRef} scale={scale} position={position} rotation={rotation}>
               <torusGeometry args={[2, 1, 36, 72]} />
               <meshLambertMaterial color="lightyellow" onBeforeCompile={handleBeforeCompile} />
          </mesh>
     );
}

const MODELS_DATA = [
     {
          id: 0,
          url: '/model/scene2/Prop.glb',
          position: [-2.4, -1.2, 5.2],
          rotation: [1 + Math.PI / 2, 0, 1 + Math.PI / 2],
          scale: 1.5,
          annotation: {
               title: 'Doka Eurex',
               material: 'High-strength steel. The entire structure is hot-dip galvanized.',
               construction: 'Telescopic tubular structure with through-hole adjustment (jack stand)',
               load: 'Increased load-bearing capacity (load-bearing class EN 1065). The Eurex 20 series posts are guaranteed to withstand a load of at least 20 kN.'
          }
     },
     {
          id: 1,
          url: '/model/scene2/Impossible.glb',
          position: [3, -1, 4.5],
          rotation: [6.4 + Math.PI / 20, 5 + Math.PI / 24, 4.8 + Math.PI / 2],
          scale: 1.5,
          annotation: {
               title: 'Doka Dokaflex',
               material: 'Galvanized high-strength steel (Doka Eurex telescopic props and tripods) combined with glued-laminated timber',
               construction: 'A modular beam-and-column structure with variable geometry.',
               load: 'The pressure of fresh concrete and the weight of the rebar create a force ranging from 25 to 50 kN/m², depending on the thickness of the stair’s load-bearing slab (“flight”)'
          }
     },
     {
          id: 2,
          url: '/model/scene2/Concrete.glb',
          position: [2, 1, 4.5],
          rotation: [5.2 + Math.PI / 2, 5.2 + Math.PI / 2, 5 + Math.PI / 2],
          scale: 1.5,
          annotation: {
               title: 'Doka Coffer Forms',
               material: 'High-strength, heat-resistant ABS plastic or polypropylene',
               construction: ' A modular, collapsible system with void formers.',
               load: 'on average, from 30 to 60 kN/m² in the area of the load-bearing beams (ribs)'
          }
     },
     {
          id: 3,
          url: '/model/scene2/Wall.glb',
          position: [-2.8, 0.9, 5.5],
          rotation: [0.4, 4.2, 0],
          scale: 1.2,
          annotation: {
               title: 'Alu-Framax Xlife',
               material: 'Heavy-gauge, high-strength steel, galvanized inside and out, with a powder-coated finish',
               construction: 'Modular large-panel frame formwork',
               load: 'Designed to withstand the total hydrostatic pressure of fresh concrete mix over the entire height of the formwork—up to 80 kN/m²'
          }
     },
     {
          id: 4,
          url: '/model/scene2/Column.glb',
          position: [-1.5, 1, 4.5],
          rotation: [0.5, 1 + Math.PI / 2, 0.2],
          scale: 1.5,
          annotation: {
               title: 'DokaXlight',
               material: 'High-strength, lightweight aluminum alloy with a protective powder coating.',
               construction: ' Small-panel, frame-type modular formwork for manual assembly (Handset Formwork)',
               load: 'The maximum allowable pressure for fresh concrete mix is up to 50 kN/m² for vertical structures (walls and columns)'
          }
     }
];

export function InteractiveModel({ config, isActive, onClick }) {
     const { scene } = useGLTF(config.url);
     const [matcapTexture] = useMatcapTexture('9B9994_E1E0DB_474643_544C4C', 1024);

     const floatGroupRef = useRef();
     const spinGroupRef = useRef();
     const scaleGroupRef = useRef();
     const currentOffsetY = useRef(0);

     // 1. Изоляция сцены для предотвращения конфликтов GLTF-кэша
     const clonedScene = useMemo(() => scene.clone(true), [scene]);

     const matcapMaterial = useMemo(() => {
          return new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
     }, [matcapTexture]);

     // 2. Применение материала через useLayoutEffect
     useLayoutEffect(() => {
          clonedScene.traverse((child) => {
               if (child.isMesh) {
                    child.material = matcapMaterial;
               }
          });
     }, [clonedScene, matcapMaterial]);

     const floatParams = useMemo(() => ({
          speed: 1.1 + (config.id * 0.37) % 0.8,
          phase: config.id * 2.15,
          amplitude: 0.12 + (config.id * 0.07) % 0.15
     }), [config.id]);

     useFrame((state, delta) => {
          const safeDelta = Math.min(delta, 0.1);
          const t = state.clock.getElapsedTime();

          // Остановка плавания при активном состоянии
          const targetOffsetY = isActive
               ? 0
               : Math.sin(t * floatParams.speed + floatParams.phase) * floatParams.amplitude;

          currentOffsetY.current = THREE.MathUtils.lerp(currentOffsetY.current, targetOffsetY, safeDelta * 4);

          if (floatGroupRef.current) {
               floatGroupRef.current.position.y = currentOffsetY.current;
          }

          // Анимация вращения вокруг своей оси при активности
          if (spinGroupRef.current && isActive) {
               spinGroupRef.current.rotation.y += safeDelta * 0.6;
          }

          // Плавное масштабирование активного объекта
          if (scaleGroupRef.current) {
               const targetScale = isActive ? config.scale * 1.15 : config.scale;
               const currentScale = scaleGroupRef.current.scale.x;
               const lerpedScale = THREE.MathUtils.lerp(currentScale, targetScale, safeDelta * 6);
               scaleGroupRef.current.scale.setScalar(lerpedScale);
          }
     });

     const handlePointerOver = (e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'

     }

     const handlePointerOut = () => {
          document.body.style.cursor = 'auto'
     }

     return (
          // Базовая статическая позиция из конфига
          <group position={config.position} >
               {/* Группа для плавного плавания по Y */}
               <group ref={floatGroupRef}>
                    {/* Группа для поворота и масштабирования */}
                    <group rotation={config.rotation}>
                         <group ref={scaleGroupRef}>
                              <group
                                   ref={spinGroupRef}
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onClick(config.id);
                                   }}
                              >
                                   <primitive object={clonedScene} />
                              </group>
                         </group>
                    </group>
               </group>
          </group>
     );
}

function CameraRig({ activeId, controlsRef }) {
     const dummyCamPos = useMemo(() => new THREE.Vector3(), []);
     const dummyTarget = useMemo(() => new THREE.Vector3(), []);

     const defaultCamPos = useMemo(() => new THREE.Vector3(0, 0, 10), []);
     const defaultTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

     useFrame((state, delta) => {
          if (!controlsRef.current) return;

          if (activeId !== null) {
               const activeModel = MODELS_DATA.find((m) => m.id === activeId);
               const [x, y, z] = activeModel.position;

               dummyTarget.set(x, y, z);
               dummyCamPos.set(x, y, z + 3);
          } else {
               dummyTarget.copy(defaultTarget);
               dummyCamPos.copy(defaultCamPos);
          }

          state.camera.position.lerp(dummyCamPos, delta * 4);
          controlsRef.current.target.lerp(dummyTarget, delta * 4);
          controlsRef.current.update();
     });

     return null;
}

export function ConveyorBelt() {
     const materialRef = useRef();
     const boardWidth = 1.8;
     const boardLength = 24;
     const segmentsY = 120;

     const canvasTexture = useMemo(() => {
          const imgSources = ['/draw/1.jpg', '/draw/2.jpg', '/draw/3.jpg', '/draw/4.jpg', '/draw/5.jpg'];
          const canvas = document.createElement('canvas');
          const imageHeight = 1024;

          canvas.width = 1024;
          canvas.height = imageHeight * imgSources.length;
          const ctx = canvas.getContext('2d');

          imgSources.forEach((src, index) => {
               const img = new Image();
               img.src = src;
               img.onload = () => {
                    ctx.drawImage(img, 0, index * imageHeight, 1024, imageHeight);
                    texture.needsUpdate = true;
               };
          });

          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          return texture;
     }, []);

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
               } else if (y < -straightLength) {
                    const angle = ((-y - straightLength) / radius) * (Math.PI / 1.2);
                    position.setY(i, -(straightLength + Math.sin(angle) * radius));
                    position.setZ(i, z - (radius - Math.cos(angle) * radius));
               }
          }

          geo.computeVertexNormals();
          return geo;
     }, []);

     useFrame((_, delta) => {
          if (materialRef.current && materialRef.current.map) {
               materialRef.current.map.offset.y += delta * 0.04;
          }
     });

     return (
          <mesh geometry={geometry} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, 0, 0]}>
               <meshStandardMaterial ref={materialRef} map={canvasTexture} side={THREE.DoubleSide} roughness={0.2} />
          </mesh>
     );
}



const LabScene = ({ orbit, animated, portalCamera, orbitChange, transition, blend, camera }) => {
     const [activeId, setActiveId] = useState(2);
     const [cameraFocusId, setCameraFocusId] = useState(null);
     const controlsRef = useRef();

     const handleModelClick = (id) => {
          setActiveId((prev) => (prev === id ? null : id));
          setCameraFocusId((prev) => (prev === id ? null : id));
     };

     const handleBack = (e) => {
          e.stopPropagation();
          setActiveId(null);
          setCameraFocusId(null);
     };

     const activeModelData = useMemo(() => {
          return MODELS_DATA.find((m) => m.id === activeId);
     }, [activeId]);

     // ease: 'inExpo',
     function handleStartAnimation() {
          if (animated) {
               orbitChange(false);
               animate(portalCamera.current.position, {
                    z: [10, -3],
                    y: [0, 1.5],
                    duration: 3000,
                    alternate: true,
                    ease: 'inExpo',
                    onBegin: () => {
                         setTimeout(() => {
                              blend(0);
                              camera(false);
                              orbitChange(false);
                              transition();
                         }, 2900);
                    },
               });
          }
     }

     window.addEventListener('wheel', handleStartAnimation, { passive: true, once: true });

     return (
          <>
               <ambientLight intensity={1.5} />
               <directionalLight position={[5, 5, 5]} intensity={2} />
               <color attach="background" args={['#1a1a2e']} />

               {MODELS_DATA.map((config) => (
                    <InteractiveModel
                         key={config.id}
                         config={config}
                         isActive={activeId === config.id}
                         onClick={handleModelClick}
                    />
               ))}

               {activeModelData && (
                    <>
                         <AnimatedTorus
                              scale={[0.15, 0.15, 0.03]}
                              position={[
                                   activeModelData.position[0],
                                   activeModelData.position[1] - 1.0,
                                   activeModelData.position[2]
                              ]}
                              rotation={[Math.PI / 2, 0, 0]}
                         />

                         {orbit && (
                              <Html
                                   position={[
                                        activeModelData.position[0] + 1.2,
                                        activeModelData.position[1] + 0.5,
                                        activeModelData.position[2]
                                   ]}
                                   center
                                   distanceFactor={10}
                              >
                                   <div style={{
                                        position: 'relative',
                                        background: 'white',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid #A1A1A4',
                                        borderRadius: '8px',
                                        padding: '10px 12px 10px 28px',
                                        color: '#A1A1A4',
                                        width: '240px',
                                        fontFamily: 'Space Grotesk',
                                        fontSize: '7.7px',
                                        lineHeight: '1.4',
                                        pointerEvents: 'auto',
                                        boxShadow: '12px 8px 32px rgba(0,0,0,0.5)'
                                   }}>
                                        <button
                                             onClick={handleBack}
                                             style={{
                                                  position: 'absolute',
                                                  left: '8px',
                                                  top: '8px',
                                                  background: 'none',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                             }}
                                             title="Back"
                                        >
                                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M19 12H5" />
                                                  <path d="M12 19l-7-7 7-7" />
                                             </svg>
                                        </button>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0088cc', fontSize: '8.4px' }}>
                                             {activeModelData.annotation.title}
                                        </div>
                                        <p style={{ margin: '0 0 5px 0' }}>
                                             <strong>Material:</strong> {activeModelData.annotation.material}
                                        </p>
                                        <p style={{ margin: '0 0 5px 0' }}>
                                             <strong>Construction type:</strong> {activeModelData.annotation.construction}
                                        </p>
                                        <p style={{ margin: '0' }}>
                                             <strong>Load:</strong> {activeModelData.annotation.load}
                                        </p>
                                   </div>
                              </Html>
                         )}
                    </>
               )}

               <Stars radius={100} depth={50} count={5000} factor={4} saturation={2} fade speed={3} />
               <CameraRig activeId={cameraFocusId} controlsRef={controlsRef} />
               {orbit && <OrbitControls ref={controlsRef} />}
               <ConveyorBelt />

               <mesh position={[0, -0.5, -45]}>
                    <circleGeometry args={[18, 32]} />
                    <meshBasicMaterial
                         color="#0088cc"
                         transparent={true}
                         opacity={0.35}
                         blending={THREE.AdditiveBlending}
                         depthWrite={false}
                    />
               </mesh>

               <mesh position={[0, -0.5, -44]}>
                    <ringGeometry args={[10, 10.3, 32]} />
                    <meshBasicMaterial color={'black'} transparent opacity={0.4} />
               </mesh>
               <AnimatedText visible={animated} size={0.6} position={[-0.3, 5.9, -6.1]} text={'Scroll to next '} rotation={[0, 0, 0]} TextGap={0.48} />

               <fog attach="fog" args={['#031427', 10, 55]} />
          </>
     );
};
export default LabScene;
useFont.preload('/zb.json');

export function PortalToSceneTwo({onTransitionComplete}) {
     const [blend, setBlend] = useState(0);
     const [cameraDefault, setCameraDefault] = useState(false);
     const [orbit, setOrbit] = useState(false);
     const meshRef = useRef(null);
     const cameraRef = useRef();
     const [animateText, setAnimateText] = useState(false);

     // const handlePointerOver = (e) => {
     //      e.stopPropagation()
     //      // document.body.style.cursor = 'pointer'
     //
     // }
     //
     // const handlePointerOut = () => {
     //      // document.body.style.cursor = 'auto'
     // }

     const isAnimating = useRef(false);

     const goToScene = () => {

          if (isAnimating.current) return;
          isAnimating.current = true;

          document.body.style.cursor = 'auto';
          animate(meshRef.current, {
               scale: [1, 3],
               duration: 2000,
               ease: 'inOutExpo',
               onComplete: () => {
                    setBlend(1);
                    setCameraDefault(true);
                    setOrbit(true);
                    isAnimating.current = false;

                    setTimeout(() => {
                         setAnimateText(true);
                    },6000)
               },
          });
     };



     return (
          <mesh ref={meshRef} position={[1.393, 7.104, -10.86]}  rotation={[0, -115 * (Math.PI / 180), 0]} onClick={goToScene} >
               <circleGeometry args={[0.26, 64]} />
               <MeshPortalMaterial blend={blend}>
                    <PerspectiveCamera ref={cameraRef} makeDefault={cameraDefault} position={[0, 0, 10]} />
                     <LabScene transition={onTransitionComplete} portalCamera={cameraRef} orbit={orbit} orbitChange={setOrbit} blend={setBlend} camera={setCameraDefault} animated={animateText}   />
               </MeshPortalMaterial>
          </mesh>
     );
}
