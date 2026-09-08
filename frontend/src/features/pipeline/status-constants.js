export const STATUS_STEPS = [
  {
    step: 1,
    id: "Just Got",
    label: "Just Got",
    detail: "Newly captured lead, waiting for initial contact.",
    colorId: "zinc",
    headerClass: "bg-zinc-800 text-white border-b border-zinc-700 shadow-xs",
    badgeClass: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    pillClass: "bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600",
    activePillClass: "bg-zinc-800 text-white font-bold ring-2 ring-zinc-400 shadow-md",
    dotClass: "bg-zinc-400",
    activeStepColor: "bg-zinc-700 text-white border-zinc-500 font-bold shadow-xs",
    borderClass: "border-zinc-500/40",
    accentClass: "text-zinc-400"
  },
  {
    step: 2,
    id: "Enquiry Sent",
    label: "Enquiry Sent",
    detail: "Cold email, introduction pitch, or direct inquiry dispatched.",
    colorId: "purple",
    headerClass: "bg-purple-600 text-white border-b border-purple-500 shadow-xs",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    pillClass: "bg-purple-600 text-white border-purple-500 hover:bg-purple-500",
    activePillClass: "bg-purple-700 text-white font-bold ring-2 ring-purple-300 shadow-md",
    dotClass: "bg-purple-400",
    activeStepColor: "bg-purple-600 text-white border-purple-400 font-bold shadow-xs",
    borderClass: "border-purple-500/40",
    accentClass: "text-purple-400"
  },
  {
    step: 3,
    id: "Follow Up",
    label: "Follow Up",
    detail: "Follow-up email or call scheduled to re-engage lead.",
    colorId: "blue",
    headerClass: "bg-blue-600 text-white border-b border-blue-500 shadow-xs",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    pillClass: "bg-blue-600 text-white border-blue-500 hover:bg-blue-500",
    activePillClass: "bg-blue-700 text-white font-bold ring-2 ring-blue-300 shadow-md",
    dotClass: "bg-blue-400",
    activeStepColor: "bg-blue-600 text-white border-blue-400 font-bold shadow-xs",
    borderClass: "border-blue-500/40",
    accentClass: "text-blue-400"
  },
  {
    step: 4,
    id: "Busy / On Hold",
    label: "Busy / On Hold",
    detail: "Lead requested to talk next month or is currently unavailable.",
    colorId: "amber",
    headerClass: "bg-amber-600 text-white border-b border-amber-500 shadow-xs",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    pillClass: "bg-amber-600 text-white border-amber-500 hover:bg-amber-500",
    activePillClass: "bg-amber-700 text-white font-bold ring-2 ring-amber-300 shadow-md",
    dotClass: "bg-amber-400",
    activeStepColor: "bg-amber-600 text-white border-amber-400 font-bold shadow-xs",
    borderClass: "border-amber-500/40",
    accentClass: "text-amber-400"
  },
  {
    step: 5,
    id: "In Discussion",
    label: "In Discussion",
    detail: "Demo conducted, discovery meeting in progress, or proposal sent.",
    colorId: "indigo",
    headerClass: "bg-indigo-600 text-white border-b border-indigo-500 shadow-xs",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    pillClass: "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500",
    activePillClass: "bg-indigo-700 text-white font-bold ring-2 ring-indigo-300 shadow-md",
    dotClass: "bg-indigo-400",
    activeStepColor: "bg-indigo-600 text-white border-indigo-400 font-bold shadow-xs",
    borderClass: "border-indigo-500/40",
    accentClass: "text-indigo-400"
  },
  {
    step: 6,
    id: "Approved",
    label: "Approved",
    detail: "Prospect converted into client, proposal accepted, or deal won.",
    colorId: "emerald",
    headerClass: "bg-emerald-600 text-white border-b border-emerald-500 shadow-xs",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pillClass: "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500",
    activePillClass: "bg-emerald-700 text-white font-bold ring-2 ring-emerald-300 shadow-md",
    dotClass: "bg-emerald-400",
    activeStepColor: "bg-emerald-600 text-white border-emerald-400 font-bold shadow-xs",
    borderClass: "border-emerald-500/40",
    accentClass: "text-emerald-400"
  },
  {
    step: 7,
    id: "Rejected",
    label: "Rejected",
    detail: "Not a fit, invalid contact info, or declined service.",
    colorId: "rose",
    headerClass: "bg-rose-600 text-white border-b border-rose-500 shadow-xs",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    pillClass: "bg-rose-600 text-white border-rose-500 hover:bg-rose-500",
    activePillClass: "bg-rose-700 text-white font-bold ring-2 ring-rose-300 shadow-md",
    dotClass: "bg-rose-400",
    activeStepColor: "bg-rose-600 text-white border-rose-400 font-bold shadow-xs",
    borderClass: "border-rose-500/40",
    accentClass: "text-rose-400"
  }
];

