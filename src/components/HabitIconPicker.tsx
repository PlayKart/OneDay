import { useState, useEffect } from "react";
import { 
  HABIT_ICONS, 
  HABIT_COLORS, 
  HABIT_CATEGORIES,
  SPORTS_OPTIONS,
  STUDIES_OPTIONS,
  HabitIconOption, 
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
  // Normalize initial active category to match official list
  const initialCategory = (() => {
    if (selectedCategory) {
      const match = HABIT_CATEGORIES.find(
        (c) => c.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (match) return match;
    }
    // Check if selectedIcon belongs to Studies or Sports
    const isSport = SPORTS_OPTIONS.some((s) => s.id === selectedIcon);
    if (isSport) return "Sports";
    const isStudy = STUDIES_OPTIONS.some((s) => s.id === selectedIcon);
    if (isStudy) return "Studies";
    return "Health & Fitness";
  })();

  const [activeCategory, setActiveCategory] = useState<HabitCategoryType>(initialCategory);

  // Sync if parent category changes
  useEffect(() => {
    if (selectedCategory) {
      const match = HABIT_CATEGORIES.find(
        (c) => c.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (match && match !== activeCategory) {
        setActiveCategory(match);
      }
    }
  }, [selectedCategory]);

  const currentColorObj = HABIT_COLORS.find((c) => c.id === selectedColor) || HABIT_COLORS[0];
  const ActiveIconComp = getHabitIconComponent(selectedIcon, "", selectedSubcategory);

  const handleCategoryClick = (cat: HabitCategoryType) => {
    setActiveCategory(cat);
    onSelectCategory?.(cat);

    // If switching to Sports or Studies and current icon is not in that category, default to the 1st option
    if (cat === "Sports") {
      const isAlreadySport = SPORTS_OPTIONS.some((s) => s.id === selectedIcon);
      if (!isAlreadySport) {
        const firstSport = SPORTS_OPTIONS[0];
        onSelectIcon(firstSport.id);
        onSelectSubcategory?.(firstSport.subcategory || firstSport.label);
      }
    } else if (cat === "Studies") {
      const isAlreadyStudy = STUDIES_OPTIONS.some((s) => s.id === selectedIcon);
      if (!isAlreadyStudy) {
        const firstStudy = STUDIES_OPTIONS[0];
        onSelectIcon(firstStudy.id);
        onSelectSubcategory?.(firstStudy.subcategory || firstStudy.label);
      }
    } else {
      // General categories
      const generalIcons = HABIT_ICONS.filter((item) => item.category === cat);
      const isInCat = generalIcons.some((i) => i.id === selectedIcon);
      if (!isInCat && generalIcons.length > 0) {
        onSelectIcon(generalIcons[0].id);
        onSelectSubcategory?.("");
      }
    }
  };

  const handleItemSelect = (item: HabitIconOption) => {
    onSelectIcon(item.id);
    onSelectCategory?.(item.category);
    if (item.subcategory) {
      onSelectSubcategory?.(item.subcategory);
    } else {
      onSelectSubcategory?.("");
    }
  };

  // Determine current active icon list
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
            {activeCategory === "Sports" 
              ? "Select sport discipline & visual badge" 
              : activeCategory === "Studies" 
                ? "Select study subject & visual badge"
                : "Pick a minimal visual badge and accent color"}
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

      {/* Color Preset Palette */}
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

      {/* Category Tabs (Ordered: 1. Health & Fitness, 2. Studies, 3. Sports, 4. Mind & Focus, 5. Productivity, 6. Lifestyle) */}
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

        {/* Subheader if Sports or Studies */}
        {activeCategory === "Sports" && (
          <div className="pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Select Sport Discipline ({SPORTS_OPTIONS.length} options)
            </span>
            {selectedSubcategory && (
              <span className="text-[10px] font-mono text-zinc-400">
                Selected: <strong className="text-zinc-200">{selectedSubcategory}</strong>
              </span>
            )}
          </div>
        )}

        {activeCategory === "Studies" && (
          <div className="pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
              Select Subject ({STUDIES_OPTIONS.length} options)
            </span>
            {selectedSubcategory && (
              <span className="text-[10px] font-mono text-zinc-400">
                Selected: <strong className="text-zinc-200">{selectedSubcategory}</strong>
              </span>
            )}
          </div>
        )}

        {/* Icon Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
          {currentItems.map((item) => {
            const IconComp = item.icon;
            const isSelected = selectedIcon === item.id || (item.subcategory && selectedSubcategory === item.subcategory);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemSelect(item)}
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
