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
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
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
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#0d1520',
    textColor: '#c0d0e0',
    cardTextColor: '#4a4038',
  },
  black_silver: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551432/4-Photoroom_lnyaib.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554169/4-Photoroom_edpnf6.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    cardTextColor: '#4a4038',
  },
  olive_ribbon_a: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/5-Photoroom_b3ap27.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554171/5-Photoroom_s2qbgb.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#1a1f18',
    textColor: '#c0ccb8',
    cardTextColor: '#4a4038',
  },
  olive_ribbon_b: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/6-Photoroom_zopodw.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554170/6-Photoroom_rk9mz4.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#2a3028',
    textColor: '#c8d4c0',
    cardTextColor: '#4a4038',
  },
  pink_ribbon: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/7-Photoroom_y9bijv.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554171/7-Photoroom_mdhoku.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#2a1820',
    textColor: '#e8c0d0',
    cardTextColor: '#4a4038',
  },
  white_bow: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551433/8-Photoroom_akpnjh.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554176/8-Photoroom_oeseqq.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
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
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    cardTextColor: '#4a4038',
  },
  pink_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551434/11-Photoroom_yitcbl.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554182/11-Photoroom_udcsss.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#1f1518',
    textColor: '#e0c0cc',
    cardTextColor: '#4a4038',
  },
  olive_seal: {
    closed: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773551436/13-Photoroom_gevewd.png',
    opened: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773554182/12_draoxq.png',
    texture: 'https://res.cloudinary.com/duzlquvxj/image/upload/v1773548953/13_gj3dud.png',
    bg: '#1a1f18',
    textColor: '#b8c4a8',
    cardTextColor: '#4a4038',
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
  const [phase, setPhase] = useState<'sealed' | 'open' | 'card' | 'done'>('sealed');
  const [envHeight, setEnvHeight] = useState(0);
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
      const t = setTimeout(handleComplete, 1000);
      return () => clearTimeout(t);
    }
  }, [phase, handleComplete]);

  const handleTap = () => {
    if (phase !== 'sealed') return;
    setPhase('open');
    setTimeout(() => setPhase('card'), 800);
    setTimeout(() => setPhase('done'), 5000);
  };

  const cardFont = fontFamily ? `'${fontFamily}', 'Noto Serif KR', Georgia, serif` : "'Noto Serif KR', Georgia, serif";
  const finalCardColor = cardColor || env.cardTextColor;
  const displayText = cardText || `${groomName} & ${brideName}의\n결혼식에 초대합니다`;
  const cardSlide = envHeight ? -(envHeight * 0.55) : -200;

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
          <div style={{ position: 'relative', width: '60vw', maxWidth: '260px' }}>

            <motion.div
              initial={{ y: 0 }}
              animate={phase === 'card' ? { y: cardSlide } : { y: 0 }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: '10%',
                left: '12%',
                right: '12%',
                bottom: '10%',
                zIndex: 1,
                borderRadius: '2px',
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
                padding: '2rem 1rem',
              }}>
                <p style={{
                  fontSize: 8,
                  letterSpacing: '0.35em',
                  color: finalCardColor,
                  opacity: 0.5,
                  marginBottom: 16,
                  textTransform: 'uppercase',
                  fontFamily: cardFont,
                }}>
                  Wedding Invitation
                </p>
                <p style={{
                  fontSize: 15,
                  fontWeight: 300,
                  color: finalCardColor,
                  lineHeight: 2,
                  textAlign: 'center',
                  whiteSpace: 'pre-wrap',
                  fontFamily: cardFont,
                }}>
                  {displayText}
                </p>
                <div style={{ width: 20, height: 1, background: finalCardColor, opacity: 0.12, margin: '14px auto' }} />
                <p style={{
                  fontSize: 10,
                  color: finalCardColor,
                  opacity: 0.4,
                  letterSpacing: '0.2em',
                  fontFamily: cardFont,
                }}>
                  {dateStr}
                </p>
              </div>
            </motion.div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              {hasOpened ? (
                <>
                  <motion.img
                    src={env.closed}
                    alt=""
                    animate={phase === 'sealed' ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    onLoad={(e) => setEnvHeight((e.target as HTMLImageElement).offsetHeight)}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <motion.img
                    src={env.opened}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={phase !== 'sealed' ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ width: '100%', height: 'auto', display: 'block', position: 'absolute', top: 0, left: 0 }}
                  />
                </>
              ) : (
                <img
                  src={env.closed}
                  alt=""
                  onLoad={(e) => setEnvHeight((e.target as HTMLImageElement).offsetHeight)}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
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
