import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useIsMobile } from '../../../../hooks/useIsMobile';

// OPT: убраны неиспользуемые импорты Outlines, Scanline, BlendFunction и
// дефолтный React (JSX-рантайм автоматический, "React." в файле не встречается).

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

// --- CONFIG: мобильная раскладка (только для этой сцены) ---------------------
//
// Что было не так. Камера жёстко ставилась в (0, -7.5, 9.5) с fov 52. Но fov в
// three.js — ВЕРТИКАЛЬНЫЙ, а горизонтальный обзор равен fov * aspect. Десктоп:
// aspect ≈ 1.78. Телефон в портрете: aspect ≈ 0.46, то есть по горизонтали
// влезает вчетверо меньше. Три монолита занимают ~11.9 единицы в ширину и
// просто обрезались по краям, а стрелка (x = 7) уезжала за кадр целиком.
//
// Почему не спас ResponsiveCamera: он расширяет fov только до своего потолка
// maxFov = 50 и никогда не сужает ниже собственного fov сцены. У Scene4 fov 52,
// то есть уже выше потолка → next === base и компонент выходит, ничего не
// записав (см. ResponsiveCamera.jsx, ветка `if (next - base < 0.01) return`).
// Значит кадр под узкий экран нужно считать здесь.
//
// Как решено: не только шире fov, но и отъезд камеры + уменьшение группы
// монолитов. Одним fov не обойтись — чтобы вернуть горизонтальный охват при
// aspect 0.46, вертикальный fov пришлось бы задрать до ~117°, а это уже
// «рыбий глаз» с выламыванием вертикалей монолитов по краям.
const MOBILE = {
     // 62° против десктопных 52°: заметно шире, но ещё без искажений.
     fov: 62,
     cameraY: -8.5,
     // Точка взгляда ниже десктопной (6.5): в узкий кадр надо уместить всю
     // высоту монолитов, а не только их верх.
     lookAtY: 1.5,
     // Уменьшаем саму группу монолитов. Иначе, чтобы уложить её по ширине,
     // камеру пришлось бы отодвинуть настолько далеко, что композиция
     // распадается: монолиты превращаются в тонкие полоски по центру.
     monolithScale: 0.62,
     // Границы отъезда камеры. Минимум — чтобы в ландшафте (низкая высота
     // кадра) монолиты влезали по вертикали; максимум — чтобы на сверхузких
     // экранах камера не улетала в бесконечность.
     minDistance: 12.5,
     maxDistance: 24,
     // Запас по бокам, чтобы монолиты не липли к краям кадра.
     sideMargin: 1.12,
     // Насколько основание монолитов уводится ПОД нижнюю кромку кадра.
     // 0 поставило бы его ровно на кромку, и при малейшем повороте камеры
     // пальцем полоса пустого неба выглянула бы обратно.
     baseMargin: 1.0,
     // Разрешённый разброс вертикального вращения вокруг расчётного угла.
     polarRange: Math.PI * 0.1,
     // Стрелка: зазор над вершиной монолитов, плоскость по Z и масштаб.
     arrowGap: 2.2,
     arrowZ: 2,
     arrowScale: 0.5,
     // Мобильный бюджет кадра: меньше звёзд и облаков, дешевле текстура
     // облака, тени выключены (см. shadows у <Monoliths />).
     starCount: 450,
     cloudDensity: 18,
     cloudTextureSize: 256,
};

// Основание монолитов в локальных координатах их групп. Раньше -10 было
// зашито прямо в basePosition; теперь из него же считаются сдвиг группы вниз
// и высота стрелки, поэтому значение должно быть одно.
const MONOLITH_BASE_Y = -10;

// Половина габарита группы монолитов по X — считаем из CONFIG, чтобы правка
// monolithWidth/monolithGap автоматически меняла и мобильный кадр.
// Крайний монолит: центр на (count-1)/2 * (width + gap), плюс его полуширина
// (боковые монолиты чуть уже центрального — коэффициент 0.96 из Monoliths).
const MONOLITH_HALF_WIDTH =
     ((CONFIG.monolithCount - 1) / 2) * (CONFIG.monolithWidth + CONFIG.monolithGap) +
     (CONFIG.monolithWidth * 0.96) / 2;

// Десктопный кадр — ровно те значения, что стояли в коде до адаптива.
const DESKTOP_FRAMING = {
     fov: 52,
     position: [0, -7.5, 9.5],
     lookAt: [0, 6.5, 0],
};

