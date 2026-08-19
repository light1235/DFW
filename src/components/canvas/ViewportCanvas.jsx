import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Вы можете свободно менять любые точки — финал теперь зафиксирован математически ниже
const SPLINE_POINTS = [
     [ 0, 10, 45 ],
     [ 4.573, 4.081, 19.287 ],
     [ -6.804, 7.593, 4.072 ],
     [ -4.132, 11.091, -9.748 ],
];

// ЖЕСТКО ФИКСИРОВАННЫЕ ДАННЫЕ ПОРТАЛА И КАМЕРЫ НА ФИНИШЕ
const PORTAL_POS = new THREE.Vector3(1.393, 7.104, -10.86);
const PORTAL_ROT = new THREE.Euler(0, -115 * (Math.PI / 180), 0);

// Вычисляем идеальную финальную позицию камеры (в 3.5 единицах прямо перед порталом)
const FINAL_CAM_POS = new THREE.Vector3(0, 0, 1.0)
     .applyEuler(PORTAL_ROT)
     .add(PORTAL_POS);

// Вычисляем идеальный финальный поворот камеры (смотрим строго на портал)
const FINAL_CAM_QUAT = new THREE.Quaternion().setFromRotationMatrix(
     new THREE.Matrix4().lookAt(FINAL_CAM_POS, PORTAL_POS, new THREE.Vector3(0, 1, 0))
);

const Easings = {
     linear: t => t,
     easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
     easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
     easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
     easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
     easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};

const CLOSED = false;
const TENSION = 0.50;
const EASING_NAME = 'linear';
const FLIGHT_DURATION = 3.50;
const FLIP_ENABLED = false;
const FLIP_TURNS = 1.00;
const SHAKE_ENABLED = false;
const SHAKE_INTENSITY = 0.30;
const TOTAL_POINTS = 5;
const WAYPOINTS = [];
const WAYPOINT_POINT_NUMBERS = [];

