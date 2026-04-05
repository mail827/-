import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const R2 = 'https://pub-b58d4a5cf82a4aebaa7badae6e00ebf0.r2.dev/envelope';
const CL = 'https://res.cloudinary.com/duzlquvxj/image/upload';

const ENVELOPES: Record<string, {
  closed: string;
  opened?: string;
  bg: string;
  textColor: string;
  legacyTexture?: string;
}> = {
  black_ribbon: {
    closed: `${CL}/v1773551431/1-Photoroom_foq0wz.png`,
    opened: `${CL}/v1773552601/1-Photoroom_iwjehu.png`,
    bg: '#0a0a0a',
    textColor: '#e8dfd4',
    legacyTexture: `${CL}/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_rlqwsh.png`,
  },
  white_ribbon: {
    closed: `${CL}/v1773551432/3-Photoroom_zftkad.png`,
    opened: `${CL}/v1773554170/3-Photoroom_npcbdu.png`,
    bg: '#f5f3ef',
    textColor: '#5a4a3a',
    legacyTexture: `${CL}/v1773548953/13_gj3dud.png`,
  },
  navy_seal: {
    closed: `${CL}/v1773551432/2-Photoroom_wmyxia.png`,
    opened: `${CL}/v1773554169/2-Photoroom_pkxbmk.png`,
    bg: '#0d1520',
    textColor: '#c0d0e0',
    legacyTexture: `${CL}/v1773548955/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%AE%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a0xf6m.png`,
  },
  black_silver: {
    closed: `${CL}/v1773551432/4-Photoroom_lnyaib.png`,
    opened: `${CL}/v1773554169/4-Photoroom_edpnf6.png`,
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    legacyTexture: `${CL}/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_a3ijav.png`,
  },
  olive_ribbon_a: {
    closed: `${CL}/v1773551433/5-Photoroom_b3ap27.png`,
    opened: `${CL}/v1773554171/5-Photoroom_s2qbgb.png`,
    bg: '#1a1f18',
    textColor: '#c0ccb8',
    legacyTexture: `${CL}/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png`,
  },
  olive_ribbon_b: {
    closed: `${CL}/v1773551433/6-Photoroom_zopodw.png`,
    opened: `${CL}/v1773554170/6-Photoroom_rk9mz4.png`,
    bg: '#2a3028',
    textColor: '#c8d4c0',
    legacyTexture: `${CL}/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png`,
  },
  pink_ribbon: {
    closed: `${CL}/v1773551433/7-Photoroom_y9bijv.png`,
    opened: `${CL}/v1773554171/7-Photoroom_mdhoku.png`,
    bg: '#2a1820',
    textColor: '#e8c0d0',
    legacyTexture: `${CL}/v1773548956/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B52_eqxske.png`,
  },
  white_bow: {
    closed: `${CL}/v1773551433/8-Photoroom_akpnjh.png`,
    opened: `${CL}/v1773554176/8-Photoroom_oeseqq.png`,
    bg: '#f0eeea',
    textColor: '#5a5a5a',
    legacyTexture: `${CL}/v1773548952/14_epp2uk.png`,
  },
  white_seal: {
    closed: `${CL}/v1773551433/9-Photoroom_vrwsw2.png`,
    opened: `${CL}/v1773554176/9-Photoroom_dzl3pv.png`,
    bg: '#f0eeea',
    textColor: '#5a5a5a',
    legacyTexture: `${CL}/v1773548953/13_gj3dud.png`,
  },
  black_seal: {
    closed: `${CL}/v1773551433/10-Photoroom_ufpw7v.png`,
    opened: `${CL}/v1773554178/10-Photoroom_ypaxop.png`,
    bg: '#0a0a0a',
    textColor: '#c0c0c0',
    legacyTexture: `${CL}/v1773548952/%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%86%A8%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_rlqwsh.png`,
  },
  pink_seal: {
    closed: `${CL}/v1773551434/11-Photoroom_yitcbl.png`,
    opened: `${CL}/v1773554182/11-Photoroom_udcsss.png`,
    bg: '#1f1518',
    textColor: '#e0c0cc',
    legacyTexture: `${CL}/v1773548953/%E1%84%91%E1%85%B5%E1%86%BC%E1%84%8F%E1%85%B3%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_e6nscu.png`,
  },
  olive_seal: {
    closed: `${CL}/v1773551436/13-Photoroom_gevewd.png`,
    opened: `${CL}/v1773554182/12_draoxq.png`,
    bg: '#1a1f18',
    textColor: '#b8c4a8',
    legacyTexture: `${CL}/v1773548956/%E1%84%80%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A7%E1%86%AB%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%B51_xqsprh.png`,
  },
  white_pink_ribbon: {
    closed: `${R2}/closed/1-Photoroom.png`,
    opened: `${R2}/opened/1-Photoroom.png`,
    bg: '#f5f0ee',
    textColor: '#5a4a4a',
  },
  pink_ivory_ribbon: {
    closed: `${R2}/closed/2-Photoroom.png`,
    opened: `${R2}/opened/2-Photoroom.png`,
    bg: '#2a1820',
    textColor: '#e8c8d0',
  },
  peach_gold_ribbon: {
    closed: `${R2}/closed/3-Photoroom.png`,
    opened: `${R2}/opened/3-Photoroom.png`,
    bg: '#1f1518',
    textColor: '#e0c0c8',
  },
  ivory_gold_ribbon: {
    closed: `${R2}/closed/4-Photoroom.png`,
    opened: `${R2}/opened/4-Photoroom.png`,
    bg: '#1a1610',
    textColor: '#d4c8a8',
  },
  cream_mini_gold: {
    closed: `${R2}/closed/5-Photoroom.png`,
    opened: `${R2}/opened/5-Photoroom.png`,
    bg: '#1a1610',
    textColor: '#d4c8a8',
  },
  cream_gold_chiffon: {
    closed: `${R2}/closed/6-Photoroom.png`,
    opened: `${R2}/opened/6-Photoroom.png`,
    bg: '#1a1610',
    textColor: '#d4c8a8',
  },
  lavender_silver: {
    closed: `${R2}/closed/7-Photoroom.png`,
    opened: `${R2}/opened/7-Photoroom.png`,
    bg: '#1a1520',
    textColor: '#c8b8d8',
  },
  watercolor_twine: {
    closed: `${R2}/closed/8-Photoroom.png`,
    opened: `${R2}/opened/8-Photoroom.png`,
    bg: '#0a0a0a',
    textColor: '#d8c8b8',
  },
  aurora_cotton: {
    closed: `${R2}/closed/9-Photoroom.png`,
    opened: `${R2}/opened/9-Photoroom.png`,
    bg: '#0a0a0a',
    textColor: '#c0c8d8',
  },
};

