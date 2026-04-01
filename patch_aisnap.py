#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# patch_aisnap.py - aiSnap.ts 사계 4컨셉 + SEEDREAM OUTFIT + 폴링 수정
# Usage: cd /Users/mac/Desktop/협업/wedding-app && python3 patch_aisnap.py

import sys, os

SERVER = 'server/src/routes/aiSnap.ts'
CLIENT = 'client/src/pages/admin/AdminAiSnap.tsx'

if not os.path.exists(SERVER):
    print(f'[ERROR] {SERVER} not found. Run from wedding-app root.')
    sys.exit(1)

with open(SERVER, 'r', encoding='utf-8') as f:
    code = f.read()

ok_count = 0
warn_count = 0

# ============================================================
# 1) CONCEPTS array - add 사계 4 after aao
# ============================================================
aao_concept = "{ id: 'aao', label: '"
if aao_concept in code:
    idx = code.index(aao_concept)
    line_end = code.index('\n', idx)
    next_bracket = code.index('];', line_end)
    if 'spring_letter' not in code[idx:next_bracket]:
        insert_at = code.rfind('\n', 0, next_bracket) + 1
        entries = (
            "  { id: 'spring_letter', label: '\ubd04: \ub7ec\ube0c\ub808\ud130' },\n"
            "  { id: 'summer_rain', label: '\uc5ec\ub984: \uc18c\ub098\uae30' },\n"
            "  { id: 'autumn_film', label: '\uac00\uc744: \ud544\ub984' },\n"
            "  { id: 'winter_zhivago', label: '\uaca8\uc6b8: \uc9c0\ubc14\uace0' },\n"
        )
        code = code[:insert_at] + entries + code[insert_at:]
        print('[OK] CONCEPTS - 4 seasons added')
        ok_count += 1
    else:
        print('[SKIP] CONCEPTS - seasons already exist')
else:
    print('[WARN] CONCEPTS aao not found')
    warn_count += 1

# ============================================================
# 2) SEEDREAM_OUTFIT_GROOM - add 6 entries before closing };
# ============================================================
marker_g = "heart_editorial: 'wearing sharp black wool double-breasted six-button"
if marker_g in code and 'SEEDREAM_OUTFIT_GROOM' in code:
    groom_section_start = code.index('SEEDREAM_OUTFIT_GROOM')
    marker_pos = code.index(marker_g, groom_section_start)
    closing = code.index('};', marker_pos)
    check_region = code[marker_pos:closing]
    if 'vintage_tungsten' not in check_region:
        insert_at = code.rfind('\n', 0, closing) + 1
        new_data = (
            "  vintage_tungsten: 'wearing dark navy wool single-breasted two-button suit with slightly wide notch lapels in relaxed vintage cut not slim-fit, straight-leg trousers with gentle break at hem, white cotton dress shirt with soft rounded collar, muted dusty lavender silk tie in slightly loose knot, suit has soft lived-in quality not crisp like pulled from 1978 wardrobe',\n"
            "  aao: 'wearing grand ivory silk shantung double-breasted peak-lapel jacket with long dramatic silhouette extending past the hip, structured wide shoulders, matching high-waisted wide-leg trousers with sharp pressed crease, white silk shirt buttoned to top with cream silk tie, single oversized googly eye with wobbly black pupil pinned on left lapel where boutonniere would be',\n"
            "  spring_letter: 'wearing light warm grey silk-linen blend single-breasted two-button wedding suit soft natural shoulders slightly nipped waist, matching tapered trousers clean break, pale blush pink silk shirt, ivory silk tie soft sheen, small fresh pink peony bud boutonniere left lapel, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',\n"
            "  summer_rain: 'wearing natural off-white washed silk-linen blend unlined single-breasted two-button jacket soft rolled notch lapels relaxed shoulders, matching straight-leg trousers single front pleat, pale water blue silk shirt soft point collar top button undone, no tie, sleeves slightly pushed up, white canvas sneakers, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',\n"
            "  autumn_film: 'wearing rich warm tobacco brown wool-silk blend single-breasted three-button jacket slightly longer length soft natural shoulders, matching straight-leg trousers clean pressed crease, champagne ivory silk shirt soft point collar, deep wine red silk tie, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',\n"
            "  winter_zhivago: 'wearing deep charcoal black silk-wool blend single-breasted two-button jacket clean slim notch lapels sharp fitted silhouette, matching slim straight-leg trousers, silver-white silk shirt soft spread collar, pale icy lavender silk tie, black cashmere overcoat draped over one shoulder, NOT wearing dress NOT skirt NOT gown NOT feminine clothing',\n"
        )
        code = code[:insert_at] + new_data + code[insert_at:]
        print('[OK] SEEDREAM_OUTFIT_GROOM - 6 entries added')
        ok_count += 1
    else:
        print('[SKIP] SEEDREAM_OUTFIT_GROOM - entries already exist')
else:
    print('[WARN] SEEDREAM_OUTFIT_GROOM marker not found')
    warn_count += 1

