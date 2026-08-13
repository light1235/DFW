import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, ScrollControls, useScroll } from '@react-three/drei';

// ==========================================
// 1. КОНФИГУРАЦИЯ И НАСТРОЙКИ ЦВЕТА И СЦЕНЫ
// ==========================================
const CONFIG = {
     bgColor: '#000000',
     duotoneYellow: '#E2C84B', // Основной цвет (например: '#E2C84B' - желтый, '#0066FF' - синий)
     duotoneBlack: '#000000',  // Цвет тени
     contrast: 2.2,             // Контрастность (1.0 - 3.5)
     posterizeLevels: 3.0,      // Градация постеризации (2 - hard poster)
     grungeIntensity: 0.35,     // Интенсивность процедурного шума/гранжа
     scrollSpeed: 1.0,          // Множитель скорости скролла
     autoScroll: true,          // Автоматическое движение
     autoScrollSpeed: 0.6,      // Скорость авто-движения

     // Индивидуальные цвета для каждой из 4-х полос фото (опционально):
     rowColors: {
          // 0: { light: '#0066FF', dark: '#000000' }, // Полоса 1 - Синий
          // 1: { light: '#D4FF00', dark: '#000000' }, // Полоса 2 - Кислотно-зеленый
          // 2: { light: '#FF007F', dark: '#000000' }, // Полоса 3 - Неоново-розовый
          // 3: { light: '#E2C84B', dark: '#000000' }, // Полоса 4 - Желтый
     },

     // Длинный текст бегущих строк (DOKA Systems)
     lines: {
          text1: 'Framax Xlife • Framax Xlife plus • Frami Xlife • Alu-Framax Xlife • DokaXlight • Top 50 • FF20 • KS Xlife • Monolithic system • Dokaflex • Dokaflex 1-2-4 • Dokadek 30 • Doka Xclimb 60',
          text2: 'Doka floor tables • Dokamatic table • SKE plus • Xclimb 60 climbing formwork • MF240',
          text3: 'SCF Shaft platform • Staxo 40 • Staxo 100 • D3 load-bearing tower • Doka Eurex top • Doka Eurex eco • Doka beam H20 top',
          text4: 'Doka composite beam I tec 20 • Doka 3-S top • Framax quick-acting clamp • Concremote',
     },

     // Изображения для 4-х фотосеток
     imageSets: [
          [
               { id: '1', title: 'Framax Xlife Panel', category: 'Doka Systems', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80' },
               { id: '2', title: 'Formwork Construction', category: 'Site', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
               { id: '3', title: 'Heavy Duty Shoring', category: 'Staxo', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80' },
               { id: '4', title: 'Dokaflex Floor System', category: 'Floors', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80' },
               { id: '5', title: 'Climbing Formwork', category: 'Xclimb', url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80' },
               { id: '6', title: 'Monolithic Casting', category: 'Concrete', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80' },
          ],
          [
               { id: '7', title: 'Staxo 100 Tower', category: 'Load-Bearing', url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=80' },
               { id: '8', title: 'Doka Beam H20 Top', category: 'Beams', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80' },
               { id: '9', title: 'Dokamatic Table', category: 'Tables', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
               { id: '10', title: 'Concremote Sensors', category: 'Tech', url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80' },
               { id: '11', title: 'Framax Clamp Lock', category: 'Clamps', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80' },
               { id: '12', title: 'Shaft Platform SCF', category: 'Platforms', url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80' },
          ],
          [
               { id: '13', title: 'Doka Eurex Top Props', category: 'Props', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80' },
               { id: '14', title: '3-S Top Sheets', category: 'Plywood', url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80' },
               { id: '15', title: 'Xclimb 60 Hydraulic', category: 'Hydraulics', url: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=800&q=80' },
               { id: '16', title: 'DokaXlight Aluminium', category: 'Lightweight', url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80' },
               { id: '17', title: 'I tec 20 Composite', category: 'Beams', url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=80' },
               { id: '18', title: 'High-Rise Construction', category: 'SKE Plus', url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80' },
          ],
          [
               { id: '19', title: 'KS Xlife Heavy Duty', category: 'Wall Formwork', url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80' },
               { id: '20', title: 'SKE Plus Automated', category: 'Self-Climbing', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80' },
               { id: '21', title: 'FF20 Circular Formwork', category: 'Curved Concrete', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80' },
               { id: '22', title: 'Dokadek 30 Panel', category: 'Handset Slab', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80' },
               { id: '23', title: 'Alu-Framax Lightweight', category: 'Alu Frame', url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80' },
               { id: '24', title: 'MF240 Crane Handling', category: 'Climbing', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80' },
          ]
     ]
};

// ==========================================
// 2. GLSL ШЕЙДЕРЫ (Дуотон + Гранж Текста)
// ==========================================
const DuotoneShader = {
     uniforms: {
          tDiffuse: { value: null },
          uColorLight: { value: new THREE.Color('#E2C84B') },
          uColorDark: { value: new THREE.Color('#000000') },
          uContrast: { value: 1.8 },
          uPosterizeLevels: { value: 3.0 },
          uGrungeIntensity: { value: 0.35 },
          uHover: { value: 0.0 },
          uTime: { value: 0.0 },
     },
     vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
     fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uColorLight;
    uniform vec3 uColorDark;
    uniform float uContrast;
    uniform float uPosterizeLevels;
    uniform float uGrungeIntensity;
    uniform float uHover;
    uniform float uTime;

    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 texColor = texture2D(tDiffuse, vUv);
      float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

      float cLuminance = (luminance - 0.5) * uContrast + 0.5;
      cLuminance = clamp(cLuminance, 0.0, 1.0);

      if (uPosterizeLevels > 1.0) {
        cLuminance = floor(cLuminance * uPosterizeLevels) / (uPosterizeLevels - 1.0);
      }

      vec3 duotoneColor = mix(uColorDark, uColorLight, cLuminance);
      float grain = (rand(vUv * 500.0 + uTime * 0.1) - 0.5) * uGrungeIntensity * 0.25;

      vec3 finalColor = max(vec3(0.0), duotoneColor + vec3(grain));
      if (uHover > 0.0) {
        finalColor += vec3(0.12, 0.1, 0.0) * uHover;
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const TextGrungeShader = {
     uniforms: {
          tDiffuse: { value: null },
          uColor: { value: new THREE.Color('#FFFFFF') },
          uGrungeIntensity: { value: 0.4 },
          uTime: { value: 0.0 },
     },
     vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
     fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uColor;
    uniform float uGrungeIntensity;
    uniform float uTime;

    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 texColor = texture2D(tDiffuse, vUv);
      if (texColor.a < 0.05) discard;

      float grain = rand(vUv * 400.0) * uGrungeIntensity * 0.3;
      vec3 col = uColor - vec3(grain);
      gl_FragColor = vec4(col, texColor.a);
    }
  `
};

// ==========================================
// 3. ГЕНЕРАТОРЫ ТЕКСТУР И ДИНАМИЧЕСКОГО ТЕКСТА
// ==========================================
function generateProceduralPortrait(index, width = 512, height = 640) {
     const canvas = document.createElement('canvas');
     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext('2d');

     ctx.fillStyle = '#222';
     ctx.fillRect(0, 0, width, height);

     ctx.fillStyle = '#fff';
     ctx.beginPath();
     ctx.arc(width / 2, height / 2 - 50, 100, 0, Math.PI * 2);
     ctx.fill();

     ctx.beginPath();
     ctx.ellipse(width / 2, height / 2 + 150, 180, 120, 0, 0, Math.PI * 2);
     ctx.fill();

     const texture = new THREE.CanvasTexture(canvas);
     texture.needsUpdate = true;
     return texture;
}

/**
 * Генерирует текстуру текста с АВТОМАТИЧЕСКИМ РАСТЯЖЕНИЕМ.
 * Длинный текст сохраняет КРУПНЫЙ БОЛД ШРИФТ и продлевает 3D-полосу без сплющивания букв.
 */
function createStretchedTextTexture(text, fontFamily = 'Space Grotesk, Impact, Arial Black, sans-serif', targetHeight = 256) {
     const cleanText = text.toUpperCase();

     // Создаем временный холст для измерителя длины шрифта
     const measureCanvas = document.createElement('canvas');
     const measureCtx = measureCanvas.getContext('2d');
     const baseFontSize = targetHeight * 0.85;
     measureCtx.font = `900 ${baseFontSize}px ${fontFamily}`;

     const measuredWidth = measureCtx.measureText(cleanText).width;

     // Динамически высчитываем ширину текстуры: текст никогда не сжимается!
     let canvasWidth = Math.max(2048, Math.ceil(measuredWidth + baseFontSize));
     let finalText = cleanText;

     // Если текст короткий, повторяем его с аккуратной точкой-разделителем
     if (measuredWidth < 1800) {
          const separator = '   •   ';
          let repeated = cleanText;
          while (measureCtx.measureText(repeated + separator + cleanText).width < 1800) {
               repeated += separator + cleanText;
          }
          finalText = repeated;
     }

     const canvas = document.createElement('canvas');
     canvas.width = canvasWidth;
     canvas.height = targetHeight;
     const ctx = canvas.getContext('2d');

     ctx.clearRect(0, 0, canvasWidth, targetHeight);
     ctx.fillStyle = '#FFFFFF';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.font = `900 ${baseFontSize}px ${fontFamily}`;

     const finalMeasuredWidth = ctx.measureText(finalText).width;
     const scaleX = canvasWidth / Math.max(1, finalMeasuredWidth);

     ctx.save();
     ctx.translate(canvasWidth / 2, targetHeight / 2);
     ctx.scale(scaleX, 1.0);
     ctx.fillText(finalText, 0, 0);
     ctx.restore();

     // Добавляем текстурный шум
     const imgData = ctx.getImageData(0, 0, canvasWidth, targetHeight);
     const data = imgData.data;
     for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
               const noise = (Math.random() - 0.5) * 35;
               data[i] = Math.min(255, Math.max(0, data[i] + noise));
               data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
               data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
          }
     }
     ctx.putImageData(imgData, 0, 0);

     const texture = new THREE.CanvasTexture(canvas);
     texture.needsUpdate = true;
     texture.userData = { aspectRatio: canvasWidth / 2048, canvasWidth };
     return texture;
}

// ==========================================
// 4. THREE.JS 3D КОМПОНЕНТЫ
// ==========================================
function ImageCard({ item, index, width, height, xPos, config, colorLight, colorDark, onSelect }) {
     const [hovered, setHovered] = useState(false);
     const [texture, setTexture] = useState(null);

     useEffect(() => {
          let isMounted = true;
          const loader = new THREE.TextureLoader();

          loader.load(
               item.url,
               (loadedTex) => {
                    if (isMounted) {
                         loadedTex.colorSpace = THREE.SRGBColorSpace;
                         loadedTex.minFilter = THREE.LinearFilter;
                         loadedTex.magFilter = THREE.LinearFilter;
                         setTexture(loadedTex);
                    }
               },
               undefined,
               () => {
                    if (isMounted) {
                         setTexture(generateProceduralPortrait(index));
                    }
               }
          );

          return () => { isMounted = false; };
     }, [item.url, index]);

     const shaderMaterial = useMemo(() => {
          return new THREE.ShaderMaterial({
               uniforms: THREE.UniformsUtils.clone(DuotoneShader.uniforms),
               vertexShader: DuotoneShader.vertexShader,
               fragmentShader: DuotoneShader.fragmentShader,
               side: THREE.DoubleSide,
          });
     }, []);

     useEffect(() => {
          if (shaderMaterial) {
               shaderMaterial.uniforms.uColorLight.value.set(colorLight);
               shaderMaterial.uniforms.uColorDark.value.set(colorDark);
               shaderMaterial.uniforms.uContrast.value = config.contrast;
               shaderMaterial.uniforms.uPosterizeLevels.value = config.posterizeLevels;
               shaderMaterial.uniforms.uGrungeIntensity.value = config.grungeIntensity;
               if (texture) {
                    shaderMaterial.uniforms.tDiffuse.value = texture;
               }
          }
     }, [shaderMaterial, config, colorLight, colorDark, texture]);

     useFrame((state) => {
          if (shaderMaterial) {
               shaderMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
               shaderMaterial.uniforms.uHover.value = THREE.MathUtils.lerp(
                    shaderMaterial.uniforms.uHover.value,
                    hovered ? 1.0 : 0.0,
                    0.15
               );
          }
     });

     const borderWidth = width * 0.02;

     return (
          <group position={[xPos, 0, 0]}>
               <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial color="#000000" />
               </mesh>
               <mesh
                    position={[0, 0, 0]}
                    onPointerOver={(e) => {
                         e.stopPropagation();
                         setHovered(true);
                         document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={() => {
                         setHovered(false);
                         document.body.style.cursor = 'auto';
                    }}
                    onClick={(e) => {
                         e.stopPropagation();
                         onSelect(item, colorLight);
                    }}
               >
                    <planeGeometry args={[width - borderWidth * 2, height - borderWidth * 2]} />
                    <primitive object={shaderMaterial} attach="material" />
               </mesh>
          </group>
     );
}

function ImageGridLine({ items, rowY, rowHeight, lineOffsetX, direction, config, gridIndex, onSelect }) {
     const { viewport } = useThree();

     const rowColorLight = (config.rowColors && config.rowColors[gridIndex]?.light) || config.duotoneYellow;
     const rowColorDark = (config.rowColors && config.rowColors[gridIndex]?.dark) || config.duotoneBlack;

     const cardsInViewport = 6;
     const cardWidth = viewport.width / cardsInViewport;
     const repeatedItems = useMemo(() => [...items, ...items, ...items], [items]);

     const singleSetWidth = items.length * cardWidth;
     const totalRowWidth = repeatedItems.length * cardWidth;

     let wrappedX = lineOffsetX % singleSetWidth;
     if (direction === 'left') {
          wrappedX = -wrappedX;
     }

     return (
          <group position={[wrappedX - singleSetWidth, rowY, 0]}>
               {repeatedItems.map((item, idx) => {
                    const xPos = idx * cardWidth - totalRowWidth / 3;
                    return (
                         <ImageCard
                              key={`${item.id}-${idx}`}
                              item={item}
                              index={idx}
                              width={cardWidth}
                              height={rowHeight}
                              xPos={xPos}
                              config={config}
                              colorLight={rowColorLight}
                              colorDark={rowColorDark}
                              onSelect={onSelect}
                         />
                    );
               })}
          </group>
     );
}

function TextLine({ text, rowY, rowHeight, lineOffsetX, direction, config }) {
     const { viewport } = useThree();

     const texture = useMemo(() => {
          return createStretchedTextTexture(text, 'Space Grotesk, Impact, Arial Black, sans-serif', 256);
     }, [text]);

     const aspectRatio = texture.userData?.aspectRatio || 1.0;
     const planeWidth = viewport.width * aspectRatio;

     const shaderMaterial = useMemo(() => {
          return new THREE.ShaderMaterial({
               uniforms: THREE.UniformsUtils.clone(TextGrungeShader.uniforms),
               vertexShader: TextGrungeShader.vertexShader,
               fragmentShader: TextGrungeShader.fragmentShader,
               transparent: true,
               depthWrite: false,
               side: THREE.DoubleSide,
          });
     }, []);

     useEffect(() => {
          if (shaderMaterial) {
               shaderMaterial.uniforms.tDiffuse.value = texture;
               shaderMaterial.uniforms.uGrungeIntensity.value = config.grungeIntensity;
          }
     }, [shaderMaterial, texture, config.grungeIntensity]);

     useFrame((state) => {
          if (shaderMaterial) {
               shaderMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
          }
     });

     const singleSetWidth = planeWidth;
     let wrappedX = lineOffsetX % singleSetWidth;
     if (direction === 'left') {
          wrappedX = -wrappedX;
     }

     return (
          <group position={[wrappedX, rowY, 0]}>
               {[-1, 0, 1, 2].map((repeatIndex) => (
                    <group key={repeatIndex} position={[repeatIndex * planeWidth, 0, 0]}>
                         <mesh position={[0, 0, -0.01]}>
                              <planeGeometry args={[planeWidth, rowHeight]} />
                              <meshBasicMaterial color="#000000" />
                         </mesh>
                         <mesh position={[0, 0, 0]}>
                              <planeGeometry args={[planeWidth, rowHeight]} />
                              <primitive object={shaderMaterial} attach="material" />
                         </mesh>
                    </group>
               ))}
          </group>
     );
}

// ==========================================
// 5. ОСНОВНОЕ СОДЕРЖИМОЕ THREE.JS СЦЕНЫ
// ==========================================
function PosterContent({ config, onSelect }) {
     const { viewport } = useThree();
     const scroll = useScroll();

     const offsetRef = useRef(0);
     const lastScrollOffsetRef = useRef(0);
     const [lineOffsetX, setLineOffsetX] = useState(0);

     useFrame((state, delta) => {
          const currentScrollOffset = scroll ? scroll.offset : 0;
          const scrollDelta = currentScrollOffset - lastScrollOffsetRef.current;
          lastScrollOffsetRef.current = currentScrollOffset;

          let moveAmount = scrollDelta * viewport.width * 3.0 * config.scrollSpeed;
          if (config.autoScroll) {
               moveAmount += delta * viewport.width * 0.09 * config.autoScrollSpeed;
          }

          offsetRef.current += moveAmount;
          setLineOffsetX(offsetRef.current);
     });

     const totalLines = 8;
     const rowHeight = viewport.height / totalLines;
     const startY = viewport.height / 2 - rowHeight / 2;

     const lineConfigs = [
          { type: 'text', direction: 'left', content: config.lines.text1 },
          { type: 'images', direction: 'right', items: config.imageSets[0] || [], gridIndex: 0 },
          { type: 'text', direction: 'left', content: config.lines.text2 },
          { type: 'images', direction: 'right', items: config.imageSets[1] || [], gridIndex: 1 },
          { type: 'text', direction: 'left', content: config.lines.text3 },
          { type: 'images', direction: 'right', items: config.imageSets[2] || [], gridIndex: 2 },
          { type: 'text', direction: 'left', content: config.lines.text4 },
          { type: 'images', direction: 'right', items: config.imageSets[3] || [], gridIndex: 3 },
     ];

     return (
          <group>
               {lineConfigs.map((line, index) => {
                    const rowY = startY - index * rowHeight;

                    if (line.type === 'text') {
                         return (
                              <TextLine
                                   key={`line-${index}`}
                                   text={line.content}
                                   rowY={rowY}
                                   rowHeight={rowHeight}
                                   lineOffsetX={lineOffsetX}
                                   direction={line.direction}
                                   config={config}
                              />
                         );
                    } else {
                         return (
                              <ImageGridLine
                                   key={`line-${index}`}
                                   items={line.items}
                                   rowY={rowY}
                                   rowHeight={rowHeight * 1.4}
                                   lineOffsetX={lineOffsetX}
                                   direction={line.direction}
                                   config={config}
                                   gridIndex={line.gridIndex}
                                   onSelect={onSelect}
                              />
                         );
                    }
               })}
          </group>
     );
}

// ==========================================
// 6. ПОП-АП МОДАЛЬНОЕ ОКНО (ВНЕ CANVAS)
// ==========================================
function ImagePopup({ selectedData, onClose }) {
     if (!selectedData) return null;
     const { item, color } = selectedData;

     return (
          <div
               style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    fontFamily: 'sans-serif'
               }}
               onClick={onClose}
          >
               <div
                    style={{
                         backgroundColor: '#0a0a0a',
                         border: `2px solid ${color}`,
                         borderRadius: '16px',
                         maxWidth: '520px',
                         width: '100%',
                         overflow: 'hidden',
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                         color: '#ffffff',
                         position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
               >
                    <button
                         onClick={onClose}
                         style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: '#222',
                              border: 'none',
                              color: '#fff',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10
                         }}
                    >
                         ✕
                    </button>

                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         <div
                              style={{
                                   position: 'relative',
                                   borderRadius: '12px',
                                   overflow: 'hidden',
                                   background: '#000',
                                   aspectRatio: '4 / 3',
                                   width: '100%'
                              }}
                         >
                              <img
                                   src={item.url}
                                   alt={item.title || 'Poster Item'}
                                   style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'contrast(180%) brightness(85%)'
                                   }}
                              />
                              <div
                                   style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: color,
                                        mixBlendMode: 'color',
                                        pointerEvents: 'none',
                                        opacity: 0.8
                                   }}
                              />
                         </div>

                         <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: color, fontWeight: 'bold' }}>
              {item.category || 'INSPECTOR'}
            </span>
                              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '4px 0 0 0', textTransform: 'uppercase' }}>
                                   {item.title || 'POSTER CELL'}
                              </h2>
                         </div>

                         <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                   display: 'block',
                                   textAlign: 'center',
                                   backgroundColor: color,
                                   color: '#000000',
                                   fontWeight: 'bold',
                                   padding: '12px 20px',
                                   borderRadius: '8px',
                                   textDecoration: 'none',
                                   fontSize: '13px',
                                   textTransform: 'uppercase'
                              }}
                         >
                              Открыть оригинал
                         </a>
                    </div>
               </div>
          </div>
     );
}

// ==========================================
// 7. ГЛАВНЫЙ ЭКСПОРТИРУЕМЫЙ КОМПОНЕНТ
// ==========================================
export default function InteractivePoster({ customConfig = {} }) {
     const [selectedData, setSelectedData] = useState(null);

     const activeConfig = useMemo(() => {
          return { ...CONFIG, ...customConfig };
     }, [customConfig]);

     return (
          <div style={{ width: '100vw', height: '100vh', backgroundColor: activeConfig.bgColor, overflow: 'hidden', position: 'relative' }}>
               <Canvas
                    gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
                    style={{ background: activeConfig.bgColor }}
               >
                    <OrthographicCamera makeDefault position={[0, 0, 100]} zoom={1} />
                    <ScrollControls pages={2} damping={0.2}>
                         <PosterContent
                              config={activeConfig}
                              onSelect={(item, color) => setSelectedData({ item, color })}
                         />
                    </ScrollControls>
               </Canvas>

               <ImagePopup
                    selectedData={selectedData}
                    onClose={() => setSelectedData(null)}
               />
          </div>
     );
}