const CARD_TEXTURES: Record<string, {
  url: string;
  defaultTextColor: string;
  isDark?: boolean;
}> = {
  white_crumple: { url: `${R2}/card/1-Photoroom.png`, defaultTextColor: '#4a4038' },
  ivory_crumple: { url: `${R2}/card/2-Photoroom.png`, defaultTextColor: '#4a4038' },
  emboss_floral: { url: `${R2}/card/3-Photoroom.png`, defaultTextColor: '#4a4038' },
  linen: { url: `${R2}/card/4-Photoroom.png`, defaultTextColor: '#4a4038' },
  daisy_a: { url: `${R2}/card/5-Photoroom.png`, defaultTextColor: '#5a4038' },
  daisy_b: { url: `${R2}/card/6-Photoroom.png`, defaultTextColor: '#5a4038' },
  watercolor_rose: { isDark: true, url: `${R2}/card/7-Photoroom.png`, defaultTextColor: '#ffffff' },
  pink_watercolor: { isDark: true, url: `${R2}/card/8-Photoroom.png`, defaultTextColor: '#ffffff' },
  rose_layer: { isDark: true, url: `${R2}/card/9-Photoroom.png`, defaultTextColor: '#ffffff' },
  purple_aurora: { isDark: true, url: `${R2}/card/10-Photoroom.png`, defaultTextColor: '#ffffff' },
  violet: { isDark: true, url: `${R2}/card/11-Photoroom.png`, defaultTextColor: '#f0e0f0' },
  white_watercolor: { url: `${R2}/card/12-Photoroom.png`, defaultTextColor: '#4a4038' },
  green_hanji_1: { url: `${R2}/card/%EA%B7%B8%EB%A6%B0%ED%8E%B8%EC%A7%80%EC%A7%801.png`, defaultTextColor: '#e8dfd4' },
  green_hanji_2: { url: `${R2}/card/%EA%B7%B8%EB%A6%B0%ED%8E%B8%EC%A7%80%EC%A7%802.png`, defaultTextColor: '#3a4a3a' },
  black_hanji_1: { isDark: true, url: `${R2}/card/%EB%B8%94%EB%9E%99%ED%8E%B8%EC%A7%80%EC%A7%801.png`, defaultTextColor: '#e0d8cc' },
  black_hanji_2: { isDark: true, url: `${R2}/card/%EB%B8%94%EB%9E%99%ED%8E%B8%EC%A7%80%EC%A7%802.png`, defaultTextColor: '#e0d8cc' },
  blue_fabric_1: { isDark: true, url: `${R2}/card/%EB%B8%94%EB%A3%A8%ED%8E%B8%EC%A7%80%EC%A7%801.png`, defaultTextColor: '#c0d0e0' },
  blue_fabric_2: { isDark: true, url: `${R2}/card/%EB%B8%94%EB%A3%A8%ED%8E%B8%EC%A7%80%EC%A7%802.png`, defaultTextColor: '#c0d0e0' },
  pink_silk_1: { url: `${R2}/card/%ED%95%91%ED%81%AC%ED%8E%B8%EC%A7%80%EC%A7%801.png`, defaultTextColor: '#5a3a4a' },
  pink_fabric_2: { url: `${R2}/card/%ED%95%91%ED%81%AC%ED%8E%B8%EC%A7%80%EC%A7%802.png`, defaultTextColor: '#5a3a4a' },
};

