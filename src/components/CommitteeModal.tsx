import React from 'react';
import { X, Phone, PhoneCall, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';
import { CommitteeMember } from '../types';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CommitteeMember[];
}

export const CommitteeModal: React.FC<CommitteeModalProps> = ({
  isOpen,
  onClose,
  members
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg">
              🤝
            </div>
            <div>
              <h3 className="text-base font-bold">Road Committee & Offline Contacts</h3>
              <p className="text-xs text-emerald-200 font-urdu">عوامی سڑک رابطہ کمیٹی برائے عطیات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info notice */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <span className="text-base flex-shrink-0">⚠️</span>
          <span>
            <strong>Official Collection Protocol:</strong> Hand over cash directly to authorized elders below or transfer to committee accounts. Always demand a verified digital or printed receipt for complete transparency!
          </span>
        </div>

        {/* Committee list */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {members.map((member, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {member.village}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium">{member.role}</div>
                {member.accountInfo && (
                  <div className="text-xs font-mono font-semibold text-emerald-700 bg-white px-2 py-1 rounded-md border border-slate-200 inline-block">
                    {member.accountInfo}
                  </div>
                )}
              </div>

              <a
                href={`tel:${member.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex-shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 text-center border-t border-slate-200">
          <p className="text-xs text-slate-600">
            For audit queries or to submit road materials (cement/gravel), visit the Committee Camp at Butti Chowk.
          </p>
        </div>
      </div>
    </div>
  );
};
