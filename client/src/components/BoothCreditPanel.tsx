import { useState, useEffect } from 'react';
import { Sparkles, Plus, Loader2, Trash2, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const TIERS = [
  { id: 'booth-10', credits: 10, price: 2900 },
  { id: 'booth-30', credits: 30, price: 6900 },
  { id: 'booth-50', credits: 50, price: 9900 },
  { id: 'booth-100', credits: 100, price: 14900 },
];

interface BoothPhoto {
  id: string;
  guestName: string;
  imageUrl: string;
  message?: string;
  createdAt: string;
}

const loadTossV1 = (): Promise<any> => new Promise((resolve, reject) => {
  if ((window as any).TossPayments) { resolve((window as any).TossPayments); return; }
  const s = document.createElement('script');
  s.src = 'https://js.tosspayments.com/v1/payment';
  s.onload = () => resolve((window as any).TossPayments);
  s.onerror = () => reject(new Error('Toss SDK load failed'));
  document.head.appendChild(s);
});

const conceptLabel = (msg?: string) => {
  const map: Record<string, string> = { gala: 'Gala', flower: 'Flower', hanbok: 'Hanbok', redcarpet: 'Red Carpet', magazine: 'Magazine', champagne: 'Champagne' };
  return msg ? map[msg] || msg : '';
};

export default function BoothCreditPanel({ weddingId, slug }: { weddingId: string; slug: string }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [selectedTier, setSelectedTier] = useState('booth-30');
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<BoothPhoto[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/booth-credit/status/${weddingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setCredits(d.credits))
      .catch(() => {});
    loadPhotos();
  }, [weddingId, slug]);

  const loadPhotos = () => {
    fetch(`${API}/guest-photo/${slug}/ai-booth/gallery`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPhotos(d); })
      .catch(() => {});
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    setDeleting(photoId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/guest-photo/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        if (viewIndex !== null) setViewIndex(null);
      }
    } catch {}
    setDeleting(null);
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/booth-credit/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weddingId, tier: selectedTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const tier = TIERS.find(t => t.id === selectedTier)!;
      const TossPayments = await loadTossV1();
      const tp = TossPayments(data.clientKey);
      await tp.requestPayment('카드', {
        amount: data.order.amount,
        orderId: data.order.orderId,
        orderName: `AI Photo Booth ${tier.credits}`,
        successUrl: `${window.location.origin}/booth-credit/success?weddingId=${weddingId}`,
        failUrl: `${window.location.origin}/edit/${weddingId}`,
      });
    } catch (e: any) {
      if (e.code !== 'USER_CANCEL') alert(e.message || 'Error');
    }
    setLoading(false);
  };

  return (
    <div className="mt-2 space-y-3">
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Booth Credits</span>
          </div>
          <span className="text-sm font-bold text-stone-800">
            {credits !== null ? credits : '-'}
          </span>
        </div>

        {credits !== null && credits <= 5 && (
          <p className="text-xs text-amber-600 mb-3">
            {credits === 0 ? 'No credits remaining' : `${credits} remaining`}
          </p>
        )}

        {!showBuy ? (
          <button
            onClick={() => setShowBuy(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <Plus size={14} />
            Add credits
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedTier === t.id
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <p className={`text-sm font-bold ${selectedTier === t.id ? 'text-white' : 'text-stone-800'}`}>
                    {t.credits}
                  </p>
                  <p className={`text-xs ${selectedTier === t.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {t.price.toLocaleString()}won
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full py-3 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Processing...' : 'Purchase'}
            </button>
            <button
              onClick={() => setShowBuy(false)}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-700">Booth Gallery</span>
            <span className="text-xs text-stone-400">{photos.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {photos.map((p, i) => (
              <div key={p.id} className="relative group aspect-[2/3] rounded-lg overflow-hidden bg-stone-200">
                <img
                  src={p.imageUrl}
                  alt={p.guestName}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setViewIndex(i)}
                  loading="lazy"
                />
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deleting === p.id ? (
                    <Loader2 size={10} className="text-white animate-spin" />
                  ) : (
                    <Trash2 size={10} className="text-white" />
                  )}
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/50 to-transparent">
                  <p className="text-[9px] text-white truncate">{p.guestName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewIndex !== null && photos[viewIndex] && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewIndex(null)}>
          <button onClick={() => setViewIndex(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={24} />
          </button>
          {viewIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setViewIndex(viewIndex - 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white">
              <ChevronLeft size={20} />
            </button>
          )}
          {viewIndex < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setViewIndex(viewIndex + 1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white">
              <ChevronRight size={20} />
            </button>
          )}
          <div onClick={(e) => e.stopPropagation()} className="max-w-sm w-full text-center">
            <img src={photos[viewIndex].imageUrl} alt="" className="w-full rounded-xl mb-4" />
            <p className="text-white text-sm font-medium mb-1">{photos[viewIndex].guestName}</p>
            <p className="text-white/40 text-xs mb-4">{conceptLabel(photos[viewIndex].message)}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { const a = document.createElement('a'); a.href = photos[viewIndex!].imageUrl; a.download = `booth-${Date.now()}.jpg`; a.click(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/20 rounded-full text-white text-xs"
              >
                <Download size={12} />
                Save
              </button>
              <button
                onClick={() => handleDelete(photos[viewIndex!].id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-xs"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