interface EnvelopeIntroProps {
  groomName: string;
  brideName: string;
  weddingDate: string;
  style?: string;
  cardStyle?: string;
  cardText?: string;
  fontFamily?: string;
  cardColor?: string;
  locale?: string;
  onComplete: () => void;
}

export default function EnvelopeIntro({ groomName, brideName, weddingDate, style = 'black_ribbon', cardStyle, cardText, fontFamily, cardColor, locale = 'ko', onComplete }: EnvelopeIntroProps) {
  const [phase, setPhase] = useState<'sealed' | 'drop' | 'card' | 'done'>('sealed');
  const env = ENVELOPES[style] || ENVELOPES.black_ribbon;

  const card = cardStyle ? CARD_TEXTURES[cardStyle] : null;
  const textureUrl = card ? card.url : env.legacyTexture || CARD_TEXTURES.white_crumple.url;
  const defaultCardTextColor = card ? card.defaultTextColor : '#4a4038';
  const isCardDark = card?.isDark || false;
  const embossShadow = isCardDark
    ? '0 1px 0 rgba(255,255,255,0.15), 0 -1px 1px rgba(0,0,0,0.6)'
    : '0 -1px 0 rgba(0,0,0,0.15), 0 1px 1px rgba(255,255,255,0.6)';

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

  const displayText = cardText ? cardText : locale === 'en' ? `${groomName} & ${brideName}\nrequest the pleasure of your company` : `${groomName} & ${brideName}의\n결혼식에 초대합니다`;
  const cardFont = fontFamily ? `'${fontFamily}', 'Noto Serif KR', Georgia, serif` : "'Noto Serif KR', Georgia, serif";
  const finalCardColor = cardColor || defaultCardTextColor;

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
              backgroundImage: `url(${textureUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}>

            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
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
                textShadow: embossShadow,
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
                textShadow: embossShadow,
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
                textShadow: embossShadow,
              }}>
                {dateStr}
              </p>
            </div>
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
              {locale === 'en' ? 'Something begins when you open this.' : '초대장을 열어보세요'}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ENVELOPES, CARD_TEXTURES };
