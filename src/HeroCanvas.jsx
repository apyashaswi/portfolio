import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'

function Gem() {
  const outer = useRef()
  const inner = useRef()
  const core = useRef()
  useFrame(({ clock: { elapsedTime: t } }) => {
    outer.current.rotation.x = t * 0.18
    outer.current.rotation.y = t * 0.28
    inner.current.rotation.x = -t * 0.12
    inner.current.rotation.y = t * 0.22
    core.current.rotation.y = t * 0.4
  })
  return (
    <group>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial color="#7F77DD" wireframe opacity={0.55} transparent />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color="#1D9E75" opacity={0.08} transparent />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          color="#7F77DD"
          emissive="#7F77DD"
          emissiveIntensity={0.6}
          opacity={0.18}
          transparent
        />
      </mesh>
    </group>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 55 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 4]} intensity={2.5} color="#7F77DD" />
      <pointLight position={[-4, -2, -4]} intensity={1.2} color="#1D9E75" />
      <Stars radius={90} depth={60} count={2000} factor={3} saturation={0} fade speed={0.6} />
      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={1.2}>
        <group position={[2.2, 0, 0]}>
          <Gem />
        </group>
      </Float>
    </Canvas>
  )
}
