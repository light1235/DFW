import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';

// =========================================================
// 1. КОНФИГУРАЦИЯ И НАСТРОЙКИ (ЦВЕТА, ТЕКСТ, ИЗОБРАЖЕНИЯ)
// =========================================================
const CONFIG = {
     bgColor: '#000000',
     duotoneYellow: '#E2C84B', // Основной цвет дуотона
     duotoneBlack: '#000000',  // Цвет тени
     contrast: 2.2,             // Контраст (1.0 - 3.5)
     posterizeLevels: 3.0,      // Ступени постеризации (2 - жесткий дуотон)
     grungeIntensity: 0.45,     // Интенсивность шума и гранжа (0.0 - 1.0)
     scrollSensitivity: 1.2,    // Чувствительность смещения от колесика/скролла
     autoScroll: true,          // Постоянный авто-дрейф полос
     autoScrollSpeed: 0.6,      // Скорость авто-дрейфа

     // Индивидуальные цвета для 4-х полос фото (опционально):
     rowColors: {
          0: { light: '#E2C84B', dark: '#000000' }, // Полоса 1
          1: { light: '#87CEEB', dark: '#000000' }, // Полоса 2
          2: { light: '#E2C84B', dark: '#000000' }, // Полоса 3
          3: { light: '#E5E5E5', dark: '#000000' }, // Полоса 4
     },
     // #E2C84B
     lines: {
          text1: 'Framax Xlife • Framax Xlife plus • Frami Xlife • Alu-Framax Xlife • DokaXlight • Top 50 • FF20 • KS Xlife • Monolithic system • Dokaflex • Dokaflex 1-2-4 • Dokadek 30 • Doka Xclimb 60',
          text2: 'Doka floor tables • Dokamatic table • SKE plus • Xclimb 60 climbing formwork • MF240',
          text3: 'SCF Shaft platform • Staxo 40 • Staxo 100 • D3 load-bearing tower • Doka Eurex top • Doka Eurex eco • Doka beam H20 top',
          text4: 'Doka composite beam I tec 20 • Doka 3-S top • Framax quick-acting clamp • Concremote',
     },

     imageSets: [
          [
               { id: '1', title: 'Framax Xlife Panel', category: 'Doka Systems', url: '/img/1.jpg' },
               { id: '2', title: 'Formwork Construction', category: 'Site', url: '/img/2.jpg' },
               { id: '3', title: 'Heavy Duty Shoring', category: 'Staxo', url: '/img/3.jpg' },
               { id: '4', title: 'Dokaflex Floor System', category: 'Floors', url: '/img/4.jpg' },
               { id: '5', title: 'Climbing Formwork', category: 'Xclimb', url: '/img/5.jpg' },
               { id: '6', title: 'Monolithic Casting', category: 'Concrete', url: '/img/6.jpg' },
          ],
          [
               { id: '7', title: 'Staxo 100 Tower', category: 'Load-Bearing', url: '/img/7.jpg' },
               { id: '8', title: 'Doka Beam H20 Top', category: 'Beams', url: '/img/8.jpg' },
               { id: '9', title: 'Dokamatic Table', category: 'Tables', url: '/img/9.jpg' },
               { id: '10', title: 'Concremote Sensors', category: 'Tech', url: '/img/10.jpg' },
               { id: '11', title: 'Framax Clamp Lock', category: 'Clamps', url: '/img/11.jpg' },
               { id: '12', title: 'Shaft Platform SCF', category: 'Platforms', url: '/img/12.jpg' },
          ],
          [
               { id: '13', title: 'Doka Eurex Top Props', category: 'Props', url: '/img/13.jpg' },
               { id: '14', title: '3-S Top Sheets', category: 'Plywood', url: '/img/14.jpg' },
               { id: '15', title: 'Xclimb 60 Hydraulic', category: 'Hydraulics', url: '/img/15.jpg' },
               { id: '16', title: 'DokaXlight Aluminium', category: 'Lightweight', url: '/img/16.jpg' },
               { id: '17', title: 'I tec 20 Composite', category: 'Beams', url: '/img/1.jpg' },
               { id: '18', title: 'High-Rise Construction', category: 'SKE Plus', url: '/img/2.jpg' },
          ],
          [
               { id: '19', title: 'KS Xlife Heavy Duty', category: 'Wall Formwork', url: '/img/3.jpg' },
               { id: '20', title: 'SKE Plus Automated', category: 'Self-Climbing', url: '/img/4.jpg' },
               { id: '21', title: 'FF20 Circular Formwork', category: 'Curved Concrete', url: '/img/5.jpg' },
               { id: '22', title: 'Dokadek 30 Panel', category: 'Handset Slab', url: '/img/6.jpg' },
               { id: '23', title: 'Alu-Framax Lightweight', category: 'Alu Frame', url: '/img/7.jpg' },
               { id: '24', title: 'MF240 Crane Handling', category: 'Climbing', url: '/img/8.jpg' },
          ]
     ]
};