# ============================================================
# 3) SEEDREAM_OUTFIT_BRIDE - add 6 entries before closing };
# ============================================================
marker_b = "heart_editorial: 'wearing pure white architectural high mock-neck"
if marker_b in code and 'SEEDREAM_OUTFIT_BRIDE' in code:
    bride_section_start = code.index('SEEDREAM_OUTFIT_BRIDE')
    marker_pos = code.index(marker_b, bride_section_start)
    closing = code.index('};', marker_pos)
    check_region = code[marker_pos:closing]
    if 'vintage_tungsten' not in check_region:
        insert_at = code.rfind('\n', 0, closing) + 1
        new_data = (
            "  vintage_tungsten: 'wearing ivory floral cotton lace wedding dress with high Victorian neckline with delicate scalloped edge, long bishop sleeves gathered at wrist with lace cuffs, entire bodice and sleeves of dense floral cotton lace with white silk lining beneath, natural waistline with thin white satin ribbon belt bow, skirt falls in relaxed straight column with slight flare at hem in matching floral lace over silk, simple fingertip-length tulle veil attached at crown, no beading no sequins no modern structure, beautiful vintage dress from a 1970s wedding',\n"
            "  aao: 'wearing grand ivory silk duchess satin off-shoulder ball gown with dramatic oversized sculptural puff sleeves billowing like inflated clouds gathered tightly at wrists, fitted boned corset bodice with smooth powerful silhouette, massive full ball gown skirt with sweeping cathedral-length train, hundreds of tiny mismatched colorful buttons in pastel pink mint lavender butter yellow all different shapes and sizes embroidered in swirling galaxy spiral pattern across entire skirt and train dense at center hip spiraling outward becoming sparse at hem, no lace no beading no sequins, architecturally grand and surreal',\n"
            "  spring_letter: 'wearing soft blush pink silk organza off-shoulder wedding dress with organza petal cap sleeves, fitted corset bodice with seed pearls scattered across bodice, three-tiered organza A-line skirt with long train, natural elegant makeup',\n"
            "  summer_rain: 'wearing pure white silk mikado square-neckline wedding dress with wide straps on edge of shoulders, structured minimal bodice sharp princess seams, softly gathered white silk chiffon skirt gentle sweep train, tiny clear glass beads along square neckline like water droplets, natural elegant makeup',\n"
            "  autumn_film: 'wearing warm champagne ivory silk satin bias-cut V-neckline wedding dress with delicate spaghetti straps crossing at upper back, smooth diagonal drape across torso asymmetric waist fold, fluid column silhouette pooling into puddle train, small cluster silk leaves amber sienna wine red at back strap crossing, natural elegant makeup',\n"
            "  winter_zhivago: 'wearing cool silver-white silk faille high boat neckline long fitted sleeve wedding dress with silk-covered buttons wrist to elbow, sculpted bodice vertical princess seams, full architectural A-line skirt deep inverted box pleats chapel train, thin detachable silk faille cape at shoulders with pale icy lavender silk lining, natural elegant makeup',\n"
        )
        code = code[:insert_at] + new_data + code[insert_at:]
        print('[OK] SEEDREAM_OUTFIT_BRIDE - 6 entries added')
        ok_count += 1
    else:
        print('[SKIP] SEEDREAM_OUTFIT_BRIDE - entries already exist')
else:
    print('[WARN] SEEDREAM_OUTFIT_BRIDE marker not found')
    warn_count += 1

# ============================================================
# 4) SEEDREAM_SCENES - add 4 seasons
# ============================================================
scenes_aao = "aao: 'brightly lit Korean convenience store"
if scenes_aao in code:
    scenes_aao_pos = code.index(scenes_aao)
    scenes_closing = code.index('};', scenes_aao_pos)
    if 'spring_letter' not in code[scenes_aao_pos:scenes_closing]:
        insert_at = code.rfind('\n', 0, scenes_closing) + 1
        new_scenes = (
            "      spring_letter: 'old quiet library with tall windows cherry blossom branches pressing against glass, soft afternoon dappled pink-tinted light filtering through blossoms, dust floating in warm light beams, quiet and still',\n"
            "      summer_rain: 'wide open grass field under blazing summer sun or barley field before thunderstorm, harsh midday sun dappled shade or dramatic split sky, hot summer heat and breeze',\n"
            "      autumn_film: 'narrow Korean residential alley autumn ginkgo leaves or small old portrait studio warm tungsten bulb, extremely low golden afternoon light turning everything amber, quiet unhurried film grain',\n"
            "      winter_zhivago: 'snow-covered landscape at night or early dawn, heavy snowfall or pristine fresh snow, single distant streetlamp warm orange point, cold blue-white monochrome, breath visible freezing air',\n"
        )
        code = code[:insert_at] + new_scenes + code[insert_at:]
        print('[OK] SEEDREAM_SCENES - 4 seasons added')
        ok_count += 1
    else:
        print('[SKIP] SEEDREAM_SCENES - seasons already exist')
