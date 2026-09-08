import { 
  Dumbbell, 
  BookOpen, 
  Droplet, 
  Zap, 
  Coffee, 
  Flame, 
  Brain, 
  Heart, 
  Sun, 
  Moon, 
  Target, 
  Trophy, 
  Apple, 
  Smile, 
  Headphones, 
  Camera, 
  Code, 
  Laptop, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Utensils, 
  Sparkles, 
  GlassWater, 
  Feather, 
  Lightbulb, 
  Compass, 
  Shield, 
  Star, 
  Music, 
  Bike, 
  Activity, 
  Bed, 
  CheckSquare, 
  GraduationCap, 
  Footprints, 
  Pill, 
  Salad, 
  TreePine, 
  SmilePlus,
  Sprout,
  LucideIcon
} from "lucide-react";

export interface HabitIconOption {
  id: string;
  label: string;
  icon: LucideIcon;
  category: "Health & Fitness" | "Mind & Focus" | "Productivity" | "Lifestyle";
}

export interface HabitColorOption {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
  ring: string;
  glow: string;
}

export const HABIT_COLORS: HabitColorOption[] = [
  { id: "emerald", name: "Emerald", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", ring: "ring-emerald-500", glow: "shadow-emerald-500/20" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", ring: "ring-cyan-500", glow: "shadow-cyan-500/20" },
  { id: "blue", name: "Blue", bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", ring: "ring-blue-500", glow: "shadow-blue-500/20" },
  { id: "purple", name: "Purple", bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", ring: "ring-purple-500", glow: "shadow-purple-500/20" },
  { id: "rose", name: "Rose", bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", ring: "ring-rose-500", glow: "shadow-rose-500/20" },
  { id: "amber", name: "Amber", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", ring: "ring-amber-500", glow: "shadow-amber-500/20" },
  { id: "orange", name: "Orange", bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", ring: "ring-orange-500", glow: "shadow-orange-500/20" },
  { id: "indigo", name: "Indigo", bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30", ring: "ring-indigo-500", glow: "shadow-indigo-500/20" },
];

export const HABIT_ICONS: HabitIconOption[] = [
  // Health & Fitness
  { id: "dumbbell", label: "Workout", icon: Dumbbell, category: "Health & Fitness" },
  { id: "footprints", label: "Walking/Run", icon: Footprints, category: "Health & Fitness" },
  { id: "activity", label: "Exercise", icon: Activity, category: "Health & Fitness" },
  { id: "heart", label: "Health", icon: Heart, category: "Health & Fitness" },
  { id: "droplet", label: "Hydrate", icon: Droplet, category: "Health & Fitness" },
  { id: "glass-water", label: "Water", icon: GlassWater, category: "Health & Fitness" },
  { id: "apple", label: "Nutrition", icon: Apple, category: "Health & Fitness" },
  { id: "salad", label: "Clean Diet", icon: Salad, category: "Health & Fitness" },
  { id: "bike", label: "Cycling", icon: Bike, category: "Health & Fitness" },
  { id: "pill", label: "Meds/Vitamins", icon: Pill, category: "Health & Fitness" },
  { id: "bed", label: "Sleep", icon: Bed, category: "Health & Fitness" },

  // Mind & Focus
  { id: "brain", label: "Meditation", icon: Brain, category: "Mind & Focus" },
  { id: "book-open", label: "Reading", icon: BookOpen, category: "Mind & Focus" },
  { id: "graduation-cap", label: "Study", icon: GraduationCap, category: "Mind & Focus" },
  { id: "code", label: "Coding", icon: Code, category: "Mind & Focus" },
  { id: "lightbulb", label: "Ideas", icon: Lightbulb, category: "Mind & Focus" },
  { id: "feather", label: "Journaling", icon: Feather, category: "Mind & Focus" },
  { id: "headphones", label: "Podcast/Audio", icon: Headphones, category: "Mind & Focus" },
  { id: "music", label: "Music", icon: Music, category: "Mind & Focus" },

  // Productivity
  { id: "check-square", label: "To-Do", icon: CheckSquare, category: "Productivity" },
  { id: "target", label: "Goals", icon: Target, category: "Productivity" },
  { id: "zap", label: "Energy", icon: Zap, category: "Productivity" },
  { id: "clock", label: "Time Management", icon: Clock, category: "Productivity" },
  { id: "laptop", label: "Work", icon: Laptop, category: "Productivity" },
  { id: "briefcase", label: "Business", icon: Briefcase, category: "Productivity" },
  { id: "dollar-sign", label: "Finance/Savings", icon: DollarSign, category: "Productivity" },
  { id: "trophy", label: "Win", icon: Trophy, category: "Productivity" },

  // Lifestyle
  { id: "coffee", label: "No Coffee/Limit", icon: Coffee, category: "Lifestyle" },
  { id: "sun", label: "Morning Routine", icon: Sun, category: "Lifestyle" },
  { id: "moon", label: "Night Routine", icon: Moon, category: "Lifestyle" },
  { id: "flame", label: "Streak/Passion", icon: Flame, category: "Lifestyle" },
  { id: "smile", label: "Gratitude", icon: Smile, category: "Lifestyle" },
  { id: "utensils", label: "Cooking", icon: Utensils, category: "Lifestyle" },
  { id: "camera", label: "Photography", icon: Camera, category: "Lifestyle" },
  { id: "tree-pine", label: "Outdoors/Nature", icon: TreePine, category: "Lifestyle" },
  { id: "sprout", label: "Plants/Growth", icon: Sprout, category: "Lifestyle" },
  { id: "compass", label: "Explore", icon: Compass, category: "Lifestyle" },
  { id: "sparkles", label: "Self Care", icon: Sparkles, category: "Lifestyle" },
];

export const ICON_MAP: Record<string, LucideIcon> = HABIT_ICONS.reduce((acc, curr) => {
  acc[curr.id] = curr.icon;
  // Also register with underscore version if it contains hyphens
  if (curr.id.includes("-")) {
    acc[curr.id.replace(/-/g, "_")] = curr.icon;
  }
  return acc;
}, {} as Record<string, LucideIcon>);

export function getHabitIconComponent(iconId?: string, habitName: string = ""): LucideIcon {
  if (iconId && typeof iconId === "string") {
    const raw = iconId.trim().toLowerCase();
    if (ICON_MAP[raw]) {
      return ICON_MAP[raw];
    }
    const hyphenated = raw.replace(/_/g, "-");
    if (ICON_MAP[hyphenated]) {
      return ICON_MAP[hyphenated];
    }
    const underscored = raw.replace(/-/g, "_");
    if (ICON_MAP[underscored]) {
      return ICON_MAP[underscored];
    }
  }

  const nameLower = habitName.toLowerCase();
  if (nameLower.includes("plant") || nameLower.includes("garden") || nameLower.includes("flower") || nameLower.includes("sprout") || (nameLower.includes("water") && nameLower.includes("plant"))) return Sprout;
  if (nameLower.includes("dish") || nameLower.includes("dishes") || nameLower.includes("clean") || nameLower.includes("tidy") || nameLower.includes("chore")) return Sparkles;
  if (nameLower.includes("bed") || nameLower.includes("sleep") || nameLower.includes("rest") || nameLower.includes("wake")) return Bed;
  if (nameLower.includes("gym") || nameLower.includes("workout") || nameLower.includes("lift") || nameLower.includes("pushup") || nameLower.includes("weight") || nameLower.includes("fitness")) return Dumbbell;
  if (nameLower.includes("run") || nameLower.includes("walk") || nameLower.includes("step") || nameLower.includes("jog")) return Footprints;
  if (nameLower.includes("read") || nameLower.includes("book") || nameLower.includes("page")) return BookOpen;
  if (nameLower.includes("water") || nameLower.includes("drink") || nameLower.includes("hydrate")) return Droplet;
  if (nameLower.includes("meditat") || nameLower.includes("mind") || nameLower.includes("zen") || nameLower.includes("breath")) return Brain;
  if (nameLower.includes("code") || nameLower.includes("programm") || nameLower.includes("dev")) return Code;
  if (nameLower.includes("journal") || nameLower.includes("write") || nameLower.includes("diary")) return Feather;
  if (nameLower.includes("eat") || nameLower.includes("diet") || nameLower.includes("meal") || nameLower.includes("food") || nameLower.includes("cook")) return Salad;
  if (nameLower.includes("study") || nameLower.includes("learn") || nameLower.includes("class")) return GraduationCap;
  if (nameLower.includes("coffee") || nameLower.includes("caffeine")) return Coffee;
  if (nameLower.includes("money") || nameLower.includes("sav") || nameLower.includes("budget") || nameLower.includes("invest")) return DollarSign;
  if (nameLower.includes("sun") || nameLower.includes("morning")) return Sun;
  if (nameLower.includes("night") || nameLower.includes("evening")) return Moon;
  if (nameLower.includes("music") || nameLower.includes("instrument") || nameLower.includes("guitar")) return Music;

  return Dumbbell;
}

export function getHabitColorTheme(colorId?: string, habitName: string = ""): HabitColorOption {
  if (colorId && typeof colorId === "string") {
    const cleanId = colorId.trim().toLowerCase();
    const matched = HABIT_COLORS.find(c => c.id.toLowerCase() === cleanId || c.name.toLowerCase() === cleanId);
    if (matched) return matched;
  }

  const nameLower = habitName.toLowerCase();
  if (nameLower.includes("plant") || nameLower.includes("sprout") || nameLower.includes("garden") || nameLower.includes("gym") || nameLower.includes("workout") || nameLower.includes("run") || nameLower.includes("fit")) return HABIT_COLORS[0]; // emerald
  if (nameLower.includes("water") || nameLower.includes("drink") || nameLower.includes("hydrate") || nameLower.includes("clean") || nameLower.includes("dish")) return HABIT_COLORS[1]; // cyan
  if (nameLower.includes("read") || nameLower.includes("study") || nameLower.includes("learn") || nameLower.includes("code")) return HABIT_COLORS[2]; // blue
  if (nameLower.includes("meditat") || nameLower.includes("journal") || nameLower.includes("mind") || nameLower.includes("sleep") || nameLower.includes("bed")) return HABIT_COLORS[3]; // purple
  if (nameLower.includes("heart") || nameLower.includes("love") || nameLower.includes("gratitude")) return HABIT_COLORS[4]; // rose
  if (nameLower.includes("sun") || nameLower.includes("morning") || nameLower.includes("eat") || nameLower.includes("food")) return HABIT_COLORS[5]; // amber
  if (nameLower.includes("fire") || nameLower.includes("streak") || nameLower.includes("focus")) return HABIT_COLORS[6]; // orange

  // Hash habit name for deterministic pleasant color
  let hash = 0;
  for (let i = 0; i < habitName.length; i++) {
    hash = habitName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % HABIT_COLORS.length;
  return HABIT_COLORS[index];
}
