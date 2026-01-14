import { useEffect, useRef, useState } from 'react';

interface KakaoMapProps {
  address: string;
  className?: string;
}

declare global {
  interface Window {
    kakao?: any;
  }
}

export default function KakaoMap({ address, className = '' }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    if (!address) return;
    
    const initMap = () => {
      if (!mapRef.current || !window.kakao?.maps) return;
      
      window.kakao.maps.load(() => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            const map = new window.kakao.maps.Map(mapRef.current, {
              center: coords,
              level: 3
            });
            
            new window.kakao.maps.Marker({
              map,
              position: coords
            });
            
            setMapLoaded(true);
          }
        });
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
  }, [address]);
  
  return (
    <div 
      ref={mapRef} 
      className={`w-full h-48 sm:h-64 bg-stone-100 flex items-center justify-center ${className}`}
    >
      {!mapLoaded && (
        <span className="text-stone-400 text-sm">지도를 불러오는 중...</span>
      )}
    </div>
  );
}
