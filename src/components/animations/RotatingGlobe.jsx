import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

function Globe() {

  const globeRef = useRef()

  useFrame(() => {
    globeRef.current.rotation.y += 0.0008
  })

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial
        color="#3b82f6"
        wireframe
        transparent
        opacity={0.25}
      />
    </mesh>
  )
}

function MoneyRoute({ start, end }) {

  const points = []
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(0, 3, 0), 
    new THREE.Vector3(...end)
  )

  for (let i = 0; i <= 20; i++) {
    points.push(curve.getPoint(i / 20))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#22c55e" linewidth={2} />
    </line>
  )
}

function MoneyParticle({ path }) {

  const ref = useRef()

  useFrame(({ clock }) => {

    const t = (clock.getElapsedTime() * 0.2) % 1

    const point = path.getPoint(t)

    ref.current.position.set(point.x, point.y, point.z)

  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#10b981" />
    </mesh>
  )
}

export default function RotatingGlobe() {

  const routeCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-2,0,1),
    new THREE.Vector3(0,3,0),
    new THREE.Vector3(2,0,-1)
  )

  return (

    <div className="absolute inset-0 opacity-50">

      <Canvas camera={{ position:[0,0,6] }}>

        <ambientLight intensity={0.5}/>
        <pointLight position={[10,10,10]}/>

        <Globe/>

        <MoneyRoute start={[-2,0,1]} end={[2,0,-1]} />

        <MoneyParticle path={routeCurve}/>

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.25}
        />

      </Canvas>

    </div>

  )
}