else:
    print('[WARN] SEEDREAM_SCENES aao marker not found')
    warn_count += 1

# ============================================================
# 5) COUPLE_PROMPTS - add 4 seasons
# ============================================================
cp_marker = "COUPLE_PROMPTS"
if cp_marker in code:
    cp_start = code.index(cp_marker)
    if 'spring_letter' not in code[cp_start:cp_start+15000]:
        aao_in_cp = code.find("aao:", cp_start)
        if aao_in_cp > 0:
            cp_closing = code.index("';\n", aao_in_cp)
            insert_at = cp_closing + 3
            new_cp = (
                "  spring_letter: 'couple on wide stone steps outside old columned building cherry blossom trees fully bloomed petals falling, woman wearing blush pink organza off-shoulder dress petal cap sleeves seed pearl bodice three-tiered skirt spread across steps, man wearing light warm grey silk-linen suit blush pink shirt ivory tie, sitting with small gap not quite touching, late afternoon side light casting long shadows, quiet and aching, photorealistic, 40mm lens, 8k',\n"
                "  summer_rain: 'couple sitting on stone edge of old shallow natural stream surrounded by tall summer grass feet dangling in clear water, woman wearing white silk mikado square-neck dress chiffon skirt hiked to knees glass bead neckline kicking water, man wearing off-white silk-linen suit trousers rolled up jacket off water blue shirt watching her smiling, late afternoon sun low golden backlight lens flare, photorealistic, 40mm lens, 8k',\n"
                "  autumn_film: 'couple walking slowly away from camera down narrow Korean residential alley autumn, woman wearing champagne silk satin bias-cut dress puddle train dragging across yellow ginkgo leaves, man tobacco brown suit champagne shirt wine red tie, walking side by side her pinky barely hooking his, long shadows sun very low amber, photorealistic, 85mm telephoto, 8k',\n"
                "  winter_zhivago: 'couple dancing slowly in wide open snow field at night heavy snowfall no music, woman wearing silver-white silk faille dress ghostly against snow, man charcoal black suit dark against white, foreheads pressed together eyes closed, slow shutter motion blur snowflakes diagonal lines, single distant streetlamp warm orange, analog film grain quiet infinite, photorealistic, 8k',\n"
            )
            code = code[:insert_at] + new_cp + code[insert_at:]
            print('[OK] COUPLE_PROMPTS - 4 seasons added')
            ok_count += 1
    else:
        print('[SKIP] COUPLE_PROMPTS - seasons already exist')
else:
    print('[WARN] COUPLE_PROMPTS not found')
    warn_count += 1

# ============================================================
# 6) SCENE_ROTATION - vintage_tungsten/aao 타입 수정은 수동 필요
#    (string -> string[] 변환은 구조적 변경이라 자동 패치 위험)
# ============================================================
print('\n[MANUAL] SCENE_ROTATION vintage_tungsten/aao:')
print('  These entries use plain strings instead of string[]. This causes')
print('  arr[random_index] to return a SINGLE CHARACTER instead of a scene.')
print('  Fix: wrap groom/bride values in arrays [...] and add couple key.')
print('  See patch notes for exact replacement.')

# ============================================================
# WRITE SERVER
# ============================================================
with open(SERVER, 'w', encoding='utf-8') as f:
    f.write(code)
print(f'\n=== SERVER SAVED ({ok_count} patches, {warn_count} warnings) ===')

# ============================================================
# 7) CLIENT - AdminAiSnap.tsx polling fix
# ============================================================
if os.path.exists(CLIENT):
    with open(CLIENT, 'r', encoding='utf-8') as f:
        cl = f.read()

    cl_ok = 0

    r1 = cl.replace(
        "useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);",
        "useEffect(() => () => {\n    if (pollRef.current) clearTimeout(pollRef.current);\n    if (stepRef.current) clearInterval(stepRef.current);\n  }, []);"
    )
    if r1 != cl:
        cl = r1
        print('[OK] Client - unmount cleanup (stepRef)')
        cl_ok += 1

    r2 = cl.replace(
        "if (!canGen()) return;\n    setGenerating(true);",
        "if (!canGen()) return;\n    if (pollRef.current) clearTimeout(pollRef.current);\n    if (stepRef.current) clearInterval(stepRef.current);\n    setGenerating(true);"
    )
    if r2 != cl:
        cl = r2
        print('[OK] Client - generate start cleanup')
        cl_ok += 1

    r3 = cl.replace(
        "          } catch {\n            setGenerating(false);\n          }",
        "          } catch {\n            setGenerating(false);\n            clearInterval(stepRef.current);\n          }"
    )
    if r3 != cl:
        cl = r3
        print('[OK] Client - poll catch cleanup')
        cl_ok += 1

    with open(CLIENT, 'w', encoding='utf-8') as f:
        f.write(cl)
    print(f'=== CLIENT SAVED ({cl_ok} patches) ===')
else:
    print(f'[WARN] {CLIENT} not found')

print('\n=== ALL DONE ===')
print('Next: npm run build (server + client) then deploy')
