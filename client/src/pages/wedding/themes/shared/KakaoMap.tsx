import { useEffect, useRef, useState } from 'react';

interface KakaoMapProps {
  address: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  locale?: string;
  mapAddress?: string;
  mapVenue?: string;
}

declare global {
  interface Window {
    kakao?: any;
  }
}

export default function KakaoMap({ address, venue, latitude, longitude, className = '', locale = 'ko', mapAddress, mapVenue }: KakaoMapProps) {
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
          new window.kakao.maps.Marker({ map, position: coords });
          setMapLoaded(true);
        };

        if (latitude && longitude) {
          createMap(new window.kakao.maps.LatLng(latitude, longitude));
          return;
        }

        const geoAddr = mapAddress || address;
        const geoVenue = mapVenue || venue;

        const fallbackToAddress = (addr: string) => {
          geocoder.addressSearch(addr, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              createMap(new window.kakao.maps.LatLng(result[0].y, result[0].x));
            }
          });
        };

        if (geoVenue) {
          places.keywordSearch(geoVenue, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              createMap(new window.kakao.maps.LatLng(result[0].y, result[0].x));
            } else {
              fallbackToAddress(geoAddr);
            }
          });
        } else {
          fallbackToAddress(geoAddr);
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
  }, [address, venue, latitude, longitude, mapAddress, mapVenue]);

  return (
    <div
      ref={mapRef}
      className={`w-full bg-stone-100 flex items-center justify-center ${className || "h-48 sm:h-64"}`}
    >
      {!mapLoaded && (
        <span className="text-stone-400 text-sm">
          {locale === 'en' ? 'Loading map...' : '지도를 불러오는 중...'}
        </span>
      )}
    </div>
  );
}
