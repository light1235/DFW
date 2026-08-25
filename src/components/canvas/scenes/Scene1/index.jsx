import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import FlagText from "./text.jsx";
import Formwork from "./Formwork.jsx";
import { Model } from "./levels.jsx";
import { ConeLaser } from "./Laser.jsx";
import PortalText from "./PortalText.jsx";
import { ScrollCameraPath } from "../../ViewportCanvas.jsx";
import { useIsMobile, useIsTouch } from "../../../../hooks/useIsMobile.js";
// OPT: убраны неиспользуемые импорты RainbowLaser, SplineEditor и
// PortalToSceneTwo. Последний создавал циклическую зависимость
// Scene1 -> Scene2 -> Scene1 (Scene2 импортирует ExpoScene).


export function CameraParallax({ intensity = 0.5, factor = 0.05 }) {
  // Хранилище для исходной позиции камеры
  const initialPosition = useRef(null);

  // Параллакс от указателя имеет смысл только для мыши, которая висит над
  // сценой без нажатия. На тач-устройстве pointer обновляется лишь в момент
  // касания, поэтому во время свайпа камера получала резкий рывок в сторону
  // пальца, накладывающийся на полёт по сплайну. Отключаем.
  const isTouch = useIsTouch();

  useFrame((state) => {
    if (isTouch) return;

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

// OPT: убран неиспользуемый lightRef + memo, чтобы свет не пересоздавался
// при ре-рендерах родителя. Параметры света не изменились.
const SmartRectLight = React.memo(function SmartRectLight() {
  return (
    <rectAreaLight
      intensity={10}
      width={10}
      height={7}
      color={'white'}
      position={[-12, 10, 10]}
    />
  );
});

// -----------------------------------------------------------------------------
// OPT: исходники шейдеров поднялись на уровень модуля.
// Раньше это были два новых строковых литерала на каждом рендере ExpoScene.
// Текст шейдеров идентичен прежнему.
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// OPT: args и трансформы, которые раньше были инлайн-массивами.
// Каждый рендер создавал новые массивы -> R3F пересобирал planeGeometry
// и заново применял position/rotation. Значения не изменены.
// -----------------------------------------------------------------------------
const PLANE_ARGS = [60, 60, 64, 64];
const PLANE_ROTATION = [-Math.PI / 2, 0, 0];
const PLANE_POSITION = [14, 0, 0];

const LASER_POSITION = [-3, 4.6, 6.2];
const LASER_ROTATION = [40, 100, Math.PI / 1.67];

const FLAG_GROUP_POSITION = [-6, 5, 16];
// Мобильный вариант: X сдвинут в 0.
//
// Камера стартует в [0, 10, 45], то есть её ось зрения лежит в плоскости
// x = 0 — центр экрана по горизонтали приходится ровно на x = 0 на любой
// глубине. Блок текста шириной ~15 юнитов при десктопном обзоре (видимая
// полуширина ~14 юнитов на глубине z = 16) влезал даже со смещением -6.
// В портрете полуширина падает до ~6.4 юнитов, поэтому левая половина
// текста оказывалась за краем экрана: было видно "level" вместо
// "Next level" и "ding." вместо "building.".
const FLAG_GROUP_POSITION_MOBILE = [0, 5, 16];
const FLAG_GROUP_ROTATION = [-0.1, 0, 0];

const MODEL_ROTATION = [-Math.PI / -2.0, 0, 0];
const MODEL_POSITION = [-12, 10, 3.8];

const FORMWORK_ROTATION = [-Math.PI / -2.0, 1, 0];
const FORMWORK_POSITION = [3, 3, 0.8];

const PORTAL_POSITION = [-10.1, 9.4, 6.0];
const PORTAL_ROTATION = [Math.PI / 2, -Math.PI / 1.5, 0];


const ExpoScene = () => {
  const materialRef = useRef();
  // OPT: кешируем сам uniform, чтобы не ходить по цепочке
  // material.uniforms.uTime каждый кадр.
  const uTimeRef = useRef(null);

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
    if (uTimeRef.current === null && materialRef.current) {
      uTimeRef.current = materialRef.current.uniforms.uTime;
    }
    if (uTimeRef.current) {
      uTimeRef.current.value += delta;
    }
  });

  const [activeScrollCamera, setActiveScrollCamera] = useState(false);
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [portalTExt, setPortalTExt] = useState(false);

  const isMobile = useIsMobile();
  const flagGroupPosition = isMobile ? FLAG_GROUP_POSITION_MOBILE : FLAG_GROUP_POSITION;

  // OPT: раньше не было массива зависимостей — эффект перезапускался
  // после КАЖДОГО рендера и плодил setTimeout без отмены.
  useEffect(() => {
    const id = setTimeout(() => {
      setIsLaserOn(true);
    }, 3000);

    return () => clearTimeout(id);
  }, []);

  return (
    <group visible={true}>

      <CameraParallax intensity={1} factor={0.05} />
      <group position={flagGroupPosition} rotation={FLAG_GROUP_ROTATION}>
        <FlagText active={setActiveScrollCamera} />
      </group>
      <mesh rotation={PLANE_ROTATION} position={PLANE_POSITION} >
        <planeGeometry args={PLANE_ARGS} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
        <SmartRectLight />
        <ConeLaser
          active={isLaserOn}
          radius={0.3}
          height={21.0}
          thetaLength={6.6}
          emissiveIntensity={3.5}
          speed={1.5}
          position={LASER_POSITION}
          rotation={LASER_ROTATION}
        />
        <Model rotation={MODEL_ROTATION} scale={7} position={MODEL_POSITION} inputRotationZ={-65} />
        <Formwork rotation={FORMWORK_ROTATION} scale={0.0041} position={FORMWORK_POSITION} />
        <group position={PORTAL_POSITION} rotation={PORTAL_ROTATION}
          anchorX="center"
          anchorY="middle">
          <PortalText />
        </group>
        {activeScrollCamera && <ScrollCameraPath portal={setPortalTExt} />}
      </mesh>
    </group>
  );
};

export default ExpoScene;
