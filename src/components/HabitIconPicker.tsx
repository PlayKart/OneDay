import { useState, useEffect } from "react";
import { 
  HABIT_ICONS, 
  HABIT_COLORS, 
  HABIT_CATEGORIES,
  SPORTS_OPTIONS,
  STUDIES_OPTIONS,
  HabitCategoryType,
  getHabitIconComponent
} from "../lib/habitIcons";
import { Check } from "lucide-react";

interface HabitIconPickerProps {
  selectedIcon: string;
  selectedColor: string;
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSelectIcon: (iconId: string) => void;
  onSelectColor: (colorId: string) => void;
  onSelectCategory?: (category: string) => void;
  onSelectSubcategory?: (subcategory: string) => void;
}

export function HabitIconPicker({
  selectedIcon,
  selectedColor,
  selectedCategory,
  selectedSubcategory,
  onSelectIcon,
  onSelectColor,
  onSelectCategory,
  onSelectSubcategory,
}: HabitIconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<HabitCategoryType>(
    (selectedCategory as HabitCategoryType) || "Health & Fitness"
  );

  useEffect(() => {
    if (selectedCategory && selectedCategory !== activeCategory) {
      setActiveCategory(selectedCategory as HabitCategoryType);
    }
  }, [selectedCategory]);

  const currentColorObj = HABIT_COLORS.find((c) => c.id === selectedColor) || HABIT_COLORS[0];
  const ActiveIconComp = getHabitIconComponent(selectedIcon, "", selectedSubcategory || "");

  const handleCategoryClick = (cat: HabitCategoryType) => {
    setActiveCategory(cat);
    onSelectCategory?.(cat);
    
    // Auto-select first icon/subcategory in new category
    const items = cat === "Sports" ? SPORTS_OPTIONS : cat === "Studies" ? STUDIES_OPTIONS : HABIT_ICONS.filter((item) => item.category === cat);
    if (items.length > 0) {
      const firstItem = items[0];
      onSelectIcon(firstItem.id);
      onSelectSubcategory?.(firstItem.subcategory || firstItem.label);
    }
  };

  const handleIconClick = (item: any) => {
    onSelectIcon(item.id);
    onSelectSubcategory?.(item.subcategory || item.label);
  };

  const currentItems = (() => {
    if (activeCategory === "Sports") return SPORTS_OPTIONS;
    if (activeCategory === "Studies") return STUDIES_OPTIONS;
    return HABIT_ICONS.filter((item) => item.category === activeCategory);
  })();

  return (
    <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
      {/* Header & Live Preview */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Icon & Category
          </label>
          <p className="text-[11px] text-slate-500">
            Select habit type & visual badge
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl ${currentColorObj.bg} border ${currentColorObj.border} flex items-center justify-center ${currentColorObj.text} shadow-lg ${currentColorObj.glow} transition-all duration-300`}
          >
            <ActiveIconComp size={22} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
          Accent Color
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {HABIT_COLORS.map((c) => {
            const isSelected = selectedColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.bg} border ${c.border} flex items-center justify-center transition-all ${
                  isSelected ? `ring-2 ${c.ring} scale-110 shadow-md` : "hover:scale-105 opacity-70 hover:opacity-100"
                }`}
                title={c.name}
              >
                {isSelected && <Check size={14} className={c.text} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
          Category
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {HABIT_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-white text-black border-white shadow-sm"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon Grid */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
          Icon (determines habit type)
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
          {currentItems.map((item) => {
            const IconComp = item.icon;
            const isSelected = selectedIcon === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleIconClick(item)}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all duration-200 group ${
                  isSelected
                    ? `${currentColorObj.bg} ${currentColorObj.border} ${currentColorObj.text} ring-2 ${currentColorObj.ring} scale-105 shadow-md`
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                }`}
                title={item.label}
              >
                <IconComp size={20} strokeWidth={isSelected ? 2.2 : 1.8} />
                <span className="text-[9px] font-bold truncate max-w-full leading-tight opacity-90 group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
