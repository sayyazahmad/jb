import React from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';
import { RoadMilestone, ProjectSettings } from '../types';
import { formatPKR } from '../utils/formatters';

interface AboutProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  milestones: RoadMilestone[];
}

export const AboutProjectModal: React.FC<AboutProjectModalProps> = ({
  isOpen,
  onClose,
  settings,
  milestones
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl font-black shadow-md">
              🛣️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">About AWAMI ROAD Campaign</h3>
              <p className="text-xs text-amber-300 font-urdu">عوامی سڑک: جیوا موڑ تا بٹی - تفصیلات و اغراض و مقاصد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto text-slate-700 text-xs sm:text-sm">
          {/* Why this road */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>The Village Dream: Safe Travel in Rain & Sun</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              For decades, the dirt track between <strong>Jeeva Morh and Butti</strong> was impassable during monsoon rains and severe dust storms. School children had to walk through knee-deep mud, and medical emergencies took hours to reach the main highway.
            </p>
            <p className="text-slate-600 leading-relaxed">
              In 2026, the village elders, youth, and overseas Pakistani diaspora from Khushi Kot, Surjal, Palak, Kotli, Danna Misrial, and surrounding areas united to construct a permanent <strong>4.5 KM all-weather paved road (عوامی سڑک)</strong> purely on community self-help (اپنے مدد آپ).
            </p>
          </div>

          {/* Road Key Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Length</span>
              <strong className="text-sm sm:text-base font-extrabold text-emerald-950">4.5 KM</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Width</span>
              <strong className="text-sm sm:text-base font-extrabold text-emerald-950">24 Feet</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">RCC Culverts</span>
              <strong className="text-sm sm:text-base font-extrabold text-emerald-950">3 Units</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Funding</span>
              <strong className="text-sm sm:text-base font-extrabold text-emerald-950">100% Offline</strong>
            </div>
          </div>

          {/* Construction Milestones */}
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Technical Construction Phases (مراحل وار پیشرفت)
            </h4>
            
            <div className="space-y-2.5">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {m.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : m.status === 'in_progress' ? (
                        <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0"></span>
                      )}
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        {m.title}
                      </strong>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      m.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {m.status === 'completed' ? 'Completed' : m.status === 'in_progress' ? 'In Progress' : 'Planned'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 pl-6">
                    {m.description}
                  </p>
                  {m.costEstimate && (
                    <div className="text-[10px] font-medium text-emerald-700 pl-6">
                      Estimated Cost: {formatPKR(m.costEstimate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transparency & Sadaqah Jariyah */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <Heart className="w-4 h-4 text-amber-600" />
              <span>Sadaqah Jariyah & Complete Public Transparency</span>
            </h5>
            <p className="text-[11px] leading-relaxed">
              Every single rupee contributed by any donor is entered directly into this transparent public ledger, accessible 24/7 on every villager's mobile phone. Audited weekly by the village committee elders.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
