import React, { useMemo, useRef, useEffect } from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {OrbitControls, Environment, Outlines, Float} from '@react-three/drei';
import {EffectComposer, Bloom, Vignette, Scanline} from '@react-three/postprocessing';
import * as THREE from 'three';
import {BlendFunction} from "postprocessing";

// --- CONFIG: Пресет Golden Twilight ---
const CONFIG = {
     // Монолиты
     monolithCount: 3,
     monolithHeight: 22,
     monolithWidth: 3.2,
     monolithGap: 1.2,
     metalness: 0.85,
     roughness: 0.22,
     color: '#f0e0d0',

     // Небо и звезды
     skyTopColor: '#0f0814',
     skyMidColor: '#301b2a',
     skyBottomColor: '#8c4333',
     starCount: 1200,
     starSpeed: 0.5,

     // Облака
     cloudDensity: 28,
     cloudOpacity: 0.88,
     cloudSpeed: 0.25,
     cloudColor: '#ffc885',
     cloudShadowColor: '#261219',

     // Освещение
     keyLightIntensity: 4.0,
     keyLightColor: '#ffdaaa',
     fillLightIntensity: 0.7,
};

// --- Вспомогательные функции генерации текстур ---
function generateCloudTexture(width = 512, height = 512) {
     const canvas = document.createElement('canvas');
     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext('2d');
     if (!ctx) return new THREE.CanvasTexture(canvas);

     ctx.clearRect(0, 0, width, height);

     const drawPuff = (cx, cy, r, opacity, hardness = 0.2) => {
          const grad = ctx.createRadialGradient(cx, cy, r * hardness, cx, cy, r);
          grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.7})`);
          grad.addColorStop(0.85, `rgba(255, 255, 255, ${opacity * 0.2})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
     };

     const center = width / 2;
     drawPuff(center, center, width * 0.38, 0.9, 0.2);

     let seed = 12345;
     const rand = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
     };

     for (let i = 0; i < 28; i++) {
          const angle = rand() * Math.PI * 2;
          const dist = rand() * (width * 0.22);
          const radius = width * (0.12 + rand() * 0.22);
          const opacity = 0.3 + rand() * 0.6;
          drawPuff(center + Math.cos(angle) * dist, center + Math.sin(angle) * dist, radius, opacity, 0.15);
     }

     const texture = new THREE.CanvasTexture(canvas);
     texture.needsUpdate = true;
     return texture;
}

