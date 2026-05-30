import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'

function Gem() {
  const outer = useRef()
  const inner = useRef()
  const core = useRef()
  useFrame(({ clock: { elapsedTime: t } }) => {
    outer.current.rotation.x = t * 0.14
    outer.current.rotation.y = t * 0.22
    inner.current.rotation.x = -t * 0.09
    inner.current.rotation.y = t * 0.18
    core.current.rotation.y = t * 0.32
  })
  return (
    <group>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial color="#8b83e4" wireframe opacity={0.32} transparent />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color="#2bb088" opacity={0.05} transparent />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          color="#8b83e4"
          emissive="#8b83e4"
          emissiveIntensity={0.32}
          opacity={0.12}
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
      <ambientLight intensity={0.28} />
      <pointLight position={[4, 4, 4]} intensity={1.4} color="#8b83e4" />
      <pointLight position={[-4, -2, -4]} intensity={0.7} color="#2bb088" />
      <pointLight position={[2, -3, 2]} intensity={0.55} color="#e89f6b" />
      <Stars radius={90} depth={60} count={900} factor={2.4} saturation={0} fade speed={0.45} />
      <Float speed={1.0} rotationIntensity={0.15} floatIntensity={0.9}>
        <group position={[2.2, 0, 0]}>
          <Gem />
        </group>
      </Float>
    </Canvas>
  )
}
