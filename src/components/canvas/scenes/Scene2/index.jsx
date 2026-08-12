import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
     Html,
     MeshPortalMaterial,
     OrbitControls,
     PerspectiveCamera,
     Stars,
     useGLTF,
     useMatcapTexture
} from "@react-three/drei";
import * as THREE from "three";

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

function InteractiveModel({ config, isActive, onClick }) {
     const { scene } = useGLTF(config.url);
     const [matcapTexture] = useMatcapTexture('9B9994_E1E0DB_474643_544C4C', 1024);
     const groupRef = useRef();
     const meshRef = useRef();

     const matcapMaterial = useMemo(() => {
          return new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
     }, [matcapTexture]);

     useMemo(() => {
          scene.traverse((child) => {
               if (child.isMesh) {
                    child.material = matcapMaterial;
               }
          });
     }, [scene, matcapMaterial]);

     const currentOffsetY = useRef(0);

     const floatParams = useMemo(() => ({
          speed: 1.1 + (config.id * 0.37) % 0.8,
          phase: config.id * 2.15,
          amplitude: 0.12 + (config.id * 0.07) % 0.15
     }), [config.id]);

     useFrame((state, delta) => {
          const t = state.clock.getElapsedTime();
          const targetOffsetY = isActive
               ? 0
               : Math.sin(t * floatParams.speed + floatParams.phase) * floatParams.amplitude;

          currentOffsetY.current = THREE.MathUtils.lerp(currentOffsetY.current, targetOffsetY, delta * 4);

          if (groupRef.current) {
               groupRef.current.position.set(
                    config.position[0],
                    config.position[1] + currentOffsetY.current,
                    config.position[2]
               );
          }

          if (isActive && meshRef.current) {
               meshRef.current.rotation.y += delta * 0.5;
          }
     });

     return (
          <group ref={groupRef} position={config.position}>
               <mesh
                    ref={meshRef}
                    rotation={config.rotation}
                    onClick={(e) => {
                         e.stopPropagation();
                         onClick(config.id);
                    }}
               >
                    <primitive object={scene} scale={config.scale} position={[0, 0, 0]} />
               </mesh>
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

const SceneTwo = () => {
     const [activeId, setActiveId] = useState(null);
     const controlsRef = useRef();

     const handleModelClick = (id) => {
          setActiveId((prev) => (prev === id ? null : id));
     };

     const activeModelData = useMemo(() => {
          return MODELS_DATA.find((m) => m.id === activeId);
     }, [activeId]);

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
                              scale={[0.15, 0.15, 0.03]} // [X, Y, Z] — уменьшение Z сплющит торус по высоте
                              position={[
                                   activeModelData.position[0],
                                   activeModelData.position[1] - 1.0,
                                   activeModelData.position[2]
                              ]}
                              rotation={[Math.PI / 2, 0, 0]}
                         />

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
                                   background: 'white',
                                   backdropFilter: 'blur(8px)',
                                   border: '1px solid #A1A1A4',
                                   borderRadius: '8px',
                                   padding: '10px 12px',
                                   color: '#A1A1A4',
                                   width: '240px',
                                   fontFamily: 'Space Grotesk',
                                   // font-family: "Space Grotesk", sans-serif;
                                   fontSize: '7.7px',
                                   lineHeight: '1.4',
                                   pointerEvents: 'none',
                                   boxShadow: '12px 8px 32px rgba(0,0,0,0.5)'
                              }}>
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
                    </>
               )}

               <Stars radius={100} depth={50} count={5000} factor={4} saturation={2} fade speed={3} />
               <CameraRig activeId={activeId} controlsRef={controlsRef} />
               <OrbitControls ref={controlsRef} makeDefault />
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
               <fog attach="fog" args={['#031427', 10, 55]} />
          </>
     );
};

export default SceneTwo;

export function PortalToSceneTwo() {
     return (
          <mesh position={[1.393, 7.104, -10.86]} rotation={[0, -115 * (Math.PI / 180), 0]}>
               <circleGeometry args={[0.26, 64]} />
               <MeshPortalMaterial blend={1}>
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                    <SceneTwo />
               </MeshPortalMaterial>
          </mesh>
     );
}
