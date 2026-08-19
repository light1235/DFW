import React, {useRef, useMemo, useState, useEffect} from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import FlagText from "./text.jsx";
import LevelModel from "./Leveler.jsx";
import Formwork from "./Formwork.jsx";
import {Model} from "./levels.jsx";
import RainbowLaser, {ConeLaser} from "./Laser.jsx";
import SplineEditor from "../../CameraController.jsx";
import {ScrollCameraPath} from "../../ViewportCanvas.jsx";
import {PortalToSceneTwo} from "../Scene2/index.jsx";
import PortalText from "./PortalText.jsx";


export function CameraParallax({ intensity = 0.5, factor = 0.05 }) {
     // Хранилище для исходной позиции камеры
     const initialPosition = useRef(null);

     useFrame((state) => {
          const { camera, pointer } = state;

          // Запоминаем начальные координаты камеры при первом кадре
          if (!initialPosition.current) {
               initialPosition.current = camera.position.clone();
          }

          // Рассчитываем целевую позицию: Исходная координата + Смещение от мыши
          const targetX = initialPosition.current.x + pointer.x * intensity;
          const targetY = initialPosition.current.y + pointer.y * intensity;

          // Плавное перемещение (lerp) к новой позиции
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, factor);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, factor);
     });

     return null;
}

function SmartRectLight() {
     const lightRef = useRef();
     return (
          <rectAreaLight
               ref={lightRef}
               intensity={10}
               width={10}
               height={7}
               color={'white'}
               position={[-12, 10, 10]}
          />
     );
}


const EtherealCosmicVeil = () => {
  const materialRef = useRef();
     const controlsRef = React.useRef();


  // Vertex Shader
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    uniform float uTime;
    uniform float uDisplacementHeight;
    uniform float uDisplacementSpeed;
    uniform float uNoiseScale;

    float noise(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float smoothNoise(in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(noise(i + vec2(0.0,0.0)), noise(i + vec2(1.0,0.0)), u.x),
        mix(noise(i + vec2(0.0,1.0)), noise(i + vec2(1.0,1.0)), u.x), 
        u.y
      );
    }

    float fbm(in vec2 st) {
      float value = 0.0;
      float amp = 0.5;
      vec2 p = st;
      for (int i = 0; i < 3; i++) {
        value += amp * smoothNoise(p);
        p = p * 2.0 + vec2(1.7, 9.2);
        amp *= 0.5;
      }
      return value;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      if (uDisplacementHeight > 0.001) {
        vec2 dispUv = uv * (uNoiseScale * 0.3) + vec2(uTime * uDisplacementSpeed * 0.05);
        float disp = fbm(dispUv);
        pos.z += disp * uDisplacementHeight;
      }

      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Fragment Shader
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uBgColor;
    uniform vec3 uSmokeColor;
    uniform vec3 uAccentColor;
    uniform float uNoiseScale;
    uniform float uNoiseSpeed; // ✅ Добавлено объявление
    uniform int uNoiseOctaves;
    uniform float uFadeStart;
    uniform float uFadeEnd;
    uniform float uSmokeOpacity;
    uniform vec2 uShaderPosition;

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    float noise(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float smoothNoise(in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(noise(i + vec2(0.0,0.0)), noise(i + vec2(1.0,0.0)), u.x),
        mix(noise(i + vec2(0.0,1.0)), noise(i + vec2(1.0,1.0)), u.x), 
        u.y
      );
    }

    float fbm(in vec2 st, int octaves) {
      float value = 0.0;
      float amp = 0.5;
      vec2 p = st;
      for (int i = 0; i < 4; i++) {
        if (i >= octaves) break;
        value += amp * smoothNoise(p);
        p = p * 2.0 + vec2(4.2, 1.8);
        amp *= 0.5;
      }
      return value;
    }

    void main() {
      // ✅ Теперь uTime умножается на uNoiseSpeed
      vec2 cloudUV = vUv * uNoiseScale + vec2(uTime * uNoiseSpeed * 0.8, uTime * uNoiseSpeed * 0.4);
      
      // 2. Многооктавный FBM шум
      float smokePattern = fbm(cloudUV, uNoiseOctaves);

      // 3. Расстояние от центра
      vec2 localPos = vWorldPosition.xz - uShaderPosition;
      float distanceFromCenter = length(localPos);
      
      // 4. Мягкое сглаживание у краев
      float fade = smoothstep(uFadeStart, uFadeEnd, distanceFromCenter);

      // 5. Градиент тумана "Эфирная космическая вуаль"
      vec3 baseSmoke = mix(uSmokeColor, uAccentColor, smokePattern * 0.25);
      vec3 finalColor = mix(baseSmoke, uBgColor, fade);

      // 6. Прозрачность и гашение у краев
      float finalAlpha = (1.0 - fade) * smokePattern * uSmokeOpacity;
      finalAlpha = clamp(finalAlpha, 0.0, 1.0);

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.5), finalAlpha);
    }
  `;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBgColor: { value: new THREE.Color('#090514') },      // Глубокий фиолетово-чёрный фон
      uSmokeColor: { value: new THREE.Color('#c084fc') },   // Фиолетово-сиреневый туман
      uAccentColor: { value: new THREE.Color('#f43f5e') },  // Розово-малиновый акцент
      uNoiseScale: { value: 30.0 },                         // Масштаб шума: 17
      uNoiseOctaves: { value: 4 },                          // 4 октавы
      uDisplacementHeight: { value: 0.0 },                  // Высота рельефа: 0
      uDisplacementSpeed: { value: 0.0 },
      uNoiseSpeed: { value: 0.12 },                          // 👈 Теперь при 0.0 анимация СТОИТ!
      uFadeStart: { value: 10.0 },
      uFadeEnd: { value: 30.0 },                            // Гашение на краях 60м
      uSmokeOpacity: { value: 0.9 },
      uShaderPosition: { value: new THREE.Vector2(10, 0) },
    }),
    []
  );



     useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }

  });
     const [activeScrollCamera, setActiveScrollCamera] = useState(false);
     const [isLaserOn, setIsLaserOn] = useState(false);
     const [portalTExt, setPortalTExt] = useState(false);

     useEffect(() => {
          setTimeout(() => {
               setIsLaserOn(true)
          },3000)
     })

  return (
    <>
         {/*<CameraParallax intensity={1} factor={0.05} />*/}
      <group position={[-6, 5, 16]} rotation={[-0.1, 0, 0]}>
        <FlagText active={setActiveScrollCamera} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0, 0]}>
        <planeGeometry args={[60, 60, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
           <SmartRectLight/>
           <ConeLaser
                active={isLaserOn}
                radius={0.3}
                height={21.0}
                thetaLength={6.6}
                emissiveIntensity={3.5}
                speed={1.5}
                position={[-3, 4.6, 6.2]}
                rotation={[40, 100, Math.PI / 1.67]}
           />
           <Model rotation={[-Math.PI / -2.0, 0, 0]} scale={7} position={[-12, 10, 3.8]} inputRotationZ={-65}/>
           <Formwork rotation={[-Math.PI / -2.0, 1, 0]} scale={0.0041} position={[3, 3, 0.8]}/>
           <group position={[-10.1, 9.4, 6.0]}     rotation={[Math.PI / 2, -Math.PI / 1.5, 0]}
                  anchorX="center"
                  anchorY="middle">
                <PortalText />
           </group>
           {activeScrollCamera &&   <ScrollCameraPath portal={setPortalTExt} />}

      </mesh>
    </>

  );
};

export default EtherealCosmicVeil;
