"use client";

import { useMemo } from "react";
import { Crown, Lock, Star, ChevronRight, Trophy, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const VIP_TIERS = [
  {
    level: 1,
    name: "VIP 1",
    label: "Bronze",
    minDeposit: 25,
    dailyProfit: 0.5,
    unlockBalance: 0,
    gradient: "from-blue-600 to-blue-400",
    shadowColor: "rgba(59,130,246,0.35)",
    badgeBg: "bg-blue-500",
    accent: "text-blue-200",
    darkAccent: "text-blue-300",
    borderAccent: "border-blue-400/30",
    glowColor: "rgba(59,130,246,0.4)",
  },
  {
    level: 2,
    name: "VIP 2",
    label: "Silver",
    minDeposit: 1500,
    dailyProfit: 2,
    unlockBalance: 1500,
    gradient: "from-purple-600 to-purple-400",
    shadowColor: "rgba(147,51,234,0.35)",
    badgeBg: "bg-purple-500",
    accent: "text-purple-200",
    darkAccent: "text-purple-300",
    borderAccent: "border-purple-400/30",
    glowColor: "rgba(147,51,234,0.4)",
  },
  {
    level: 3,
    name: "VIP 3",
    label: "Gold",
    minDeposit: 5000,
    dailyProfit: 6,
    unlockBalance: 5000,
    gradient: "from-amber-600 to-orange-400",
    shadowColor: "rgba(245,158,11,0.35)",
    badgeBg: "bg-amber-500",
    accent: "text-amber-200",
    darkAccent: "text-amber-300",
    borderAccent: "border-amber-400/30",
    glowColor: "rgba(245,158,11,0.4)",
  },
  {
    level: 4,
    name: "VIP 4",
    label: "Diamond",
    minDeposit: 10000,
    dailyProfit: 12,
    unlockBalance: 10000,
    gradient: "from-red-600 to-rose-500",
    shadowColor: "rgba(239,68,68,0.35)",
    badgeBg: "bg-red-500",
    accent: "text-red-200",
    darkAccent: "text-red-300",
    borderAccent: "border-red-400/30",
    glowColor: "rgba(239,68,68,0.4)",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function VipMembership({ balance = 0 }) {
  const currentLevel = useMemo(() => {
    if (balance >= 10000) return 4;
    if (balance >= 5000) return 3;
    if (balance >= 1500) return 2;
    return 1;
  }, [balance]);

  const nextTier = useMemo(() => {
    const next = VIP_TIERS.find(t => t.level === currentLevel + 1);
    return next || null;
  }, [currentLevel]);

  const progressPercent = useMemo(() => {
    if (!nextTier) return 100;
    const currentTier = VIP_TIERS[currentLevel - 1];
    const range = nextTier.unlockBalance - currentTier.unlockBalance;
    const progress = balance - currentTier.unlockBalance;
    return Math.min(Math.max(Math.round((progress / range) * 100), 0), 100);
  }, [balance, currentLevel, nextTier]);

  const currentTierData = VIP_TIERS[currentLevel - 1];

  const formatMoney = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return '0.00';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <section className="mb-10">
      {/* VIP Header / Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 mb-6 shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400 animate-glow-pulse" />
                <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">VIP Membership</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                {currentTierData.name}
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${currentTierData.badgeBg} text-white`}>
                  <Trophy className="w-3 h-3" />
                  {currentTierData.label}
                </span>
              </h3>
              <p className="text-slate-400 text-sm mt-1.5 flex items-center gap-1.5">
                {nextTier ? (
                  <>
                    <span>Next unlock:</span>
                    <span className="text-amber-400 font-semibold">{nextTier.name}</span>
                    <span className="text-slate-500">at</span>
                    <span className="text-white font-semibold">${formatMoney(nextTier.unlockBalance)}</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-semibold">Maximum VIP level reached!</span>
                    <span className="text-slate-400">Enjoy {currentTierData.dailyProfit}% daily profit.</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-slate-800/60 rounded-xl px-5 py-3 border border-slate-700/50 shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Balance</p>
                <p className="text-lg font-bold text-white">${formatMoney(balance)}</p>
              </div>
              {nextTier && (
                <>
                  <div className="h-10 w-px bg-slate-700" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Progress</p>
                    <p className="text-lg font-bold text-emerald-400">{progressPercent}%</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {nextTier && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  {currentTierData.name}
                </span>
                <span className="flex items-center gap-1">
                  {nextTier.name}
                  <Crown className="w-3 h-3 text-amber-400" />
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700/80 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 relative"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                <span>${formatMoney(currentTierData.unlockBalance)}</span>
                <span>${formatMoney(nextTier.unlockBalance)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIP Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {VIP_TIERS.map((tier) => {
          const isUnlocked = tier.unlockBalance <= balance;
          const isCurrentLevel = tier.level === currentLevel;

          return (
            <motion.div
              key={tier.level}
              variants={cardVariants}
              className={`relative rounded-2xl transition-all duration-300 ${
                isUnlocked
                  ? 'hover:scale-[1.04] hover:-translate-y-1.5 hover:z-10'
                  : ''
              }`}
              style={isUnlocked ? {
                boxShadow: `0 8px 32px ${tier.shadowColor}`,
              } : {}}
            >
              <div className="relative rounded-2xl overflow-hidden">
                {/* Card Gradient Background */}
                <div className={`bg-gradient-to-br ${tier.gradient} p-5 pb-5 min-h-[300px] flex flex-col justify-between relative`}>
                  {/* Hover Glow Overlay */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${tier.glowColor}, transparent 70%)`,
                    }}
                  />

                  {/* Top Section */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crown className={`w-5 h-5 ${tier.accent}`} />
                        <span className="text-white font-bold text-lg tracking-tight">{tier.name}</span>
                      </div>
                      {isUnlocked && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tier.badgeBg} text-white shadow-lg`}>
                          <ShieldCheck className="w-3 h-3" />
                          {isCurrentLevel ? 'Active' : 'Unlocked'}
                        </span>
                      )}
                    </div>

                    {/* Label + Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <p className={`text-sm font-semibold ${tier.accent}`}>{tier.label} Tier</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < tier.level ? 'text-white fill-white' : tier.accent}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* VIP Level Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm ${tier.borderAccent} border`}>
                      <Trophy className={`w-3.5 h-3.5 ${tier.accent}`} />
                      <span className="text-white/90 text-xs font-semibold">Level {tier.level}</span>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div />

                  {/* Bottom Stats + CTA */}
                  <div className="relative z-10 space-y-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${tier.accent}`}>Min. Deposit</span>
                        <span className="text-white font-bold text-sm">${formatMoney(tier.minDeposit)}</span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${tier.accent}`}>Daily Profit</span>
                        <span className="text-white font-bold text-sm">{tier.dailyProfit}%</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      disabled={!isUnlocked}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        isUnlocked
                          ? 'bg-white/20 hover:bg-white/30 text-white shadow-lg backdrop-blur-sm border border-white/20 hover:shadow-xl active:scale-[0.98]'
                          : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/50'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          {isCurrentLevel ? 'Activated' : 'Join Now'}
                          <ChevronRight className={`w-4 h-4 ${isCurrentLevel ? '' : 'group-hover:translate-x-0.5 transition-transform'}`} />
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Locked
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Locked Overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-20">
                    <div className="bg-white/10 rounded-full p-3 mb-2.5 border border-white/10">
                      <Lock className="w-6 h-6 text-white/70" />
                    </div>
                    <p className="text-white/90 text-sm font-bold">Locked</p>
                    <p className="text-white/50 text-[11px] mt-1 text-center px-4 leading-relaxed">
                      Unlock at<br />
                      <span className="text-amber-300 font-semibold">${formatMoney(tier.unlockBalance)} Balance</span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
