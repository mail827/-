import { useState, useEffect } from 'react';
import { Trash2, Clock, CheckCircle, XCircle, Send } from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  message: string;
  status: 'PENDING' | 'REPLIED' | 'CLOSED';
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REPLIED' | 'CLOSED'>('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInquiries(data);
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;
    setSending(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/inquiries/${selectedInquiry.id}/reply`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reply: replyText }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setInquiries(inquiries.map(i => i.id === updated.id ? updated : i));
        setSelectedInquiry(null);
        setReplyText('');
      }
    } catch (e) {
      console.error('Failed to reply:', e);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/inquiries/${id}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const updated = await res.json();
        setInquiries(inquiries.map(i => i.id === updated.id ? updated : i));
      }
    } catch (e) {
      console.error('Failed to close:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setInquiries(inquiries.filter(i => i.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const filteredInquiries = inquiries.filter(i => filter === 'ALL' || i.status === filter);

  const statusConfig = {
    PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: '대기중' },
    REPLIED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: '답변완료' },
    CLOSED: { icon: XCircle, color: 'bg-stone-100 text-stone-700', label: '종료' },
  };

  const typeLabels: Record<string, string> = {
    general: '일반 문의',
    payment: '결제 문의',
    custom: '커스텀 문의',
    video: '영상 문의',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">1:1 문의</h1>
          <p className="text-stone-500 mt-1">총 {inquiries.length}건의 문의</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-sm text-stone-500 mb-1">대기중</div>
          <div className="text-2xl font-bold text-yellow-600">{inquiries.filter(i => i.status === 'PENDING').length}건</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-sm text-stone-500 mb-1">답변완료</div>
          <div className="text-2xl font-bold text-green-600">{inquiries.filter(i => i.status === 'REPLIED').length}건</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-sm text-stone-500 mb-1">종료</div>
          <div className="text-2xl font-bold text-stone-600">{inquiries.filter(i => i.status === 'CLOSED').length}건</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex gap-2">
          {(['ALL', 'PENDING', 'REPLIED', 'CLOSED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === f ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f === 'ALL' ? '전체' : statusConfig[f].label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-stone-100">
          {filteredInquiries.map((inquiry) => {
            const status = statusConfig[inquiry.status];
            const StatusIcon = status.icon;
            
            return (
              <div key={inquiry.id} className="p-4 hover:bg-stone-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">
                        {typeLabels[inquiry.type] || inquiry.type}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="font-medium text-stone-800 mb-1">{inquiry.name}</div>
                    <div className="text-sm text-stone-500 mb-2">{inquiry.email} {inquiry.phone && `/ ${inquiry.phone}`}</div>
                    <p className="text-stone-700 whitespace-pre-wrap">{inquiry.message}</p>
                    
                    {inquiry.reply && (
                      <div className="mt-3 p-3 bg-stone-50 rounded-xl">
                        <div className="text-xs text-stone-500 mb-1">답변 ({new Date(inquiry.repliedAt!).toLocaleDateString('ko-KR')})</div>
                        <p className="text-stone-700 whitespace-pre-wrap">{inquiry.reply}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {inquiry.status === 'PENDING' && (
                      <button
                        onClick={() => { setSelectedInquiry(inquiry); setReplyText(''); }}
                        className="px-3 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900"
                      >
                        답변하기
                      </button>
                    )}
                    {inquiry.status === 'REPLIED' && (
                      <button
                        onClick={() => handleClose(inquiry.id)}
                        className="px-3 py-2 bg-stone-200 text-stone-600 text-sm rounded-lg hover:bg-stone-300"
                      >
                        종료
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(inquiry.id)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInquiries.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            문의 내역이 없습니다
          </div>
        )}
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-stone-800 mb-4">답변 작성</h3>
            <div className="mb-4 p-3 bg-stone-50 rounded-xl">
              <div className="text-sm text-stone-500 mb-1">{selectedInquiry.name}님의 문의</div>
              <p className="text-stone-700">{selectedInquiry.message}</p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답변을 입력하세요..."
              className="w-full h-32 p-3 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="flex-1 py-3 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50"
              >
                취소
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="flex-1 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? '전송중...' : '답변 전송'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
