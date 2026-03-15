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
    cardTextColor: '#4a4038',
  },
  white_ribbon: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/3-Photoroom_zftkad.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554170/3-Photoroom_npcbdu.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#f5f3ef',
    textColor: '#5a4a3a',
    cardTextColor: '#4a4038',
  },
  navy_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/2-Photoroom_wmyxia.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554169/2-Photoroom_pkxbmk.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548955/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%AE%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a0xf6m.png',
    bg: '#0d1520',
    textColor: '#c0d0e0',
    cardTextColor: '#2a3a4a',
  },
  black_silver: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/4-Photoroom_lnyaib.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554169/4-Photoroom_edpnf6.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a3ijav.png',
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    cardTextColor: '#4a4038',
  },
  olive_ribbon_a: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/5-Photoroom_b3ap27.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554171/5-Photoroom_s2qbgb.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png',
    bg: '#1a1f18',
    textColor: '#c0ccb8',
    cardTextColor: '#3a4a3a',
  },
  olive_ribbon_b: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/6-Photoroom_zopodw.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554170/6-Photoroom_rk9mz4.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png',
    bg: '#2a3028',
    textColor: '#c8d4c0',
    cardTextColor: '#3a4a3a',
  },
  pink_ribbon: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/7-Photoroom_y9bijv.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554171/7-Photoroom_mdhoku.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548956/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_eqxske.png',
    bg: '#2a1820',
    textColor: '#e8c0d0',
    cardTextColor: '#5a3a4a',
  },
  white_bow: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/8-Photoroom_akpnjh.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554176/8-Photoroom_oeseqq.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/14_epp2uk.png',
    bg: '#f0eeea',
    textColor: '#5a5a5a',
    cardTextColor: '#4a4038',
  },
  white_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/9-Photoroom_vrwsw2.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554176/9-Photoroom_dzl3pv.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#f0eeea',
    textColor: '#5a5a5a',
    cardTextColor: '#4a4038',
  },
  black_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/10-Photoroom_ufpw7v.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554178/10-Photoroom_ypaxop.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_rlqwsh.png',
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    cardTextColor: '#4a4038',
  },
  pink_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551434/11-Photoroom_yitcbl.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554182/11-Photoroom_udcsss.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_e6nscu.png',
    bg: '#1f1518',
    textColor: '#e0c0cc',
    cardTextColor: '#5a3a4a',
  },
  olive_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551436/13-Photoroom_gevewd.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554182/12_draoxq.png',
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
  cardText?: string;
  fontFamily?: string;
  cardColor?: string;
  onComplete: () => void;
}

export default function EnvelopeIntro({ groomName, brideName, weddingDate, style = 'black_ribbon', cardText, fontFamily, cardColor, onComplete }: EnvelopeIntroProps) {
  const [phase, setPhase] = useState<'sealed' | 'drop' | 'card' | 'done'>('sealed');
  const env = ENVELOPES[style] || ENVELOPES.black_ribbon;

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
    setPhase('drop');
    setTimeout(() => setPhase('card'), 1200);
    setTimeout(() => setPhase('done'), 4500);
  };

  const displayText = cardText || `${groomName} & ${brideName}의\n결혼식에 초대합니다`;
  const cardFont = fontFamily ? `'${fontFamily}', 'Noto Serif KR', Georgia, serif` : "'Noto Serif KR', Georgia, serif";
  const finalCardColor = cardColor || env.cardTextColor;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
          <motion.div
            animate={
              phase === 'sealed'
                ? { y: 0, opacity: 1, scale: 1 }
                : phase === 'drop'
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: '120vh', opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 1.2, ease: [0.55, 0, 0.15, 1] }}
            style={{ width: '60vw', maxWidth: '260px', position: 'relative' }}
          >
            <motion.img
              src={env.closed}
              alt=""
              animate={phase === 'sealed' ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {env.opened && (
              <motion.img
                src={env.opened}
                alt=""
                initial={{ opacity: 0 }}
                animate={phase !== 'sealed' ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', height: 'auto', display: 'block', position: 'absolute', top: 0, left: 0 }}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={
              phase === 'card'
                ? { scale: 1, opacity: 1, y: 0 }
                : { scale: 0.5, opacity: 0, y: 40 }
            }
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              width: '72vw',
              maxWidth: '320px',
              aspectRatio: '3/4',
              borderRadius: '4px',
              overflow: 'hidden',
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
              padding: '2.5rem 1.5rem',
            }}>
              <p style={{
                fontSize: 8,
                letterSpacing: '0.4em',
                color: finalCardColor,
                opacity: 0.45,
                marginBottom: 24,
                textTransform: 'uppercase',
                fontFamily: cardFont,
              }}>
                Wedding Invitation
              </p>
              <p style={{
                fontSize: 18,
                fontWeight: 300,
                color: finalCardColor,
                lineHeight: 2,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                fontFamily: cardFont,
              }}>
                {displayText}
              </p>
              <div style={{ width: 24, height: 1, background: finalCardColor, opacity: 0.1, margin: '20px auto' }} />
              <p style={{
                fontSize: 11,
                color: finalCardColor,
                opacity: 0.35,
                letterSpacing: '0.2em',
                fontFamily: cardFont,
              }}>
                {dateStr}
              </p>
            </div>
          </motion.div>

          {phase === 'sealed' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{
                fontSize: 11,
                color: env.textColor,
                opacity: 0.3,
                marginTop: '2rem',
                letterSpacing: '0.2em',
                fontFamily: cardFont,
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