// Стрелка. На десктопе она висит справа-снизу в пустоте.
//
// На мобилке свободного места нет ни справа, ни снизу. Справа: монолиты
// занимают ~89% полуширины кадра, а в плоскости стрелки (z = 2) свободная
// полоса всего ~0.4 юнита — её габарит 1.6 туда не влезает. Снизу: основание
// монолитов теперь уведено под кадр (groupOffsetY), пустого неба там больше
// нет. Остаётся небо над монолитами, поэтому мобильная стрелка привязана к их
// вершине через MOBILE.arrowGap и считается в компоненте сцены.
const ARROW_ROTATION = [Math.PI / 4, 0, 0];
const DESKTOP_ARROW = { position: [7, -1, 2], scale: 0.4 };

const DEG_TO_RAD = Math.PI / 180;

/**
 * Считает мобильный кадр под фактические пропорции вьюпорта.
 *
 * ПО ГОРИЗОНТАЛИ. Полуширина, которую камера видит на расстоянии d:
 *     halfW = d * tan(fovY / 2) * aspect
 * Нужно halfW >= габарита монолитов, отсюда d = halfWidthNeeded / (tan * aspect).
 * Aspect стоит в знаменателе — поэтому на узком экране камера отъезжает.
 *
 * ПО ВЕРТИКАЛИ. Камера смотрит вверх (lookAtY выше cameraY), значит нижняя
 * кромка кадра — луч под углом (pitch - fovY/2) к горизонту. Считаем, на какой
 * высоте он пересекает плоскость монолитов (z = 0), и опускаем группу так,
 * чтобы основание ушло ниже этой линии. Без этого под монолитами остаётся
 * полоса пустого неба — на портретном экране это ~11% высоты кадра.
 *
 * ОРБИТА. OrbitControls работает в сферических координатах вокруг target,
 * поэтому его minDistance/maxDistance сравниваются с радиусом (гипотенузой),
 * а не с z камеры, а наклон ограничен min/maxPolarAngle. Если расчётная
 * позиция выходит за эти лимиты, update() каждый кадр тянет камеру назад и
 * кадр не собирается вообще — поэтому лимиты считаются здесь, из самой позиции.
 */
function computeMobileFraming(width, height) {
     // Защита от деления на ноль в первый кадр, пока канвас ещё не измерен.
     const rawAspect = width / height;
     const aspect = rawAspect > 0 && Number.isFinite(rawAspect) ? rawAspect : 1;

     const halfFov = (MOBILE.fov * DEG_TO_RAD) / 2;
     const halfWidthNeeded = MONOLITH_HALF_WIDTH * MOBILE.monolithScale * MOBILE.sideMargin;

     const distance = THREE.MathUtils.clamp(
          halfWidthNeeded / (Math.tan(halfFov) * aspect),
          MOBILE.minDistance,
          MOBILE.maxDistance,
     );

     const rise = MOBILE.lookAtY - MOBILE.cameraY;
     const pitch = Math.atan2(rise, distance);
     const frameBottomY = MOBILE.cameraY + distance * Math.tan(pitch - halfFov);

     const scaledBaseY = MONOLITH_BASE_Y * MOBILE.monolithScale;
     // Math.min(0, ...): если основание и так ниже кадра, поднимать его нельзя.
     const groupOffsetY = Math.min(0, frameBottomY - MOBILE.baseMargin - scaledBaseY);

     const radius = Math.hypot(rise, distance);
     const polar = Math.acos(-rise / radius);

     return {
          distance,
          groupOffsetY,
          // Запас вокруг радиуса: зум выключен, эти лимиты нужны только чтобы
          // не воевать с лерпом камеры.
          minDistance: radius * 0.8,
          maxDistance: radius * 1.2,
          minPolarAngle: Math.max(0.02, polar - MOBILE.polarRange),
          maxPolarAngle: Math.min(Math.PI - 0.02, polar + MOBILE.polarRange),
     };
}


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

// OPT: аргументы конструкторов и статические трансформы вынесены на уровень
// модуля. BackgroundSky не мемоизирован и перерисовывается вместе с родителем
// (например, при setExtrude(true) через 4 секунды), а новый литерал массива в
// args на каждом рендере — повод для R3F пересобрать материал и геометрию.
// Значения ровно те же.
const SKY_MATERIAL_ARGS = [SkyShaderMaterial];
const SKY_GEOMETRY_ARGS = [140, 32, 32];
const SKY_SCALE = [-1, 1, 1];
const SKY_POSITION = [0, 10, 0];

