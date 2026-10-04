import React from 'react';
import { Camera, CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react';

export const RoadGallery: React.FC = () => {
  const updates = [
    {
      id: 'g1',
      title: 'Tractor-Trolley Soil Leveling & Heavy Roller Compaction',
      titleUrdu: 'مٹی بھرائی اور روڈ رولر کٹائی',
      location: 'Section KM 0.0 to KM 1.5 (Jeeva Morh side)',
      date: '28 Sep 2026',
      tag: 'Completed',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: '🚜',
      desc: 'Over 120 trolley loads of dry earth placed to raise road bed above monsoon flood level. Leveling performed with village tractors.'
    },
    {
      id: 'g2',
      title: 'RCC Drainage Pipe Culvert Installation',
      titleUrdu: 'نکاسی آب پلیاں اور پائپ تنصیب',
      location: 'Near Dhok Shahan seasonal water stream',
      date: '02 Oct 2026',
      tag: 'Active Work',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: '🏗️',
      desc: 'Reinforced 36-inch concrete drainage pipes installed to let heavy rainwater flow freely without cutting through the road foundation.'
    },
    {
      id: 'g3',
      title: 'Stone Soling & River Gravel Laying (روڑی کٹائی)',
      titleUrdu: 'پتھر سولنگ اور پتھر کٹائی',
      location: 'KM 1.8 to KM 3.0 (Approaching Butti)',
      date: '04 Oct 2026',
      tag: 'In Progress',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: '🪨',
      desc: 'Base stone soling underway. Hand-placed by village volunteers and masons to provide solid rock bed before final asphalt macadam.'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>On-Ground Road Construction Updates</span>
          </h3>
          <p className="text-xs text-slate-500 font-urdu">
            تعمیراتی کام کی تصویری اور زمینی تفصیلات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {updates.map(u => (
          <div
            key={u.id}
            className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  {u.icon}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.badgeColor}`}>
                  {u.tag}
                </span>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {u.title}
                </h4>
                <div className="text-[11px] text-emerald-800 font-urdu mt-0.5">
                  {u.titleUrdu}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {u.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span className="truncate max-w-[130px]">{u.location}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{u.date}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
