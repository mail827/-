import { useState } from 'react';
import { motion } from 'framer-motion';
import TabOverview from './team/TabOverview';
import TabWeekly from './team/TabWeekly';
import TabMonthly from './team/TabMonthly';
import TabRoles from './team/TabRoles';
import TabExpenses from './team/TabExpenses';

const TABS = [
  { id: 'overview', label: '대시보드' },
  { id: 'weekly', label: '주간 업무' },
  { id: 'monthly', label: '월간 리뷰' },
  { id: 'roles', label: '분담표' },
  { id: 'expenses', label: '사업비' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TeamWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.15em] text-stone-400 mb-1">TEAM DASHBOARD</p>
        <h1 className="text-xl font-bold text-stone-800">팀 대시보드</h1>
        <p className="text-[12px] text-stone-400 mt-1">우리가 만드는 건 청첩장이 아니라, 두 사람의 시작을 담는 공간이다.</p>
      </div>

      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-[13px] rounded-lg transition-all ${
              activeTab === tab.id ? 'text-stone-800 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="team-tab-bg" className="absolute inset-0 bg-white rounded-lg shadow-sm" transition={{ type: 'spring', duration: 0.35 }} />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'overview' && <TabOverview />}
        {activeTab === 'weekly' && <TabWeekly />}
        {activeTab === 'monthly' && <TabMonthly />}
        {activeTab === 'roles' && <TabRoles />}
        {activeTab === 'expenses' && <TabExpenses />}
      </motion.div>
    </div>
  );
}
