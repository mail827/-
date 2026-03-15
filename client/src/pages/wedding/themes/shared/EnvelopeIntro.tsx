import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ENVELOPES: Record<string, {
  closed: string;
  opened?: string;
  texture: string;
  bg: string;
  textColor: string;
  cardTextColor: string;
}> = {
  black_ribbon: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551431/1-Photoroom_foq0wz.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773552601/1-Photoroom_iwjehu.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_rlqwsh.png',
    bg: '#0a0a0a',
    textColor: '#e8dfd4',
    cardTextColor: '#3a3a3a',
  },
  white_ribbon: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/3-Photoroom_zftkad.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#f5f3ef',
    textColor: '#5a4a3a',
    cardTextColor: '#3a3a3a',
  },
  navy_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/2-Photoroom_wmyxia.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548955/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%AE%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a0xf6m.png',
    bg: '#0d1520',
    textColor: '#c0d0e0',
    cardTextColor: '#2a3a4a',
  },
  black_silver: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/4-Photoroom_lnyaib.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a3ijav.png',
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    cardTextColor: '#3a3a3a',
  },
  olive_ribbon_a: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/5-Photoroom_b3ap27.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png',
    bg: '#1a1f18',
    textColor: '#c0ccb8',
    cardTextColor: '#3a4a3a',
  },
  olive_ribbon_b: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/6-Photoroom_zopodw.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png',
    bg: '#2a3028',
    textColor: '#c8d4c0',
    cardTextColor: '#3a4a3a',
  },
  pink_ribbon: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/7-Photoroom_y9bijv.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_eqxske.png',
    bg: '#2a1820',
    textColor: '#e8c0d0',
    cardTextColor: '#5a3a4a',
  },
  white_bow: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/8-Photoroom_akpnjh.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/14_epp2uk.png',
    bg: '#f0eeea',
    textColor: '#5a5a5a',
    cardTextColor: '#3a3a3a',
  },
  white_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/9-Photoroom_vrwsw2.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#f0eeea',
    textColor: '#5a5a5a',
    cardTextColor: '#3a3a3a',
  },
  black_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/10-Photoroom_ufpw7v.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_rlqwsh.png',
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    cardTextColor: '#3a3a3a',
  },
  pink_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551434/11-Photoroom_yitcbl.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_e6nscu.png',
    bg: '#1f1518',
    textColor: '#e0c0cc',
    cardTextColor: '#5a3a4a',
  },
  olive_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551436/13-Photoroom_gevewd.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png',
    bg: '#1a1f18',
    textColor: '#b8c4a8',
    cardTextColor: '#3a4a3a',
  },
};

interface EnvelopeIntroProps {
  groomName: string;
  brideName: string;
  weddingDate: string;
  style?: string;
  theme?: string;
  cardText?: string;
  onComplete: () => void;
}

export default function EnvelopeIntro({ groomName, brideName, weddingDate, style = 'black_ribbon', cardText, onComplete }: EnvelopeIntroProps) {
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'rising' | 'done'>('sealed');
  const env = ENVELOPES[style] || ENVELOPES.black_ribbon;
  const hasOpened = !!env.opened;

  const dateStr = (() => {
    try {
      const d = new Date(weddingDate);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch { return ''; }
  })();

  const handleComplete = useCallback(() => { onComplete(); }, [onComplete]);

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(handleComplete, 800);
      return () => clearTimeout(t);
    }
  }, [phase, handleComplete]);

  const handleTap = () => {
    if (phase !== 'sealed') return;
    if (hasOpened) {
      setPhase('opening');
      setTimeout(() => setPhase('rising'), 1000);
      setTimeout(() => setPhase('done'), 3000);
    } else {
      setPhase('opening');
      setTimeout(() => setPhase('rising'), 600);
      setTimeout(() => setPhase('done'), 2400);
    }
  };

  const displayText = cardText || `${groomName} & ${brideName}의\n결혼식에 초대합니다`;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
            background: env.bg,
          }}
        >
          <div style={{ position: 'relative', width: '72vw', maxWidth: '300px' }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {hasOpened ? (
                <>
                  <motion.img
                    src={env.closed}
                    alt=""
                    animate={phase === 'sealed' ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.3))', position: phase === 'sealed' ? 'relative' : 'absolute', top: 0, left: 0, right: 0 }}
                  />
                  <motion.img
                    src={env.opened}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={(phase === 'opening' || phase === 'rising') ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.3))', position: phase === 'sealed' ? 'absolute' : 'relative', top: 0, left: 0, right: 0 }}
                  />
                </>
              ) : (
                <motion.img
                  src={env.closed}
                  alt=""
                  animate={phase !== 'sealed' ? { scale: 0.92, y: 20 } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.3))' }}
                />
              )}

              <motion.div
                initial={{ y: '100%' }}
                animate={phase === 'rising' ? { y: '-105%' } : { y: '100%' }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '8%',
                  right: '8%',
                  height: '85%',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
                  zIndex: 10,
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${env.texture})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1.5rem',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.15)',
                    pointerEvents: 'none',
                  }} />
                  <p style={{
                    fontSize: 9,
                    letterSpacing: '0.35em',
                    color: env.cardTextColor,
                    opacity: 0.4,
                    marginBottom: 20,
                    textTransform: 'uppercase',
                    position: 'relative',
                    fontFamily: "'Noto Serif KR', 'Georgia', serif",
                  }}>
                    Wedding Invitation
                  </p>
                  <p style={{
                    fontSize: 22,
                    fontWeight: 300,
                    color: env.cardTextColor,
                    letterSpacing: '0.08em',
                    lineHeight: 1.8,
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap',
                    position: 'relative',
                    fontFamily: "'Noto Serif KR', 'Georgia', serif",
                  }}>
                    {displayText}
                  </p>
                  <div style={{ width: 28, height: 1, background: env.cardTextColor, opacity: 0.15, margin: '20px auto', position: 'relative' }} />
                  <p style={{
                    fontSize: 12,
                    color: env.cardTextColor,
                    opacity: 0.4,
                    letterSpacing: '0.15em',
                    position: 'relative',
                    fontFamily: "'Noto Serif KR', 'Georgia', serif",
                  }}>
                    {dateStr}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {phase === 'sealed' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{
                fontSize: 11,
                color: env.textColor,
                opacity: 0.3,
                marginTop: '2.5rem',
                letterSpacing: '0.2em',
                fontFamily: "'Noto Serif KR', 'Georgia', serif",
              }}
            >
              초대장을 열어보세요
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