function generateStarTexture() {
     const canvas = document.createElement('canvas');
     canvas.width = 64;
     canvas.height = 64;
     const ctx = canvas.getContext('2d');
     if (ctx) {
          ctx.clearRect(0, 0, 64, 64);
          const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
          grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
          grad.addColorStop(0.5, 'rgba(255, 220, 180, 0.4)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 64, 64);
     }
     const texture = new THREE.CanvasTexture(canvas);
     texture.needsUpdate = true;
     return texture;
}

// --- 1. Небо и звездное поле ---
const SkyShaderMaterial = {
     uniforms: {
          uTopColor: { value: new THREE.Color(CONFIG.skyTopColor) },
          uMidColor: { value: new THREE.Color(CONFIG.skyMidColor) },
          uBottomColor: { value: new THREE.Color(CONFIG.skyBottomColor) },
          uTime: { value: 0 },
     },
     vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
     fragmentShader: `
    uniform vec3 uTopColor;
    uniform vec3 uMidColor;
    uniform vec3 uBottomColor;
    uniform float uTime;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      float h = clamp(vUv.y, 0.0, 1.0);
      vec3 color;
      if (h < 0.45) {
        float t = h / 0.45;
        color = mix(uBottomColor, uMidColor, smoothstep(0.0, 1.0, t));
      } else {
        float t = (h - 0.45) / 0.55;
        color = mix(uMidColor, uTopColor, smoothstep(0.0, 1.0, t));
      }
      color += (hash(gl_FragCoord.xy + fract(uTime * 0.01)) - 0.5) * 0.012;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function BackgroundSky() {
     const shaderRef = useRef();
     const starsRef = useRef();
     const starTexture = useMemo(() => generateStarTexture(), []);

     const { positions, scales, phases } = useMemo(() => {
          const count = CONFIG.starCount;
          const pos = new Float32Array(count * 3);
          const sc = new Float32Array(count);
          const ph = new Float32Array(count);
          const radius = 120;

          for (let i = 0; i < count; i++) {
               const u = Math.random();
               const v = Math.random() * 0.75 + 0.25;
               const theta = u * Math.PI * 2;
               const phi = Math.acos(2 * v - 1);

               pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
               pos[i * 3 + 1] = radius * Math.cos(phi) + 15;
               pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

               const isBright = Math.random() < 0.03;
               sc[i] = isBright ? Math.random() * 1.8 + 2.2 : Math.random() * 0.8 + 0.5;
               ph[i] = Math.random() * Math.PI * 2;
          }
          return { positions: pos, scales: sc, phases: ph };
     }, []);

     useFrame((state) => {
          if (shaderRef.current) {
               shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
          }
          if (starsRef.current) {
               starsRef.current.rotation.y = state.clock.getElapsedTime() * 0.0015;
               const geom = starsRef.current.geometry;
               const sizesAttr = geom.attributes.size;
               if (sizesAttr) {
                    const time = state.clock.getElapsedTime() * 1.5;
                    const array = sizesAttr.array;
                    for (let i = 0; i < CONFIG.starCount; i++) {
                         array[i] = scales[i] * (Math.sin(time + phases[i]) * 0.35 + 0.85);
                    }
                    sizesAttr.needsUpdate = true;
               }
          }
     });

     return (
          <>
               <mesh scale={[-1, 1, 1]} position={[0, 10, 0]}>
                    <sphereGeometry args={[140, 32, 32]} />
                    <shaderMaterial ref={shaderRef} args={[SkyShaderMaterial]} side={THREE.BackSide} depthWrite={false} />
               </mesh>

               <points ref={starsRef}>
                    <bufferGeometry>
                         <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                         <bufferAttribute attach="attributes-size" args={[scales, 1]} />
                    </bufferGeometry>
                    <pointsMaterial map={starTexture} size={1.5} sizeAttenuation transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
               </points>
          </>
     );
}

// --- 2. Облака ---
const CloudShaderMaterial = {
     uniforms: {
          uMap: { value: null },
          uCloudColor: { value: new THREE.Color(CONFIG.cloudColor) },
          uShadowColor: { value: new THREE.Color(CONFIG.cloudShadowColor) },
          uOpacity: { value: CONFIG.cloudOpacity },
     },
     vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
     fragmentShader: `
    uniform sampler2D uMap;
    uniform vec3 uCloudColor;
    uniform vec3 uShadowColor;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(uMap, vUv);
      if (texColor.a < 0.01) discard;
      float lightFactor = smoothstep(0.15, 0.85, vUv.y + 0.15);
      vec3 finalColor = mix(uShadowColor, uCloudColor, lightFactor);
      gl_FragColor = vec4(finalColor, texColor.a * uOpacity);
    }
  `,
};

function CloudLayer() {
     const groupRef = useRef();
     const cloudTexture = useMemo(() => generateCloudTexture(512, 512), []);

     const cloudMaterial = useMemo(() => {
          return new THREE.ShaderMaterial({
               ...CloudShaderMaterial,
               uniforms: {
                    uMap: { value: cloudTexture },
                    uCloudColor: { value: new THREE.Color(CONFIG.cloudColor) },
                    uShadowColor: { value: new THREE.Color(CONFIG.cloudShadowColor) },
                    uOpacity: { value: CONFIG.cloudOpacity },
               },
               transparent: true,
               depthWrite: false,
               side: THREE.DoubleSide,
          });
     }, [cloudTexture]);

     const cloudPuffs = useMemo(() => {
          const puffs = [];
          let s = 98765;
          const rand = () => {
               s = (s * 9301 + 49297) % 233280;
               return s / 233280;
          };

          for (let i = 0; i < CONFIG.cloudDensity; i++) {
               const isLeft = i % 2 === 0;
               const x = isLeft ? -10 - rand() * 18 : 10 + rand() * 18;
               const y = -2 + rand() * 28;
               const z = -5 + (rand() - 0.5) * 12;
               const size = 11 + rand() * 16;
               puffs.push({
                    position: [x, y, z],
                    scale: [size, size * 0.75, 1],
                    rotationZ: (rand() - 0.5) * 0.8,
                    speed: 0.8 + rand() * 0.5,
               });
          }
          return puffs;
     }, []);

     useFrame((state) => {
          if (groupRef.current) {
               const time = state.clock.getElapsedTime() * CONFIG.cloudSpeed * 0.1;
               groupRef.current.children.forEach((child, idx) => {
                    const puff = cloudPuffs[idx];
                    if (puff) {
                         child.position.x = puff.position[0] + Math.sin(time * puff.speed + idx) * 0.8;
                         child.position.y = puff.position[1] + Math.cos(time * 0.5 * puff.speed + idx) * 0.4;
                    }
               });
          }
     });

     return (
          <group ref={groupRef}>
               {cloudPuffs.map((puff, i) => (
                    <mesh key={i} position={puff.position} scale={puff.scale} rotation={[0, 0, puff.rotationZ]} material={cloudMaterial}>
                         <planeGeometry args={[1, 1]} />
                    </mesh>
               ))}
          </group>
     );
}

// --- 3. Монолиты с анимацией роста по оси Y ---
function Monoliths() {
     const meshRefs = useRef([]);
     const animTime = useRef(0);

     const material = useMemo(() => {
          return new THREE.MeshPhysicalMaterial({
               color: new THREE.Color(CONFIG.color),
               metalness: CONFIG.metalness,
               roughness: CONFIG.roughness,
               clearcoat: 0.4,
               clearcoatRoughness: 0.1,
               reflectivity: 1.5,
               envMapIntensity: 1.5,
          });
     }, []);

     const monolithData = useMemo(() => {
          const list = [];
          const count = CONFIG.monolithCount;
          const baseW = CONFIG.monolithWidth;
          const baseH = CONFIG.monolithHeight;
          const baseD = baseW * 1.05;
          const gap = CONFIG.monolithGap;

          for (let i = 0; i < count; i++) {
               const offsetIndex = i - (count - 1) / 2;
               const x = offsetIndex * (baseW + gap);
               const isCenter = Math.abs(offsetIndex) < 0.1;
               const height = isCenter ? baseH : baseH * 0.92;
               const z = isCenter ? 0.4 : -0.2;
               const width = isCenter ? baseW * 1.08 : baseW * 0.96;

               list.push({
                    id: i,
                    basePosition: [x, -10, z],
                    height,
                    args: [width, height, baseD],
                    delay: Math.abs(offsetIndex) * 0.2, // Каскадный задержка роста
               });
          }
          return list;
     }, []);

     // Анимация роста от 0% до 100% при появлении
     const START_DELAY = 2.0;

     useFrame((_, delta) => {
          animTime.current += delta;

          // 1. Если общее время меньше глобальной задержки, ничего не делаем
          if (animTime.current < START_DELAY) {
               return;
          }

          // 2. Вычитаем глобальную задержку, чтобы отсчет анимации монолитов начался с 0
          const globalElapsed = animTime.current - START_DELAY;

          monolithData.forEach((item, index) => {
               const meshGroup = meshRefs.current[index];
               if (!meshGroup) return;

               // 3. Считаем время с учетом индивидуального каскадного дилея
               const elapsed = globalElapsed - item.delay;

               if (elapsed <= 0) {
                    meshGroup.scale.y = 0;
                    return;
               }

               const duration = 1.6; // Длительность роста одного монолита в секундах
               const rawProgress = Math.min(1, elapsed / duration);
               const easeOutProgress = 1 - Math.pow(1 - rawProgress, 3);

               meshGroup.scale.y = easeOutProgress;
          });
     });
     return (
          <group position={[0, 0, 0]}>
               {monolithData.map((item, index) => (
                    /* Пивот закрепите у основания (-10), чтобы масштабирование scale.y шло снизу вверх */
                    <group
                         key={item.id}
                         position={item.basePosition}
                         ref={(el) => (meshRefs.current[index] = el)}
                         scale={[1, 0, 1]} // Начинаем с 0% по оси Y
                    >
                         <mesh position={[0, item.height / 2, 0]} material={material} castShadow receiveShadow>
                              <boxGeometry args={item.args} />
                         </mesh>
                    </group>
               ))}

               {/* Тень на земле */}
               <mesh position={[0, -10.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <shadowMaterial opacity={0.6} />
               </mesh>
          </group>
     );
}

function CameraController() {
     const { camera } = useThree();
     const controlsRef = useRef();

     const targetPos = useMemo(() => new THREE.Vector3(0, -7.5, 9.5), []);
     const targetLookAt = useMemo(() => new THREE.Vector3(0, 6.5, 0), []);

     useFrame((_, delta) => {
          if (controlsRef.current) {
               const t = Math.min(delta * 2.5, 1);
               camera.position.lerp(targetPos, t);
               controlsRef.current.target.lerp(targetLookAt, t);
               controlsRef.current.update();
          }
     });

     return (
          <OrbitControls
               ref={controlsRef}
               enablePan
               enableZoom
               enableRotate
               rotateSpeed={0.8}
               zoomSpeed={0.8}
               minDistance={4}
               maxDistance={45}
          />
     );
}

export function ExtrudedArrow() {
     const shape = useMemo(() => {
          const s = new THREE.Shape();
          const sw = 1.4;
          const sh = 2.2;
          const hw = 3.2;
          const hh = 2.2;
          const totalH = sh + hh;
          const hHalf = totalH / 2;
          const yTop = hHalf;
          const yJunc = hHalf - sh;
          const yBot = -hHalf;

          s.moveTo(-sw / 2, yTop);
          s.lineTo(sw / 2, yTop);
          s.lineTo(sw / 2, yJunc);
          s.lineTo(hw / 2, yJunc);
          s.lineTo(0, yBot);
          s.lineTo(-hw / 2, yJunc);
          s.lineTo(-sw / 2, yJunc);
          s.closePath();

          return s;
     }, []);

     const extrudeSettings = useMemo(() => ({
          depth: 0.7,
          bevelEnabled: true,
          bevelThickness: 0.22,
          bevelSize: 0.18,
          bevelSegments: 8,
          steps: 2,
          curveSegments: 16,
     }), []);

     // Обязательный возврат JSX для React-компонента
     return (
          <mesh>
               <extrudeGeometry args={[shape, extrudeSettings]} />
               <meshPhysicalMaterial
                    color="#e0f2fe"
                    roughness={0.1}
                    metalness={0.1}
                    clearcoat={0}
                    transmission={0.85}
               />
               <Outlines thickness={0.08} color="#ffffff" />
          </mesh>
     );
} // <- Эта скобка отсутствовала

// --- Главный экспортируемый компонент СЦЕНЫ (для вставки ВНУТРЬ вашего <Canvas>) ---
export default function GoldenMonolithScene() {
     const { camera } = useThree()

     useEffect(() => {
          // Меняем позицию и параметры напрямую
          camera.position.set(0, -7.5, 9.5)
          camera.fov = 52

          // Обязательно обновляем матрицу проекции после изменений
          camera.updateProjectionMatrix()
     }, [camera])
     return (
          <>
               {/* Фон неба и звездное поле */}
               <BackgroundSky />

               {/* Источники света пресета Golden Twilight */}
               <ambientLight intensity={0.25} />
               <directionalLight position={[14, 22, 16]} intensity={CONFIG.keyLightIntensity} color={CONFIG.keyLightColor} castShadow />
               <directionalLight position={[-14, -6, 10]} intensity={CONFIG.fillLightIntensity} color="#4a2a30" />
               <directionalLight position={[0, 25, -10]} intensity={0.8} color="#ffdaaa" />
               <Environment preset="night" environmentIntensity={0.8} />

               {/* Анимированные монолиты */}
               <Monoliths />

               {/* Облака */}
               <CloudLayer />
               <CameraController />
               {/* Камера и управление OrbitControls */}

               <Float
                    floatingRange={[-0.2, 0.2]}  // Амплітуда руху по Y
                    speed={8.5}                  // Швидкість анімації
                    floatIntensity={2}           // Множник висоти покачивания
                    rotationIntensity={0}        // ПОВНІСТЮ ВИМИКАЄМО НАХИЛ ПРИ ПАРІННІ
                    axis="y"                     // СУВОРO ФІКСУЄМО РУХ ЛИШЕ ПО ОСІ Y
               >
                    <group position={[7, -1, 2]} rotation={[Math.PI / 4, 0, 0]} scale={0.4}>
                         <ExtrudedArrow />
                    </group>
               </Float>

               {/* Пост-обработка (Glow & Vignette) */}
               <EffectComposer>
                    <Bloom intensity={0.8} luminanceThreshold={0.75} luminanceSmoothing={0.85} mipmapBlur />
                    <Vignette eskil={false} offset={0.2} darkness={0.8} />
               </EffectComposer>
          </>
     );
}
