import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Copy, Trash2, Eye, Pencil, Check, X, Plus, ExternalLink, Loader2 } from 'lucide-react';

interface SnapshotLink {
  id: string;
  version: string;
  label: string | null;
  viewCount: number;
  sharedAt: string;
  createdAt: string;
  wedding: { slug: string };
}

interface Wedding {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
}

interface Props {
  weddings: Wedding[];
}

export default function SharedLinkManager({ weddings }: Props) {
  const [links, setLinks] = useState<Record<string, SnapshotLink[]>>({});
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (weddings.length === 0) return;
    loadAllLinks();
  }, [weddings]);

  const loadAllLinks = async () => {
    setLoading(true);
    const result: Record<string, SnapshotLink[]> = {};
    await Promise.all(
      weddings.map(async (w) => {
        try {
          const res = await fetch(`${API}/snapshot/list/${w.id}`);
          if (res.ok) result[w.id] = await res.json();
        } catch {}
      })
    );
    setLinks(result);
    setLoading(false);
  };

  const createLink = async (weddingId: string) => {
    try {
      const res = await fetch(`${API}/snapshot/${weddingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() || null })
      });
      if (res.ok) {
        setNewLabel('');
        setCreatingId(null);
        loadAllLinks();
      }
    } catch {}
  };

  const updateLabel = async (id: string) => {
    try {
      const res = await fetch(`${API}/snapshot/${id}/label`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel.trim() || null })
      });
      if (res.ok) {
        setEditingId(null);
        setEditLabel('');
        loadAllLinks();
      }
    } catch {}
  };

  const deleteLink = async (id: string) => {
    try {
      const res = await fetch(`${API}/snapshot/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        loadAllLinks();
      }
    } catch {}
  };

  const bulkDelete = async (weddingId: string) => {
    setBulkDeleting(true);
    try {
      const res = await fetch(`${API}/snapshot/bulk/${weddingId}`, { method: 'DELETE' });
      if (res.ok) {
        setBulkDeleteConfirm(null);
        loadAllLinks();
      }
    } catch {}
    setBulkDeleting(false);
  };

  const copyLink = async (slug: string, version: string, id: string) => {
    const url = `${window.location.origin}/w/${slug}?v=${version}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const openLink = (slug: string, version: string) => {
    window.open(`/w/${slug}?v=${version}`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (weddings.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-stone-400 mb-1">SHARED LINKS</p>
          <h2 className="font-serif text-xl sm:text-2xl text-stone-800">공유 링크 관리</h2>
        </div>
      </div>
      <p className="text-sm text-stone-400 mb-8">
        공유할 때마다 그 시점의 청첩장이 저장돼요. 수정해도 이미 보낸 링크는 그대로 유지됩니다.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
        </div>
      ) : (
        <div className="space-y-8">
          {weddings.map((wedding) => {
            const weddingLinks = links[wedding.id] || [];

            return (
              <div key={wedding.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                      <Link2 className="w-4 h-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {wedding.groomName} & {wedding.brideName}
                      </p>
                      <p className="text-xs text-stone-400">{weddingLinks.length}개의 공유 링크</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {weddingLinks.length > 0 && (
                      <button
                        onClick={() => setBulkDeleteConfirm(wedding.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        전체 삭제
                      </button>
                    )}

                    {creatingId === wedding.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="링크 이름 (선택)"
                          maxLength={20}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') createLink(wedding.id);
                            if (e.key === 'Escape') { setCreatingId(null); setNewLabel(''); }
                          }}
                          className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg outline-none focus:border-stone-400 w-36"
                        />
                        <button
                          onClick={() => createLink(wedding.id)}
                          className="p-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setCreatingId(null); setNewLabel(''); }}
                          className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCreatingId(wedding.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        새 링크
                      </button>
                    )}
                  </div>
                </div>

                {weddingLinks.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Link2 className="w-6 h-6 text-stone-200 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">아직 공유한 링크가 없어요</p>
                    <p className="text-xs text-stone-300 mt-1">청첩장에서 공유하기를 누르면 자동 생성됩니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {weddingLinks.map((link, idx) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="px-5 py-3 flex items-center gap-3 hover:bg-stone-50/50 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-stone-500 font-medium">{idx + 1}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          {editingId === link.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                placeholder="링크 이름"
                                maxLength={20}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') updateLabel(link.id);
                                  if (e.key === 'Escape') { setEditingId(null); setEditLabel(''); }
                                }}
                                className="text-sm px-2 py-1 border border-stone-200 rounded-lg outline-none focus:border-stone-400 w-32"
                              />
                              <button onClick={() => updateLabel(link.id)} className="p-1 text-green-600 hover:text-green-700">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { setEditingId(null); setEditLabel(''); }} className="p-1 text-stone-400 hover:text-stone-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-stone-800 font-medium truncate">
                                {link.label || `링크 ${idx + 1}`}
                              </p>
                              <button
                                onClick={() => { setEditingId(link.id); setEditLabel(link.label || ''); }}
                                className="p-0.5 text-stone-300 hover:text-stone-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-stone-400">{formatDate(link.createdAt)}</span>
                            <span className="flex items-center gap-1 text-xs text-stone-400">
                              <Eye className="w-3 h-3" />
                              {link.viewCount}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => copyLink(link.wedding.slug, link.version, link.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              copiedId === link.id
                                ? 'bg-green-50 text-green-600'
                                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                            }`}
                            title="링크 복사"
                          >
                            {copiedId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openLink(link.wedding.slug, link.version)}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                            title="링크 열기"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(link.id)}
                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-stone-800 font-medium mb-2">이 공유 링크를 삭제하시겠습니까?</p>
              <p className="text-sm text-stone-500 mb-6">이 링크로 접속한 사람들은 더 이상 청첩장을 볼 수 없게 됩니다.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50"
                >
                  취소
                </button>
                <button
                  onClick={() => deleteLink(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setBulkDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-stone-800 font-medium mb-2">모든 공유 링크를 삭제하시겠습니까?</p>
              <p className="text-sm text-stone-500 mb-2">
                {weddings.find(w => w.id === bulkDeleteConfirm)?.groomName} & {weddings.find(w => w.id === bulkDeleteConfirm)?.brideName}의
                공유 링크 {links[bulkDeleteConfirm]?.length || 0}개가 모두 삭제됩니다.
              </p>
              <p className="text-xs text-red-400 mb-6">이 링크로 접속한 모든 사람이 청첩장을 볼 수 없게 됩니다.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:bg-stone-50"
                >
                  취소
                </button>
                <button
                  onClick={() => bulkDelete(bulkDeleteConfirm)}
                  disabled={bulkDeleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bulkDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  전체 삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