export const STATUS_COLOR_PRESETS = [
  {
    id: "cyan",
    name: "Cyan",
    bg: "bg-cyan-500",
    headerClass: "bg-cyan-600 text-white border-b border-cyan-500 shadow-xs",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    pillClass: "bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-500",
    activePillClass: "bg-cyan-700 text-white font-bold ring-2 ring-cyan-300 shadow-md",
    dotClass: "bg-cyan-400",
    borderClass: "border-cyan-500/40",
    accentClass: "text-cyan-400"
  },
  {
    id: "emerald",
    name: "Emerald",
    bg: "bg-emerald-500",
    headerClass: "bg-emerald-600 text-white border-b border-emerald-500 shadow-xs",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pillClass: "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500",
    activePillClass: "bg-emerald-700 text-white font-bold ring-2 ring-emerald-300 shadow-md",
    dotClass: "bg-emerald-400",
    borderClass: "border-emerald-500/40",
    accentClass: "text-emerald-400"
  },
  {
    id: "blue",
    name: "Blue",
    bg: "bg-blue-500",
    headerClass: "bg-blue-600 text-white border-b border-blue-500 shadow-xs",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    pillClass: "bg-blue-600 text-white border-blue-500 hover:bg-blue-500",
    activePillClass: "bg-blue-700 text-white font-bold ring-2 ring-blue-300 shadow-md",
    dotClass: "bg-blue-400",
    borderClass: "border-blue-500/40",
    accentClass: "text-blue-400"
  },
  {
    id: "purple",
    name: "Purple",
    bg: "bg-purple-500",
    headerClass: "bg-purple-600 text-white border-b border-purple-500 shadow-xs",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    pillClass: "bg-purple-600 text-white border-purple-500 hover:bg-purple-500",
    activePillClass: "bg-purple-700 text-white font-bold ring-2 ring-purple-300 shadow-md",
    dotClass: "bg-purple-400",
    borderClass: "border-purple-500/40",
    accentClass: "text-purple-400"
  },
  {
    id: "amber",
    name: "Amber",
    bg: "bg-amber-500",
    headerClass: "bg-amber-600 text-white border-b border-amber-500 shadow-xs",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    pillClass: "bg-amber-600 text-white border-amber-500 hover:bg-amber-500",
    activePillClass: "bg-amber-700 text-white font-bold ring-2 ring-amber-300 shadow-md",
    dotClass: "bg-amber-400",
    borderClass: "border-amber-500/40",
    accentClass: "text-amber-400"
  },
  {
    id: "rose",
    name: "Rose",
    bg: "bg-rose-500",
    headerClass: "bg-rose-600 text-white border-b border-rose-500 shadow-xs",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    pillClass: "bg-rose-600 text-white border-rose-500 hover:bg-rose-500",
    activePillClass: "bg-rose-700 text-white font-bold ring-2 ring-rose-300 shadow-md",
    dotClass: "bg-rose-400",
    borderClass: "border-rose-500/40",
    accentClass: "text-rose-400"
  },
  {
    id: "indigo",
    name: "Indigo",
    bg: "bg-indigo-500",
    headerClass: "bg-indigo-600 text-white border-b border-indigo-500 shadow-xs",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    pillClass: "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500",
    activePillClass: "bg-indigo-700 text-white font-bold ring-2 ring-indigo-300 shadow-md",
    dotClass: "bg-indigo-400",
    borderClass: "border-indigo-500/40",
    accentClass: "text-indigo-400"
  },
  {
    id: "orange",
    name: "Orange",
    bg: "bg-orange-500",
    headerClass: "bg-orange-600 text-white border-b border-orange-500 shadow-xs",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    pillClass: "bg-orange-600 text-white border-orange-500 hover:bg-orange-500",
    activePillClass: "bg-orange-700 text-white font-bold ring-2 ring-orange-300 shadow-md",
    dotClass: "bg-orange-400",
    borderClass: "border-orange-500/40",
    accentClass: "text-orange-400"
  },
  {
    id: "teal",
    name: "Teal",
    bg: "bg-teal-500",
    headerClass: "bg-teal-600 text-white border-b border-teal-500 shadow-xs",
    badgeClass: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    pillClass: "bg-teal-600 text-white border-teal-500 hover:bg-teal-500",
    activePillClass: "bg-teal-700 text-white font-bold ring-2 ring-teal-300 shadow-md",
    dotClass: "bg-teal-400",
    borderClass: "border-teal-500/40",
    accentClass: "text-teal-400"
  },
  {
    id: "zinc",
    name: "Zinc",
    bg: "bg-zinc-500",
    headerClass: "bg-zinc-800 text-white border-b border-zinc-700 shadow-xs",
    badgeClass: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    pillClass: "bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600",
    activePillClass: "bg-zinc-800 text-white font-bold ring-2 ring-zinc-400 shadow-md",
    dotClass: "bg-zinc-300",
    borderClass: "border-zinc-500/40",
    accentClass: "text-zinc-400"
  }
];

export const dynamicCustomStatuses = new Map();

export function registerCustomStatus(statusObj) {
  if (!statusObj || !statusObj.id) return;
  dynamicCustomStatuses.set(statusObj.id.toLowerCase(), statusObj);
}

export function unregisterCustomStatus(statusId) {
  if (!statusId) return;
  dynamicCustomStatuses.delete(statusId.toLowerCase());
}

export function getColorPreset(presetId) {
  return STATUS_COLOR_PRESETS.find((p) => p.id === presetId) || STATUS_COLOR_PRESETS[0];
}

export function getStatusStep(status) {
  if (!status) return STATUS_STEPS[0];
  const s = String(status).trim().toLowerCase();

  const builtIn =
    STATUS_STEPS.find((item) => item.id.toLowerCase() === s) ||
    STATUS_STEPS.find((item) => item.label.toLowerCase() === s);
  if (builtIn) return builtIn;

  if (dynamicCustomStatuses.has(s)) {
    return dynamicCustomStatuses.get(s);
  }

  // Generate consistent dynamic styling for any unknown custom status
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const colorPreset = STATUS_COLOR_PRESETS[Math.abs(hash) % STATUS_COLOR_PRESETS.length];

  return {
    step: "•",
    id: status,
    label: status,
    detail: "Custom workflow stage.",
    headerClass: colorPreset.headerClass,
    badgeClass: colorPreset.badgeClass,
    pillClass: colorPreset.pillClass,
    activePillClass: colorPreset.activePillClass,
    dotClass: colorPreset.dotClass,
    borderClass: colorPreset.borderClass,
    accentClass: colorPreset.accentClass,
    isCustom: true
  };
}

