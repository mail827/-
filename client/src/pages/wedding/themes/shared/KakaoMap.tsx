import { useEffect, useRef, useState } from 'react';

interface KakaoMapProps {
  address: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
}

declare global {
  interface Window {
    kakao?: any;
  }
}

export default function KakaoMap({ address, venue, latitude, longitude, className = '' }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    if (!address && !venue && !latitude) return;
    
    const initMap = () => {
      if (!mapRef.current || !window.kakao?.maps) return;
      
      window.kakao.maps.load(() => {
        const places = new window.kakao.maps.services.Places();
        const geocoder = new window.kakao.maps.services.Geocoder();
        
        const createMap = (coords: any) => {
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3
          });
          
          new window.kakao.maps.Marker({
            map,
            position: coords
          });
          
          setMapLoaded(true);
        };
        
        // 1. 직접 입력한 좌표가 있으면 최우선
        if (latitude && longitude) {
          const coords = new window.kakao.maps.LatLng(latitude, longitude);
          createMap(coords);
          return;
        }
        
        // 2. 장소명으로 검색 (카카오맵 등록 장소 - 더 정확)
        if (venue) {
          places.keywordSearch(venue, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              createMap(coords);
            } else {
              // 3. 장소명 실패시 주소로 검색
              geocoder.addressSearch(address, (addrResult: any, addrStatus: any) => {
                if (addrStatus === window.kakao.maps.services.Status.OK) {
                  const coords = new window.kakao.maps.LatLng(addrResult[0].y, addrResult[0].x);
                  createMap(coords);
                }
              });
            }
          });
        } else {
          // venue 없으면 주소로만 검색
          geocoder.addressSearch(address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              createMap(coords);
            }
          });
        }
      });
    };
    
    if (window.kakao?.maps) {
      initMap();
    } else {
      const checkKakao = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(checkKakao);
          initMap();
        }
      }, 100);
      
      setTimeout(() => clearInterval(checkKakao), 10000);
      return () => clearInterval(checkKakao);
    }
  }, [address, venue, latitude, longitude]);
  
  return (
    <div 
      ref={mapRef} 
      className={`w-full bg-stone-100 flex items-center justify-center ${className || "h-48 sm:h-64"}`}
    >
      {!mapLoaded && (
        <span className="text-stone-400 text-sm">지도를 불러오는 중...</span>
      )}
    </div>
  );
}