function BackgroundSky({ starCount = CONFIG.starCount }) {
     const shaderRef = useRef();
     const starsRef = useRef();
     const starTexture = useMemo(() => generateStarTexture(), []);


     // -------------------------------------------------------------------------
     // OPT / МЁРТВЫЙ КОД: раньше здесь генерировались ещё массивы scales и
     // phases, а useFrame каждый кадр перезаписывал ими атрибут "size" и ставил
     // needsUpdate = true — 1200 итераций и повторная заливка 1200 float на GPU
     // 60 раз в секунду.
     //
     // Проверено по исходнику three.js
     // (node_modules/three/src/renderers/shaders/ShaderLib/points.glsl.js):
     //     uniform float size;
     //     gl_PointSize = size;
     // size там объявлен как UNIFORM, атрибута "size" в шейдере точек нет
     // вообще. pointsMaterial молча игнорировал этот атрибут: мерцание и
     // разброс размеров звёзд не работали никогда, все звёзды всегда рисовались
     // одним размером из uniform size={1.5}. Картинка не меняется.
     // -------------------------------------------------------------------------
     // МОБИЛЬНОЕ: количество звёзд теперь параметр, а не константа.
     // 1200 точек с AdditiveBlending и sizeAttenuation — это 1200 полупрозрачных
     // спрайтов, которые на мобильном GPU бьют по филлрейту (каждый пиксель
     // читается-смешивается заново). На телефоне 450 звёзд визуально почти
     // неотличимы: экран мельче, а звёзды и так рассыпаны по куполу радиусом 120.
     const positions = useMemo(() => {
          const count = starCount;
          const pos = new Float32Array(count * 3);
          const radius = 120;

          for (let i = 0; i < count; i++) {

               const u = Math.random();
               const v = Math.random() * 0.75 + 0.25;
               const theta = u * Math.PI * 2;
               const phi = Math.acos(2 * v - 1);

               pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
               pos[i * 3 + 1] = radius * Math.cos(phi) + 15;
               pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
          }
          return pos;
     }, [starCount]);


     // OPT: args для bufferAttribute тоже со стабильной ссылкой.
     const positionArgs = useMemo(() => [positions, 3], [positions]);

     useFrame((state) => {
          // OPT: getElapsedTime() вызывался трижды за кадр — теперь один раз.
          const t = state.clock.getElapsedTime();

          if (shaderRef.current) {
               shaderRef.current.uniforms.uTime.value = t;
          }
          // Вращение звёздного купола — единственная реально видимая анимация.
          if (starsRef.current) {
               starsRef.current.rotation.y = t * 0.0015;
          }
     });

     return (
          <>
               <mesh scale={SKY_SCALE} position={SKY_POSITION}>
                    <sphereGeometry args={SKY_GEOMETRY_ARGS} />
                    <shaderMaterial ref={shaderRef} args={SKY_MATERIAL_ARGS} side={THREE.BackSide} depthWrite={false} />
               </mesh>

               <points ref={starsRef}>
                    <bufferGeometry>
                         <bufferAttribute attach="attributes-position" args={positionArgs} />
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

// МОБИЛЬНОЕ: density и размер текстуры стали параметрами.
// Облака — большие полупрозрачные плоскости (размер 11..27 единиц), они
// перекрывают друг друга и весь кадр. Это худший случай для мобильного GPU:
// оверdraw по всему экрану, причём с transparent + DoubleSide. На узком экране
// половина облаков всё равно за кадром (они разлетаются на x = ±10..±28,
// а видимая ширина кадра ~14 единиц), поэтому 18 вместо 28 ничего не отнимает
// визуально. Текстура 256 вместо 512 — вчетверо меньше памяти, а облако и так
// размыто радиальными градиентами, разницы не видно.
function CloudLayer({ density = CONFIG.cloudDensity, textureSize = 512 }) {
     const groupRef = useRef();
     const cloudTexture = useMemo(() => generateCloudTexture(textureSize, textureSize), [textureSize]);


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

     // OPT: одна общая геометрия на все 28 облаков. Раньше каждый меш объявлял
     // свой <planeGeometry args={[1, 1]} />, то есть создавалось 28 одинаковых
     // геометрий (28 наборов буферов в GPU-памяти вместо одного). Форма и
     // размер не меняются: облака масштабируются через scale, плоскость 1x1
     // у всех была идентичной.
     const sharedPlane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

     // ВНИМАНИЕ: блок ниже не тронут специально. Генератор rand() здесь
     // детерминированный (seed 98765), и порядок вызовов задаёт положение
     // каждого облака. Любой лишний, убранный или переставленный вызов rand()
     // сдвинет всю последовательность и раскидает облака по другим местам.
     //
     // Поэтому мобильное сокращение сделано именно урезанием ЧИСЛА ИТЕРАЦИЙ
     // с конца (density вместо CONFIG.cloudDensity), а не фильтрацией по
     // положению: первые 18 облаков получают ровно те же координаты, что и на
     // десктопе, просто последних 10 нет. Композиция не разъезжается.
     const cloudPuffs = useMemo(() => {
          const puffs = [];
          let s = 98765;
          const rand = () => {
               s = (s * 9301 + 49297) % 233280;
               return s / 233280;
          };

          for (let i = 0; i < density; i++) {

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
     }, [density]);


     useFrame((state) => {
          const group = groupRef.current;
          if (!group) return;

          const time = state.clock.getElapsedTime() * CONFIG.cloudSpeed * 0.1;
          const children = group.children;

          // OPT: обычный for вместо children.forEach — без создания
          // колбэка-замыкания на каждом кадре. Формулы не тронуты.
          for (let idx = 0; idx < children.length; idx++) {
               const puff = cloudPuffs[idx];
               if (!puff) continue;
               const child = children[idx];
               child.position.x = puff.position[0] + Math.sin(time * puff.speed + idx) * 0.8;
               child.position.y = puff.position[1] + Math.cos(time * 0.5 * puff.speed + idx) * 0.4;
          }
     });

     return (
          <group ref={groupRef}>
               {cloudPuffs.map((puff, i) => (
                    <mesh
                         key={i}
                         position={puff.position}
                         scale={puff.scale}
                         rotation={[0, 0, puff.rotationZ]}
                         material={cloudMaterial}
                         geometry={sharedPlane}
                    />
               ))}
          </group>
     );
}

// --- 3. Монолиты с анимацией роста по оси Y ---
// OPT: длительность вынесена из кадрового цикла — раньше const duration = 1.6
// объявлялся заново для каждого монолита на каждом кадре.
const MONOLITH_DURATION = 1.6; // Длительность роста одного монолита в секундах

// МОБИЛЬНОЕ: groupScale уменьшает всю композицию монолитов, shadows включает
// или выключает отбрасывание теней.
//
// Про тени. Раньше монолиты стояли с castShadow/receiveShadow, а под ними
// лежала плоскость 100x100 с shadowMaterial. Но проверьте <Canvas> в
// ViewportCanvas.jsx: атрибут shadows там не выставлен, значит
// gl.shadowMap.enabled === false и вся эта machinery не рисует ничего — тени
// в сцене не видны ни на десктопе, ни на мобиле. На телефоне отключаем их
// явно: если shadowMap когда-нибудь включат глобально, мобильный GPU не
// получит внезапный дополнительный depth-проход на плоскость 100x100.
function Monoliths({ groupScale = 1, groupOffsetY = 0, shadows = true }) {
     const meshRefs = useRef([]);
     const animTime = useRef(0);

     // OPT: флаг завершения анимации — см. комментарий в useFrame.
     const isDone = useRef(false);

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
                    basePosition: [x, MONOLITH_BASE_Y, z],
                    height,
                    args: [width, height, baseD],
                    delay: Math.abs(offsetIndex) * 0.2, // Каскадный задержка роста
               });
          }
          return list;
     }, []);

     // Анимация роста от 0% до 100% при появлении
     const START_DELAY = 2.0;

     // OPT: момент окончания всей каскадной анимации считается один раз.
     // Самый поздний монолит стартует с задержкой maxDelay и растёт
     // MONOLITH_DURATION секунд — после этого у всех scale.y уже равен 1.
     const finishTime = useMemo(() => {
          let maxDelay = 0;
          for (const item of monolithData) {
               if (item.delay > maxDelay) maxDelay = item.delay;
          }
          return maxDelay + MONOLITH_DURATION;
     }, [monolithData]);

     useFrame((_, delta) => {
          // OPT: после завершения роста useFrame больше ничего не делает.
          // Раньше цикл крутился всю жизнь сцены и каждый кадр заново писал
          // scale.y = 1 всем монолитам, а запись в scale помечает матрицы
          // объекта грязными и заставляет пересчитывать их на каждом кадре.
          if (isDone.current) return;

          animTime.current += delta;

          // 1. Если общее время меньше глобальной задержки, ничего не делаем
          if (animTime.current < START_DELAY) {
               return;
          }

          // 2. Вычитаем глобальную задержку, чтобы отсчет анимации монолитов начался с 0
          const globalElapsed = animTime.current - START_DELAY;

          // OPT: for вместо forEach — без замыкания на каждом кадре.
          // Математика прогресса не изменена.
          for (let index = 0; index < monolithData.length; index++) {
               const item = monolithData[index];
               const meshGroup = meshRefs.current[index];
               if (!meshGroup) continue;

               // 3. Считаем время с учетом индивидуального каскадного дилея
               const elapsed = globalElapsed - item.delay;

               if (elapsed <= 0) {
                    meshGroup.scale.y = 0;
                    continue;
               }

               const rawProgress = Math.min(1, elapsed / MONOLITH_DURATION);
               const easeOutProgress = 1 - Math.pow(1 - rawProgress, 3);

               meshGroup.scale.y = easeOutProgress;
          }

          // Флаг ставится только после того, как в этом же кадре всем
          // монолитам уже присвоен финальный scale.y = 1.
          if (globalElapsed >= finishTime) {
               isDone.current = true;
          }
     });
     // МОБИЛЬНОЕ: scale и сдвиг вниз на корневой группе. Пивот дочерних групп
     // уже стоит у основания (MONOLITH_BASE_Y), поэтому ни уменьшение, ни сдвиг
     // не ломают анимацию роста снизу вверх — она идёт в локальных координатах.
     //
     // Порядок трансформаций важен: матрица объекта в three.js собирается как
     // T * R * S (Object3D.updateMatrix → matrix.compose), то есть позиции
     // детей сначала умножаются на scale и только потом сдвигаются. Основание
     // оказывается на MONOLITH_BASE_Y * groupScale + groupOffsetY — ровно из
     // этой формулы groupOffsetY и выведен в computeMobileFraming.
     //
     // position-y вместо position={[0, y, 0]}: пронзающий проп R3F пишет одно
     // число и не создаёт новый массив на каждом рендере.
     return (
          <group position-y={groupOffsetY} scale={groupScale}>
               {monolithData.map((item, index) => (
                    /* Пивот закрепите у основания (-10), чтобы масштабирование scale.y шло снизу вверх */
                    <group
                         key={item.id}
                         position={item.basePosition}
                         ref={(el) => (meshRefs.current[index] = el)}
                         scale={[1, 0, 1]} // Начинаем с 0% по оси Y
                    >
                         <mesh
                              position={[0, item.height / 2, 0]}
                              material={material}
                              castShadow={shadows}
                              receiveShadow={shadows}
                         >
                              <boxGeometry args={item.args} />
                         </mesh>
                    </group>
               ))}

               {/* Тень на земле. На мобиле плоскость не рендерим вообще:
                   без castShadow у монолитов рисовать на ней нечего. */}
               {shadows && (
                    <mesh position={[0, -10.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                         <planeGeometry args={[100, 100]} />
                         <shadowMaterial opacity={0.6} />
                    </mesh>
               )}
          </group>
     );
}

/**
 * Кадр камеры. Все числа приходят готовыми из computeMobileFraming — здесь
 * только перевод в Vector3 и лимиты OrbitControls.
 */
function CameraController({ isMobile, mobileFraming }) {
     const { camera } = useThree();
     const controlsRef = useRef();
     const didSnap = useRef(false);

     const framing = useMemo(() => {
          if (!isMobile || !mobileFraming) {
               return {
                    position: new THREE.Vector3(...DESKTOP_FRAMING.position),
                    lookAt: new THREE.Vector3(...DESKTOP_FRAMING.lookAt),
                    minDistance: 4,
                    maxDistance: 45,
                    minPolarAngle: 0,
                    maxPolarAngle: Math.PI,
               };
          }

          return {
               position: new THREE.Vector3(0, MOBILE.cameraY, mobileFraming.distance),
               lookAt: new THREE.Vector3(0, MOBILE.lookAtY, 0),
               minDistance: mobileFraming.minDistance,
               maxDistance: mobileFraming.maxDistance,
               minPolarAngle: mobileFraming.minPolarAngle,
               maxPolarAngle: mobileFraming.maxPolarAngle,
          };
     }, [isMobile, mobileFraming]);

     // fov ставим здесь, а не только в родительском useEffect: при повороте
     // экрана родительский эффект не перезапускается (в его зависимостях нет
     // размеров), а этот useMemo — да.
     useEffect(() => {
          const nextFov = isMobile ? MOBILE.fov : DESKTOP_FRAMING.fov;
          if (Math.abs(camera.fov - nextFov) < 0.01) return;
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
     }, [camera, isMobile]);

     useFrame((_, delta) => {
          const controls = controlsRef.current;
          if (!controls) return;

          // Первый кадр — ставим камеру в кадр сразу, без лерпа. Раньше это
          // делал useEffect в самой сцене, но там же висели таймеры постера,
          // и любое изменение размеров вьюпорта перезаряжало бы их.
          if (!didSnap.current) {
               camera.position.copy(framing.position);
               controls.target.copy(framing.lookAt);
               controls.update();
               didSnap.current = true;
               return;
          }

          const t = Math.min(delta * 2.5, 1);
          camera.position.lerp(framing.position, t);
          controls.target.lerp(framing.lookAt, t);
          controls.update();
     });

     return (
          <OrbitControls
               ref={controlsRef}
               // МОБИЛЬНОЕ: pan отключён. На тач-экране pan вешается на два
               // пальца, и любой пинч уводит камеру в сторону — вернуться
               // пользователь не сможет, так как зум тут выключен и никакого
               // «reset» нет. На десктопе pan оставлен как было.
               enablePan={!isMobile}
               enableZoom={false} // 1. Вимикаємо зум сцени
               enableRotate={!isMobile}
               // Палец проходит по экрану больший путь в пикселях, чем мышь на
               // тот же жест, поэтому чувствительность вращения ниже.
               rotateSpeed={isMobile ? 0.45 : 0.8}
               // ИСПРАВЛЕНО: здесь стояли фиксированные 0.28π..0.62π, и
               // расчётный угол камеры (≈0.69π на портретной дистанции) в них
               // НЕ влезал. OrbitControls.update() каждый кадр возвращал камеру
               // на кромку 0.62π, то есть заданный низкий ракурс не выставлялся
               // вообще. Теперь лимиты — это расчётный угол ± MOBILE.polarRange,
               // так что целевая позиция всегда достижима, а вертикальный люфт
               // пальцем остаётся ограниченным.
               minPolarAngle={framing.minPolarAngle}
               maxPolarAngle={framing.maxPolarAngle}
               // zoomSpeed більше не потрібен
               minDistance={framing.minDistance}
               maxDistance={framing.maxDistance}
          />
     );
}


export function ExtrudedArrow() {
     // Крок 1: Створюємо геометрію ОДИН раз і зберігаємо в пам'яті
     const geometry = useMemo(() => {
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

          const extrudeSettings = {
               depth: 0.7,
               bevelEnabled: true,
               bevelThickness: 0.22,
               bevelSize: 0.18,
               // Зменшено сегменти для більшої продуктивності:
               bevelSegments: 4, // Було 8
               steps: 1,         // Було 2 (для прямої стрілки 1 достатньо)
               curveSegments: 12, // Було 16 (у вас прямі лінії, можна навіть менше)
          };

          return new THREE.ExtrudeGeometry(s, extrudeSettings);
     }, []);

     // Крок 2: Передаємо готову геометрію через проп `geometry`
     return (
          <mesh geometry={geometry}>
               <meshPhysicalMaterial
                    color="#e0f2fe"
                    roughness={0.1}
                    metalness={0.1}
                    clearcoat={0}
               // transmission={0.85}
               />
               {/*<Outlines thickness={0.08} color="#ffffff" />*/}
          </mesh>
     );
} // <- Эта скобка отсутствовала

// --- Главный экспортируемый компонент СЦЕНЫ (для вставки ВНУТРЬ вашего <Canvas>) ---
export default function GoldenMonolithScene({ cameraMono, poster }) {
     const { size } = useThree();
     const [extrude, setExtrude] = useState(false);
     const isMobile = useIsMobile();

     // Мобильный кадр считается ОДИН раз здесь и раздаётся вниз: камере
     // (дистанция и лимиты орбиты), монолитам (сдвиг вниз) и стрелке (высота).
     // Раньше дистанция считалась внутри CameraController — теперь у всех трёх
     // потребителей один источник, иначе они разъезжаются между собой.
     const mobileFraming = useMemo(
          () => (isMobile ? computeMobileFraming(size.width, size.height) : null),
          [isMobile, size.width, size.height],
     );

     // Пропы стрелки — одним мемоизированным объектом, а не литералами в JSX:
     // иначе position/scale были бы новыми массивами на каждом рендере и R3F
     // переписывал бы трансформ группы вхолостую.
     const arrow = useMemo(() => {
          if (!isMobile || !mobileFraming) return DESKTOP_ARROW;

          // Привязка к вершине монолитов, а не абсолютная координата: вершина
          // теперь зависит от groupOffsetY, то есть от пропорций экрана.
          const topY =
               (MONOLITH_BASE_Y + CONFIG.monolithHeight) * MOBILE.monolithScale +
               mobileFraming.groupOffsetY;

          return {
               position: [0, topY + MOBILE.arrowGap, MOBILE.arrowZ],
               scale: MOBILE.arrowScale,
          };
     }, [isMobile, mobileFraming]);

     // Только таймеры сценария. Расстановка камеры переехала в CameraController
     // (первый кадр useFrame): здесь она держала в зависимостях размеры кадра,
     // а на телефоне вьюпорт меняется не только при повороте, но и когда при
     // скролле схлопывается адресная строка — эффект перезапускался бы и ставил
     // вторую пару setTimeout, вызывая poster(true) дважды.
     //
     // По той же причине в зависимостях нет `extrude`: этот эффект сам его и
     // меняет через setExtrude(true), то есть раньше перезаряжал себя. Плюс
     // добавлен clearTimeout — до этого таймеры дёргали poster у уже
     // размонтированного компонента.
     useEffect(() => {
          if (!cameraMono) return;

          const posterTimer = setTimeout(() => {
               poster(true)
          }, 5500)
          const extrudeTimer = setTimeout(() => {
               setExtrude(true);
          }, 4000)

          return () => {
               clearTimeout(posterTimer);
               clearTimeout(extrudeTimer);
          };
     }, [cameraMono, poster]);

     return (

          <>
               {/* Фон неба и звездное поле */}
               <BackgroundSky starCount={isMobile ? MOBILE.starCount : CONFIG.starCount} />


               {/* Источники света пресета Golden Twilight */}
               <ambientLight intensity={0.25} />
               <directionalLight position={[14, 22, 16]} intensity={CONFIG.keyLightIntensity} color={CONFIG.keyLightColor} castShadow />
               <directionalLight position={[-14, -6, 10]} intensity={CONFIG.fillLightIntensity} color="#4a2a30" />
               <directionalLight position={[0, 25, -10]} intensity={0.8} color="#ffdaaa" />
               <Environment preset="night" environmentIntensity={0.8} />

               {/* Анимированные монолиты */}


               {/* Облака */}
               <CloudLayer
                    density={isMobile ? MOBILE.cloudDensity : CONFIG.cloudDensity}
                    textureSize={isMobile ? MOBILE.cloudTextureSize : 512}
               />
               {cameraMono && (
                    <Monoliths
                         groupScale={isMobile ? MOBILE.monolithScale : 1}
                         groupOffsetY={mobileFraming ? mobileFraming.groupOffsetY : 0}
                         shadows={!isMobile}
                    />
               )}
               {cameraMono && <CameraController isMobile={isMobile} mobileFraming={mobileFraming} />}



               <Float
                    floatingRange={[-0.2, 0.2]}  // Амплітуда руху по Y
                    speed={8.5}                  // Швидкість анімації
                    floatIntensity={2}           // Множник висоти покачивания
                    rotationIntensity={0}        // ПОВНІСТЮ ВИМИКАЄМО НАХИЛ ПРИ ПАРІННІ
                    axis="y"                     // СУВОРO ФІКСУЄМО РУХ ЛИШЕ ПО ОСІ Y
               >
                    <group position={arrow.position} rotation={ARROW_ROTATION} scale={arrow.scale}>
                         {extrude && <ExtrudedArrow />}
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