// =========================================================
// 2. GLSL ШЕЙДЕРЫ
// =========================================================
const DuotoneShader = {
     uniforms: {
          tDiffuse: { value: null },
          uColorLight: { value: new THREE.Color('#E2C84B') },
          uColorDark: { value: new THREE.Color('#000000') },
          uContrast: { value: 1.8 },
          uPosterizeLevels: { value: 3.0 },
          uGrungeIntensity: { value: 0.45 },
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

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = rand(i);
      float b = rand(i + vec2(1.0, 0.0));
      float c = rand(i + vec2(0.0, 1.0));
      float d = rand(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
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
      
      float grain = (rand(vUv * 600.0 + uTime * 0.05) - 0.5) * uGrungeIntensity * 0.3;
      float paperGrain = noise(vUv * 80.0) * uGrungeIntensity * 0.15;

      vec3 finalColor = duotoneColor + vec3(grain - paperGrain);
      if (uHover > 0.0) {
        finalColor += vec3(0.15, 0.12, 0.0) * uHover;
      }

      finalColor = max(vec3(0.0), finalColor);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const TextGrungeShader = {
     uniforms: {
          tDiffuse: { value: null },
          uColor: { value: new THREE.Color('#FFFFFF') },
          uGrungeIntensity: { value: 0.45 },
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

      float grain = rand(vUv * 500.0) * uGrungeIntensity * 0.35;
      float scratch = smoothstep(0.48, 0.52, rand(vec2(vUv.x * 250.0, vUv.y * 12.0)));
      
      float alpha = texColor.a;
      if (scratch < 0.18 * uGrungeIntensity) {
        alpha *= 0.65;
      }

      vec3 col = uColor - vec3(grain);
      gl_FragColor = vec4(col, alpha);
    }
  `
};

// =========================================================
// 3. ГЕНЕРАТОРЫ ТЕКСТУР И КАНВАС-НОЙСА
// =========================================================
function generateProceduralPortrait(index, width = 512, height = 640) {
     const canvas = document.createElement('canvas');
     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext('2d');

     ctx.fillStyle = '#111';
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

function createStretchedTextTexture(text, fontFamily = 'Space Grotesk, Impact, Arial Black, sans-serif', targetHeight = 256) {
     const cleanText = text.toUpperCase();

     const measureCanvas = document.createElement('canvas');
     const measureCtx = measureCanvas.getContext('2d');
     const baseFontSize = targetHeight * 0.85;
     measureCtx.font = `900 ${baseFontSize}px ${fontFamily}`;

     const measuredWidth = measureCtx.measureText(cleanText).width;
     let canvasWidth = Math.max(2048, Math.ceil(measuredWidth + baseFontSize));
     let finalText = cleanText;

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

     const imgData = ctx.getImageData(0, 0, canvasWidth, targetHeight);
     const data = imgData.data;
     for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
               const noise = (Math.random() - 0.5) * 45;
               data[i] = Math.min(255, Math.max(0, data[i] + noise));
               data[i + 1] = Math.min(255, Math.max(0, data[i] + noise));
               data[i + 2] = Math.min(255, Math.max(0, data[i] + noise));
          }
     }
     ctx.putImageData(imgData, 0, 0);

     const texture = new THREE.CanvasTexture(canvas);
     texture.needsUpdate = true;
     texture.userData = { aspectRatio: canvasWidth / 2048, canvasWidth };
     return texture;
}

// =========================================================
// 4. THREE.JS 3D КОМПОНЕНТЫ
// =========================================================
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

function ImageGridLine({ items, rowY, rowHeight, lineOffsetRef, direction, config, gridIndex, onSelect }) {
     const { viewport } = useThree();
     const groupRef = useRef();

     const rowColorLight = (config.rowColors && config.rowColors[gridIndex]?.light) || config.duotoneYellow;
     const rowColorDark = (config.rowColors && config.rowColors[gridIndex]?.dark) || config.duotoneBlack;

     const cardsInViewport = 6;
     const cardWidth = viewport.width / cardsInViewport;
     const repeatedItems = useMemo(() => [...items, ...items, ...items], [items]);

     const singleSetWidth = items.length * cardWidth;
     const totalRowWidth = repeatedItems.length * cardWidth;

     useFrame(() => {
          if (groupRef.current && lineOffsetRef.current !== undefined) {
               const currentOffset = lineOffsetRef.current;
               // Направление движения: 'left' -> влево (-), 'right' -> вправо (+)
               const directedOffset = direction === 'left' ? -currentOffset : currentOffset;
               const wrappedX = ((directedOffset % singleSetWidth) + singleSetWidth) % singleSetWidth;
               groupRef.current.position.x = wrappedX - singleSetWidth;
          }
     });

     return (
          <group ref={groupRef} position={[0, rowY, 0]}>
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

function TextLine({ text, rowY, rowHeight, lineOffsetRef, direction, config }) {
     const { viewport } = useThree();
     const groupRef = useRef();

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
          if (groupRef.current && lineOffsetRef.current !== undefined) {
               const currentOffset = lineOffsetRef.current;
               // Направление движения: 'left' -> влево (-), 'right' -> вправо (+)
               const directedOffset = direction === 'left' ? -currentOffset : currentOffset;
               const wrappedX = ((directedOffset % planeWidth) + planeWidth) % planeWidth;
               groupRef.current.position.x = wrappedX;
          }
     });

     return (
          <group ref={groupRef} position={[0, rowY, 0]}>
               {[-2, -1, 0, 1, 2, 3].map((repeatIndex) => (
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

// =========================================================
// 5. РАЗНОНАПРАВЛЕННЫЙ СКРОЛЛ (ПОДДЕРЖКА WHEEL + SCROLL)
// =========================================================
function PosterContent({ config, onSelect , contact, town }) {
     const { viewport } = useThree();

     const lineOffsetRef = useRef(0);
     const targetOffsetRef = useRef(0);
     const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

     useEffect(() => {
          // Слушаем скролл окна браузера
          const handleScroll = () => {
               const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
               const deltaY = currentScrollY - lastScrollYRef.current;
               lastScrollYRef.current = currentScrollY;
               targetOffsetRef.current += deltaY * 1.5 * config.scrollSensitivity;
               // contact(true)
          };

          // Слушаем прямое событие колесика мыши
          const handleWheel = (e) => {
               targetOffsetRef.current += e.deltaY * 0.8 * config.scrollSensitivity;
               setTimeout(() => {
                    contact(true)
                    town(false)
               },1200)
          };

          // Слушаем тач-события для мобильных устройств
          let touchStartY = 0;
          const handleTouchStart = (e) => {
               touchStartY = e.touches[0].clientY;
          };
          const handleTouchMove = (e) => {
               const currentY = e.touches[0].clientY;
               const deltaY = touchStartY - currentY;
               touchStartY = currentY;
               targetOffsetRef.current += deltaY * 1.5 * config.scrollSensitivity;
          };

          window.addEventListener('scroll', handleScroll, { passive: true });
          window.addEventListener('wheel', handleWheel, { passive: true });
          window.addEventListener('touchstart', handleTouchStart, { passive: true });
          window.addEventListener('touchmove', handleTouchMove, { passive: true });

          return () => {
               window.removeEventListener('scroll', handleScroll);
               window.removeEventListener('wheel', handleWheel);
               window.removeEventListener('touchstart', handleTouchStart);
               window.removeEventListener('touchmove', handleTouchMove);
          };
     }, [config.scrollSensitivity]);

     useFrame((state, delta) => {
          // Авто-движение
          if (config.autoScroll) {
               targetOffsetRef.current += delta * 60.0 * config.autoScrollSpeed;
          }

          // Плавный lerp смещения
          lineOffsetRef.current = THREE.MathUtils.lerp(
               lineOffsetRef.current,
               targetOffsetRef.current,
               0.1
          );
     });

     const totalLines = 8;
     const rowHeight = viewport.height / totalLines;
     const startY = viewport.height / 2 - rowHeight / 2;

     // Чередование направлений: 'left' <-> 'right'
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
                                   lineOffsetRef={lineOffsetRef}
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
                                   lineOffsetRef={lineOffsetRef}
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

// =========================================================
// 6. ПОП-АП МОДАЛЬНОЕ ОКНО (ВНЕ CANVAS)
// =========================================================
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

                         {/*<a*/}
                         {/*     href={item.url}*/}
                         {/*     target="_blank"*/}
                         {/*     rel="noreferrer"*/}
                         {/*     style={{*/}
                         {/*          display: 'block',*/}
                         {/*          textAlign: 'center',*/}
                         {/*          backgroundColor: color,*/}
                         {/*          color: '#000000',*/}
                         {/*          fontWeight: 'bold',*/}
                         {/*          padding: '12px 20px',*/}
                         {/*          borderRadius: '8px',*/}
                         {/*          textDecoration: 'none',*/}
                         {/*          fontSize: '13px',*/}
                         {/*          textTransform: 'uppercase'*/}
                         {/*     }}*/}
                         {/*>*/}
                         {/*     Открыть оригинал*/}
                         {/*</a>*/}
                    </div>
               </div>
          </div>
     );
}

// =========================================================
// 7. ГЛАВНЫЙ ЭКСПОРТИРУЕМЫЙ КОМПОНЕНТ
// =========================================================
export default function InteractivePoster({ town,  contact,  customConfig = {} }) {
     const [selectedData, setSelectedData] = useState(null);

     const activeConfig = useMemo(() => {
          return { ...CONFIG, ...customConfig };
     }, [customConfig]);

     return (
          <div style={{ backgroundColor: activeConfig.bgColor, color: '#ffffff', minHeight: '100vh', width: '100%' }}>

               {/* СЕКЦИЯ 1: ИНТЕРАКТИВНЫЙ ПЛАКАТ */}
               <section style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
                    <Canvas
                         gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
                         style={{ width: '100%', height: '100%', background: activeConfig.bgColor }}
                    >
                         <OrthographicCamera makeDefault position={[0, 0, 100]} zoom={1} />
                         <PosterContent
                              config={activeConfig}
                              onSelect={(item, color) => setSelectedData({ item, color })}
                              contact={contact}
                              town={town}
                         />
                    </Canvas>

                    {/* SVG ФИЛЬТР ЗЕРНИСТОСТИ */}
                    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                         <filter id="poster-noise-filter">
                              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                              <feColorMatrix type="saturate" values="0" />
                              <feComponentTransfer>
                                   <feFuncA type="linear" slope="0.12" />
                              </feComponentTransfer>
                         </filter>
                    </svg>

                    {/* ОВЕРЛЕЙ ШУМА ПОВЕРХ ПЛАКАТА */}
                    <div
                         style={{
                              position: 'absolute',
                              inset: 0,
                              pointerEvents: 'none',
                              filter: 'url(#poster-noise-filter)',
                              opacity: 0.9,
                              mixBlendMode: 'screen',
                              zIndex: 10
                         }}
                    />
               </section>


               {/* ПОП-АП МОДАЛЬНОЕ ОКНО */}
               <ImagePopup
                    selectedData={selectedData}
                    onClose={() => setSelectedData(null)}
               />
          </div>
     );
}
