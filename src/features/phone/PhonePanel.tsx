import { motion } from 'framer-motion';
import { Banknote, BriefcaseBusiness, HeartPulse, Home, MessageSquareText, Smartphone, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ACTIONS, JOBS } from '@/data/world';
import { currency } from '@/lib/utils';
import type { SaveState } from '@/types/game';

type PhonePanelProps = {
  save: SaveState;
  onAction: (actionId: string) => void;
  onApplyForJob: (jobId: string) => void;
  onOpenMap: () => void;
};

const TABS = [
  { id: 'messages', label: 'Messages', icon: MessageSquareText },
  { id: 'bank', label: 'Bank', icon: Banknote },
  { id: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'social', label: 'Social', icon: Users },
] as const;

export function PhonePanel({ save, onAction, onApplyForJob, onOpenMap }: PhonePanelProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('messages');

  const eligibleJobs = useMemo(
    () =>
      JOBS.filter(
        (job) =>
          save.summary.age >= job.minAge &&
          save.education.credits >= job.minEducation &&
          save.stats.intelligence >= job.minIntelligence &&
          save.stats.discipline >= job.minDiscipline,
      ).slice(0, 6),
    [save],
  );

  const financeActions = ACTIONS.filter((action) => ['file_taxes', 'invest_capital', 'loan_consult'].includes(action.id));
  const healthActions = ACTIONS.filter((action) => ['therapy_session', 'recovery_plan', 'med_check', 'wellness_scan'].includes(action.id));

  return (
    <div className="panel-shell relative mx-auto h-[680px] w-full max-w-[420px] overflow-hidden rounded-[38px] border-[rgba(255,255,255,0.16)] p-3">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,17,17,0.96),rgba(12,11,12,0.94))]" />
      <div className="relative h-full rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(214,168,95,0.14),transparent_36%),linear-gradient(180deg,rgba(22,19,19,0.96),rgba(10,10,11,0.94))]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#e7d5bb]/55">Life OS</div>
            <div className="mt-1 font-display text-2xl text-[#fff2de]">QPhone</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(214,168,95,0.14)] text-[#f4d48c]">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-b border-white/10 px-3 py-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`rounded-2xl border px-3 py-3 text-center text-[11px] tracking-[0.2em] ${
                tab === id ? 'border-[#d6a85f]/45 bg-[rgba(214,168,95,0.12)] text-[#fff2dd]' : 'border-white/10 bg-white/5 text-[#e0ceb2]/60'
              }`}
              onClick={() => setTab(id)}
              type="button"
            >
              <Icon className="mx-auto mb-2 h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          className="h-[540px] overflow-hidden px-4 py-4"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'messages' ? (
            <div className="space-y-3">
              {save.phone.messages.map((thread) => (
                <div key={thread.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#fff1de]">{thread.contactName}</span>
                    <span className="text-[#f1d18c]">{thread.unread}</span>
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#d7c3a5]/55">{thread.role}</div>
                  <div className="mt-3 space-y-2 text-sm text-[#e5d4ba]/72">
                    {thread.snippets.map((snippet) => (
                      <p key={snippet}>{snippet}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'bank' ? (
            <div className="space-y-3">
              <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-[#ddcdb2]/55">Balances</div>
                <div className="mt-3 grid gap-2 text-sm text-[#f3e7d4]">
                  <div className="flex justify-between"><span>Cash</span><span>{currency(save.stats.cash)}</span></div>
                  <div className="flex justify-between"><span>Bank</span><span>{currency(save.stats.bank)}</span></div>
                  <div className="flex justify-between"><span>Debt</span><span>{currency(save.stats.debt)}</span></div>
                  <div className="flex justify-between"><span>Net worth</span><span>{currency(save.stats.netWorth)}</span></div>
                </div>
              </div>
              {financeActions.map((action) => (
                <button key={action.id} className="w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left" onClick={() => onAction(action.id)} type="button">
                  <div className="font-semibold text-[#fff2de]">{action.title}</div>
                  <div className="mt-1 text-sm text-[#e1d0b2]/70">{action.description}</div>
                </button>
              ))}
            </div>
          ) : null}

          {tab === 'jobs' ? (
            <div className="space-y-3">
              {eligibleJobs.map((job) => (
                <button key={job.id} className="w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left" onClick={() => onApplyForJob(job.id)} type="button">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#fff2de]">{job.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#dbc7a7]/58">{job.track} · {job.fantasyTag}</div>
                    </div>
                    <div className="text-right text-sm text-[#f1d18c]">{currency(job.salary)}</div>
                  </div>
                </button>
              ))}
              {eligibleJobs.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-[#e4d4bb]/72">
                  Build more credits and discipline before the stronger career doors open.
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'health' ? (
            <div className="space-y-3">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-[#f0e4ce]">
                <div className="flex justify-between"><span>Mental</span><span>{save.health.mental}</span></div>
                <div className="mt-2 flex justify-between"><span>Physical</span><span>{save.health.physical}</span></div>
                <div className="mt-2 flex justify-between"><span>Risk</span><span>{save.stats.addictionRisk}</span></div>
              </div>
              {healthActions.map((action) => (
                <button key={action.id} className="w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left" onClick={() => onAction(action.id)} type="button">
                  <div className="font-semibold text-[#fff2de]">{action.title}</div>
                  <div className="mt-1 text-sm text-[#e1d0b2]/70">{action.description}</div>
                </button>
              ))}
            </div>
          ) : null}

          {tab === 'home' ? (
            <div className="space-y-3">
              {save.properties.map((property) => (
                <div key={property.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-[#fff1dd]">{property.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#dac7a8]/55">{property.district}</div>
                  <div className="mt-3 text-sm text-[#e5d4bb]/72">Upkeep {currency(property.upkeep)} · Value {currency(property.value)}</div>
                </div>
              ))}
              {save.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-[#fff1dd]">{vehicle.name}</div>
                  <div className="mt-3 text-sm text-[#e5d4bb]/72">Value {currency(vehicle.value)} · Speed +{vehicle.speedBonus}</div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'social' ? (
            <div className="space-y-3">
              <button className="w-full rounded-[24px] border border-white/10 bg-[rgba(214,168,95,0.12)] px-4 py-4 text-left" onClick={() => onAction('content_run')} type="button">
                <div className="font-semibold text-[#fff2de]">Launch a content run</div>
                <div className="mt-1 text-sm text-[#ead9bc]/72">Post into the feed, chase reach, and let reputation move.</div>
              </button>
              <button className="w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left" onClick={onOpenMap} type="button">
                <div className="font-semibold text-[#fff2de]">Open the live map</div>
                <div className="mt-1 text-sm text-[#e1d0b2]/70">Some opportunities still require you to physically show up.</div>
              </button>
              {save.relationships.slice(0, 4).map((person) => (
                <div key={person.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-[#fff0dd]">{person.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[#dac7a8]/55">{person.role}</div>
                  <div className="mt-3 text-sm text-[#e5d4bb]/72">Closeness {person.closeness} · Chemistry {person.chemistry}</div>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
