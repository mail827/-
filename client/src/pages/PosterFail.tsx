import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PosterFail() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const message = params.get('message');

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 440, width: '100%', padding: '40px 20px', textAlign: 'center' }}>
        <XCircle size={40} style={{ color: '#C4855C', margin: '0 auto 20px' }} />
        <p style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>결제가 취소됐어요</p>
        <p style={{ fontSize: 13, color: '#A8A8A0', lineHeight: 1.6, marginBottom: 8 }}>{message || '결제를 취소하셨거나 오류가 발생했습니다.'}</p>
        {code && <p style={{ fontSize: 11, color: '#ccc' }}>({code})</p>}
        <Link to="/poster" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 28, padding: '14px 28px', background: '#2C2C2A', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          <ArrowLeft size={14} />다시 시도하기
        </Link>
      </div>
    </div>
  );
}
