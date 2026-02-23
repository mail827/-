import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
  }
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
}

export default function KakaoAddressInput({ value, onChange, label, placeholder = '도로명, 지번, 건물명 검색' }: Props) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || document.querySelector('script[src*="postcode.v2"]')) {
      loaded.current = true;
      return;
    }
    const s = document.createElement('script');
    s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    s.async = true;
    s.onload = () => { loaded.current = true; };
    document.head.appendChild(s);
  }, []);

  const openSearch = () => {
    if (!window.daum?.Postcode) {
      const s = document.createElement('script');
      s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = () => {
        loaded.current = true;
        openSearch();
      };
      document.head.appendChild(s);
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const addr = data.roadAddress || data.jibunAddress;
        const extra = data.buildingName ? ` (${data.buildingName})` : '';
        onChange(addr + extra);
      },
    }).open();
  };

  return (
    <div>
      {label && <label className="block text-sm text-stone-600 mb-2">{label}</label>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <button
          type="button"
          onClick={openSearch}
          className="flex items-center gap-1.5 px-4 py-3 bg-stone-800 text-white rounded-xl text-sm whitespace-nowrap hover:bg-stone-700 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">주소 검색</span>
          <span className="sm:hidden">검색</span>
        </button>
      </div>
    </div>
  );
}
