const fs = require('fs');

const files = [
  'client/src/pages/wedding/themes/BotanicalClassic.tsx',
  'client/src/pages/wedding/themes/HeartMinimal.tsx',
  'client/src/pages/wedding/themes/WaveBorder.tsx',
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');

  c = c.replace(/w\.groomNameEn/g, '(w as any).groomNameEn');
  c = c.replace(/w\.brideNameEn/g, '(w as any).brideNameEn');

  c = c.replace(/kakaoMapUrl=\{w\.venueKakaoMap\}/g, '');

  c = c.replace(/ theme="BOTANICAL_CLASSIC"/g, '');
  c = c.replace(/ theme="HEART_MINIMAL"/g, '');
  c = c.replace(/ theme="WAVE_BORDER"/g, '');

  fs.writeFileSync(f, c);
  console.log('Fixed: ' + f);
}

const wp = 'client/src/pages/wedding/WeddingPage.tsx';
let wpc = fs.readFileSync(wp, 'utf8');
const importBlock = wpc.match(/import \{[\s\S]*?\} from '\.\/themes';/);
if (importBlock) {
  let block = importBlock[0];
  for (const name of ['BotanicalClassic', 'HeartMinimal', 'WaveBorder']) {
    if (!block.includes(name)) {
      block = block.replace("} from './themes';", `  ${name},\n} from './themes';`);
    }
  }
  wpc = wpc.replace(importBlock[0], block);
  fs.writeFileSync(wp, wpc);
  console.log('Fixed: ' + wp);
}
