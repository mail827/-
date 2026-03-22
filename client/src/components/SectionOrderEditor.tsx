import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { at } from '../utils/appI18n';
import { useLocaleStore } from '../store/useLocaleStore';

const getSectionMeta = (locale: 'ko' | 'en'): Record<string, { label: string; desc: string }> => ({
  greeting: { label: at('soGreeting', locale), desc: at('soGreetingDesc', locale) },
  calendar: { label: at('soCalendar', locale), desc: at('soCalendarDesc', locale) },
  loveStory: { label: at('soLoveStory', locale), desc: at('soLoveStoryDesc', locale) },
  gallery: { label: at('soGallery', locale), desc: at('soGalleryDesc', locale) },
  location: { label: at('soLocation', locale), desc: at('soLocationDesc', locale) },
  rsvp: { label: at('soRsvp', locale), desc: at('soRsvpDesc', locale) },
  account: { label: at('soAccount', locale), desc: at('soAccountDesc', locale) },
  guestbook: { label: at('soGuestbook', locale), desc: at('soGuestbookDesc', locale) },
  closing: { label: at('soClosing', locale), desc: at('soClosingDesc', locale) },
});

const DEFAULT_ORDER = ['greeting', 'calendar', 'loveStory', 'gallery', 'location', 'rsvp', 'account', 'guestbook', 'closing'];

interface Props {
  value: string[] | null | undefined;
  onChange: (order: string[]) => void;
  hiddenSections?: string[];
  onHiddenChange?: (hidden: string[]) => void;
}

function SortableItem({ id, isHidden, onToggle, meta }: { id: string; isHidden: boolean; onToggle: () => void; meta: Record<string, { label: string; desc: string }> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const m = meta[id];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isHidden ? 0.45 : 1 }}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
        isDragging
          ? 'bg-stone-100 border-stone-400 shadow-lg z-10 scale-[1.02]'
          : 'bg-white border-stone-200 hover:border-stone-300'
      }`}
    >
      <button {...attributes} {...listeners} className="touch-none p-1 text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isHidden ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{m?.label || id}</p>
        <p className="text-xs text-stone-400 truncate">{m?.desc || ''}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`p-1.5 rounded-lg transition-colors ${isHidden ? 'text-stone-300 hover:text-stone-500 hover:bg-stone-100' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'}`}
      >
        {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SectionOrderEditor({ value, onChange, hiddenSections = [], onHiddenChange }: Props) {
  const { locale } = useLocaleStore();
  const sectionMeta = getSectionMeta(locale);
  const [items, setItems] = useState<string[]>(
    Array.isArray(value) && value.length > 0 ? value : [...DEFAULT_ORDER]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onChange(next);
  };

  const handleReset = () => {
    setItems([...DEFAULT_ORDER]);
    onChange([...DEFAULT_ORDER]);
    onHiddenChange?.([]);
  };

  const toggleSection = (id: string) => {
    if (!onHiddenChange) return;
    const next = hiddenSections.includes(id)
      ? hiddenSections.filter(s => s !== id)
      : [...hiddenSections, id];
    onHiddenChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">{at('soDragReorder', locale)}</p>
          <p className="text-xs text-stone-400 mt-0.5">{at('soEyeToggle', locale)}</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {at('soReset', locale)}
        </button>
      </div>

      <div className="bg-stone-50 rounded-xl px-3 py-2 text-center">
        <span className="text-xs text-stone-400 tracking-wide">{at('soHeroFixed', locale)}</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((id) => (
              <SortableItem
                key={id}
                id={id}
                isHidden={hiddenSections.includes(id)}
                onToggle={() => toggleSection(id)}
                meta={sectionMeta}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="bg-stone-50 rounded-xl px-3 py-2 text-center">
        <span className="text-xs text-stone-400 tracking-wide">{at('soFooterFixed', locale)}</span>
      </div>
    </div>
  );
}