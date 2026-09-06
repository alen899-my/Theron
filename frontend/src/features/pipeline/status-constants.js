export const STATUS_STEPS = [
  {
    step: 1,
    id: "Just Got",
    label: "Just Got",
    detail: "Lead automatically captured from Google Maps into workspace archive.",
    pillClass: "bg-slate-700 text-white border-slate-600 hover:bg-slate-600",
    activePillClass: "bg-slate-800 text-white font-bold ring-2 ring-slate-400 shadow-md",
    dotClass: "bg-slate-300",
    activeStepColor: "bg-slate-700 text-white border-slate-500 font-bold shadow-xs"
  },
  {
    step: 2,
    id: "Enquiry Sent",
    label: "Enquiry Sent",
    detail: "Cold email, introduction pitch, or direct inquiry dispatched.",
    pillClass: "bg-purple-600 text-white border-purple-500 hover:bg-purple-500",
    activePillClass: "bg-purple-700 text-white font-bold ring-2 ring-purple-300 shadow-md",
    dotClass: "bg-purple-300",
    activeStepColor: "bg-purple-600 text-white border-purple-400 font-bold shadow-xs"
  },
  {
    step: 3,
    id: "Follow Up",
    label: "Follow Up",
    detail: "Follow-up email or call scheduled to re-engage lead.",
    pillClass: "bg-blue-600 text-white border-blue-500 hover:bg-blue-500",
    activePillClass: "bg-blue-700 text-white font-bold ring-2 ring-blue-300 shadow-md",
    dotClass: "bg-blue-300",
    activeStepColor: "bg-blue-600 text-white border-blue-400 font-bold shadow-xs"
  },
  {
    step: 4,
    id: "Busy / On Hold",
    label: "Busy / On Hold",
    detail: "Lead requested to talk next month or is currently unavailable.",
    pillClass: "bg-amber-600 text-white border-amber-500 hover:bg-amber-500",
    activePillClass: "bg-amber-700 text-white font-bold ring-2 ring-amber-300 shadow-md",
    dotClass: "bg-amber-300",
    activeStepColor: "bg-amber-600 text-white border-amber-400 font-bold shadow-xs"
  },
  {
    step: 5,
    id: "In Discussion",
    label: "In Discussion",
    detail: "Demo conducted, discovery meeting in progress, or proposal sent.",
    pillClass: "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500",
    activePillClass: "bg-indigo-700 text-white font-bold ring-2 ring-indigo-300 shadow-md",
    dotClass: "bg-indigo-300",
    activeStepColor: "bg-indigo-600 text-white border-indigo-400 font-bold shadow-xs"
  },
  {
    step: 6,
    id: "Approved",
    label: "Approved",
    detail: "Prospect converted into client, proposal accepted, or deal won.",
    pillClass: "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500",
    activePillClass: "bg-emerald-700 text-white font-bold ring-2 ring-emerald-300 shadow-md",
    dotClass: "bg-emerald-300",
    activeStepColor: "bg-emerald-600 text-white border-emerald-400 font-bold shadow-xs"
  },
  {
    step: 7,
    id: "Rejected",
    label: "Rejected",
    detail: "Not a fit, invalid contact info, or declined service.",
    pillClass: "bg-rose-600 text-white border-rose-500 hover:bg-rose-500",
    activePillClass: "bg-rose-700 text-white font-bold ring-2 ring-rose-300 shadow-md",
    dotClass: "bg-rose-300",
    activeStepColor: "bg-rose-600 text-white border-rose-400 font-bold shadow-xs"
  }
];

export function getStatusStep(status) {
  if (!status) return STATUS_STEPS[0];
  const s = String(status).trim().toLowerCase();
  return (
    STATUS_STEPS.find((item) => item.id.toLowerCase() === s) ||
    STATUS_STEPS.find((item) => item.label.toLowerCase() === s) ||
    STATUS_STEPS[0]
  );
}
