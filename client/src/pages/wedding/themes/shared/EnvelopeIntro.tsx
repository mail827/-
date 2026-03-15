import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ENVELOPE_SETS: Record<string, { envelope: string; texture: string; textColor: string; sealColor: string }> = {
  ivory: {
    envelope: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548951/11_ncw2o3.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    textColor: '#5a4a3a',
    sealColor: '#C9A87C',
  },
  black: {
    envelope: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548951/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8_pdsdjy.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_rlqwsh.png',
    textColor: '#e8dfd4',
    sealColor: '#C9A96E',
  },
  blue: {
    envelope: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%AE_xfs5yd.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548955/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%AE%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a0xf6m.png',
    textColor: '#e0e8f0',
    sealColor: '#a0b8cc',
  },
  green: {
    envelope: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%8B%E1%85%A9%E1%86%AF%E1%84%85%E1%85%B5%E1%84%87%E1%85%B3_jwf7x7.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png',
    textColor: '#3a4a3a',
    sealColor: '#7a8a6a',
  },
  pink: {
    envelope: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548957/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3_ahvvya.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_eqxske.png',
    textColor: '#5a4550',
    sealColor: '#c8a0a8',
  },
};

interface EnvelopeIntroProps {
  groomName: string;
  brideName: string;
  weddingDate: string;
  style?: string;
  onComplete: () => void;
}

export default function EnvelopeIntro({ groomName, brideName, weddingDate, style = 'ivory', onComplete }: EnvelopeIntroProps) {
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'rising' | 'done'>('sealed');
  const set = ENVELOPE_SETS[style] || ENVELOPE_SETS.ivory;

  const dateStr = (() => {
    try {
      const d = new Date(weddingDate);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch { return ''; }
  })();

  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleTap = () => {
    if (phase === 'sealed') {
      setPhase('opening');
      setTimeout(() => setPhase('rising'), 800);
      setTimeout(() => setPhase('done'), 2200);
    }
  };

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={handleTap}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: phase === 'sealed' ? 'pointer' : 'default',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${set.texture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: style === 'black' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.15)',
          }} />

          <div style={{ position: 'relative', zIndex: 2, perspective: '1200px', width: '280px' }}>
            <div style={{ position: 'relative' }}>
              <motion.div
                animate={phase === 'opening' || phase === 'rising' ? { rotateX: -180 } : { rotateX: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100px',
                  transformOrigin: 'top center',
                  zIndex: phase === 'sealed' ? 5 : 1,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(180deg, ${set.sealColor}22 0%, ${set.sealColor}11 100%)`,
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                  backfaceVisibility: 'hidden',
                  borderBottom: `1px solid ${set.sealColor}33`,
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(0deg, ${set.sealColor}22 0%, ${set.sealColor}11 100%)`,
                  clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                  transform: 'rotateX(180deg)',
                  backfaceVisibility: 'hidden',
                }} />
              </motion.div>

              <div style={{
                width: '280px',
                height: '180px',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                position: 'relative',
              }}>
                <img src={set.envelope} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <motion.div
                animate={
                  phase === 'rising'
                    ? { y: -220, opacity: 1 }
                    : { y: 0, opacity: phase === 'opening' ? 1 : 0 }
                }
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: phase === 'rising' ? 0.1 : 0 }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '15px',
                  right: '15px',
                  height: '200px',
                  background: style === 'black' ? '#1a1a1a' : '#fff',
                  borderRadius: '3px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  zIndex: 3,
                }}
              >
                <p style={{ fontSize: 10, letterSpacing: '0.3em', color: set.textColor, opacity: 0.4, marginBottom: 12 }}>
                  WEDDING INVITATION
                </p>
                <p style={{ fontSize: 18, fontWeight: 300, color: set.textColor, letterSpacing: '0.1em' }}>
                  {groomName} & {brideName}
                </p>
                <p style={{ fontSize: 12, color: set.textColor, opacity: 0.5, marginTop: 8 }}>
                  {dateStr}
                </p>
              </motion.div>
            </div>
          </div>

          {phase === 'sealed' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              style={{
                position: 'relative',
                zIndex: 2,
                fontSize: 12,
                color: set.textColor,
                opacity: 0.4,
                marginTop: '2rem',
                letterSpacing: '0.1em',
              }}
            >
              터치하여 열기
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