export function ScrollCameraPath({ onArrive = {}, portal }) {
     const { camera, gl } = useThree();
     const curve = useMemo(() => new THREE.CatmullRomCurve3(
          SPLINE_POINTS.map(p => new THREE.Vector3(...p)),
          CLOSED, "catmullrom", TENSION
     ), []);

     const onArriveRef = useRef(onArrive);
     onArriveRef.current = onArrive;

     // Временные переменные в памяти, чтобы не создавать мусор в useFrame (GC)
     const memo = useMemo(() => ({
          posAtSwitch: new THREE.Vector3(),
          quatAtSwitch: new THREE.Quaternion(),
          currentPos: new THREE.Vector3(),
          currentQuat: new THREE.Quaternion()
     }), []);

     const state = useRef({
          scrollT: 0,
          animating: false,
          fromT: 0,
          toT: 0,
          elapsed: 0,
          waypointCursor: 0,
          currentTargetPoint: null,
          hasScrolledYet: false,
          initialQuaternion: new THREE.Quaternion(),
          isFirstFlight: true,
          savedStateAtSwitch: false // Флаг фиксации координат в точке 0.85
     });

     useEffect(() => {
          const onWheel = (e) => {
               e.preventDefault();
               const s = state.current;
               if (s.animating) return;
               if (e.deltaY < 0) return;
               if (!s.hasScrolledYet) {
                    s.initialQuaternion.copy(camera.quaternion);
                    s.hasScrolledYet = true;
                    setTimeout(() => {
                       portal(true)
                    }, 2200)
               }

               if (WAYPOINTS.length >= 2) {
                    const dir = e.deltaY > 0 ? 1 : -1;
                    const next = s.waypointCursor + dir;
                    if (next < 0 || next >= WAYPOINTS.length) return;
                    s.fromT = s.scrollT; s.toT = WAYPOINTS[next]; s.elapsed = 0; s.animating = true;
                    s.waypointCursor = next;
                    s.currentTargetPoint = WAYPOINT_POINT_NUMBERS[next];
                    return;
               }

               const target = e.deltaY > 0 ? 1 : 0;
               if (Math.abs(s.scrollT - target) < 0.001) return;
               s.fromT = s.scrollT; s.toT = target; s.elapsed = 0; s.animating = true;
               s.currentTargetPoint = target === 1 ? TOTAL_POINTS : 1;

               // Сбрасываем флаг фиксации при новом скролле назад/вперед
               if (s.toT === 0) s.savedStateAtSwitch = false;
          };
          gl.domElement.addEventListener("wheel", onWheel, { passive: false });
          return () => gl.domElement.removeEventListener("wheel", onWheel);
     }, [gl, camera]);

     useFrame((_, dt) => {
          const s = state.current;

          if (!s.hasScrolledYet) return;

          let flightRaw = 0;
          let justArrivedAt = null;
          if (s.animating) {
               s.elapsed += dt;
               const raw = Math.min(s.elapsed / FLIGHT_DURATION, 1);
               const eased = Easings[EASING_NAME](raw);
               s.scrollT = s.fromT + (s.toT - s.fromT) * eased;
               flightRaw = raw;
               if (raw >= 1) {
                    s.animating = false;
                    s.scrollT = s.toT;
                    justArrivedAt = s.currentTargetPoint;
                    s.currentTargetPoint = null;
                    s.isFirstFlight = false;
                    s.savedStateAtSwitch = false;
               }
          }

          const t = Math.min(Math.max(s.scrollT, 0), 1);

          // ТОЧКА ПЕРЕКЛЮЧЕНИЯ: Решаем с 85% прогресса уходить со сплайна напрямую к порталу
          const SWITCH_T = 0.85;

          if (t < SWITCH_T) {
               // --- ЭТАП 1: ОБЫЧНЫЙ ПОЛЕТ ПО СПЛАЙНУ ---
               s.savedStateAtSwitch = false; // Сбрасываем флаг, если вернулись скроллом назад

               // Нормализуем t от 0 до 1 на отрезке сплайна
               const normalizedT = Math.min(t / SWITCH_T, 0.999);
               const p = curve.getPointAt(normalizedT);
               const look = curve.getPointAt(Math.min(normalizedT + 0.008, 1));

               camera.position.copy(p);

               const m = new THREE.Matrix4().lookAt(p, look, new THREE.Vector3(0, 1, 0));
               const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(m);

               if (s.isFirstFlight && s.fromT === 0 && s.toT === 1) {
                    camera.quaternion.copy(s.initialQuaternion).slerp(targetQuaternion, flightRaw);
               } else {
                    camera.quaternion.copy(targetQuaternion);
               }
          } else {
               // --- ЭТАП 2: ИДЕАЛЬНО ПЛАВНЫЙ ФИНАЛЬНЫЙ СХОД К ПОРТАЛУ ---

               // 1. Запоминаем точную позицию и разворот камеры в момент схода со сплайна
               if (!s.savedStateAtSwitch) {
                    const pAtSwitch = curve.getPointAt(0.999);
                    const lookAtSwitch = curve.getPointAt(1);
                    memo.posAtSwitch.copy(pAtSwitch);

                    const mAtSwitch = new THREE.Matrix4().lookAt(pAtSwitch, lookAtSwitch, new THREE.Vector3(0, 1, 0));
                    memo.quatAtSwitch.setFromRotationMatrix(mAtSwitch);

                    s.savedStateAtSwitch = true;
               }

               // 2. Вычисляем локальный прогресс финиша от 0 до 1 (на отрезке времени от 0.85 до 1.0)
               const finalAlpha = (t - SWITCH_T) / (1 - SWITCH_T);
               // Используем легкое сглаживание (Cubic Out) специально для финишного долета
               const smoothAlpha = 1 - Math.pow(1 - finalAlpha, 3);

               // 3. Линейно интерполируем позицию и угол от точки схода к финальной точке
               memo.currentPos.lerpVectors(memo.posAtSwitch, FINAL_CAM_POS, smoothAlpha);
               memo.currentQuat.copy(memo.quatAtSwitch).slerp(FINAL_CAM_QUAT, smoothAlpha);

               camera.position.copy(memo.currentPos);
               camera.quaternion.copy(memo.currentQuat);
          }

          if (justArrivedAt != null && onArriveRef.current[justArrivedAt]) {
               onArriveRef.current[justArrivedAt](camera.position.clone());
          }

          if (s.animating && FLIP_ENABLED) {
               camera.rotateZ(flightRaw * FLIP_TURNS * Math.PI * 2);
          }
          if (s.animating && SHAKE_ENABLED) {
               const envelope = Math.sin(flightRaw * Math.PI);
               const amt = SHAKE_INTENSITY * envelope;
               const time = s.elapsed * 22;
               const nx = Math.sin(time * 1.7) * 0.6 + Math.sin(time * 3.1) * 0.4;
               const ny = Math.sin(time * 2.3 + 1.5) * 0.6 + Math.sin(time * 4.1) * 0.4;
               const nz = Math.sin(time * 1.9 + 3.0) * 0.5;
               camera.position.addScaledVector(new THREE.Vector3(nx, ny, nz), amt * 0.35);
               camera.rotateX(nx * amt * 0.04);
               camera.rotateY(ny * amt * 0.04);
               camera.rotateZ(nz * amt * 0.03);
          }
     });

     return null;
}
