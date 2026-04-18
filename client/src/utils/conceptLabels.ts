export const CONCEPT_LABELS: Record<string, string> = {
  studio_classic: '스튜디오 클래식', studio_gallery: '갤러리', studio_fog: '포그', studio_mocha: '모카', studio_sage: '세이지',
  hanbok_wonsam: '궁중 혼례', hanbok_dangui: '당의 한복', hanbok_modern: '모던 한복', hanbok_saeguk: '사극풍', hanbok_flower: '꽃한복',
  spring_letter: '봄의 편지', summer_rain: '소나기', autumn_film: '가을 필름', winter_zhivago: '겨울 지바고',
  lovesick: '러브시크', silver_thread: '실버스레드', summer_tape: '서머테이프', rouge_clue: '루즈클루', in_the_mood: '화양연화', summer_film: '썸머필름', lily_choucho: '릴리슈슈', nocturnal_animals: '녹터널 애니멀즈', santorini_linen: '산토리니 리넨', age_of_innocence: '순수의 시대', blurred_spring: '흐릿한 봄', rosewater_ballet: '사랑방다실',
  cherry_blossom: '벚꽃', forest_wedding: '숲속 웨딩', castle_garden: '유럽 궁전', cathedral: '성당', watercolor: '수채화', rose_garden: '장미정원',
  rainy_day: '비오는 날', grass_rain: '풀밭', eternal_blue: '블루', water_memory: '물의 기억', blue_hour: '블루아워',
  black_swan: '블랙스완', velvet_rouge: '벨벳루즈', heart_editorial: '에디토리얼', magazine_cover: '매거진커버', city_night: '시티나이트',
  vintage_film: '빈티지 필름', vintage_record: '빈티지 레코드', vintage_tungsten: '빈티지 텅스텐', retro_hongkong: '레트로 홍콩',
  cruise_sunset: '크루즈 선셋', cruise_bluesky: '크루즈 블루스카이',
  iphone_selfie: '셀카 스냅', iphone_mirror: '거울 셀카',
  aao: '에에올',
};

export function conceptLabel(concept: string): string {
  return CONCEPT_LABELS[concept] || concept.replace(/_/g, ' ');
}
