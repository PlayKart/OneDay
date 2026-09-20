import React from "react";
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
  Waves,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Palette,
  Globe,
  Users,
  Landmark,
  TrendingUp,
  Scale,
  CheckCircle2,
  LucideIcon,
  LucideProps
} from "lucide-react";

// ==========================================
// CUSTOM MINIMAL MONOCHROME LINE ICONS (24x24)
// ==========================================

export const CricketIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M14.5 4.5l5 5-7 7-3.5-1-1-3.5 6.5-7.5Z" />
      <path d="M14.5 4.5l4.5 4.5" />
      <path d="M6 18l3-3" />
      <circle cx="5" cy="19" r="2" />
    </svg>
  );
}) as any;

export const FootballIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="12" cy="12" r="9" />
      <polygon points="12 8 8.5 10.5 9.8 14.5 14.2 14.5 15.5 10.5" />
      <path d="M12 3v5" />
      <path d="M3.5 9.5l5 1" />
      <path d="M5.5 19l4.3-4.5" />
      <path d="M18.5 19l-4.3-4.5" />
      <path d="M20.5 9.5l-5 1" />
    </svg>
  );
}) as any;

export const BasketballIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M5.5 5.5c4 4 4 9 0 13" />
      <path d="M18.5 5.5c-4 4-4 9 0 13" />
    </svg>
  );
}) as any;

export const BadmintonIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="12" cy="18" r="2.5" />
      <path d="M9.5 17 6 6h12l-3.5 11" />
      <line x1="6" y1="10" x2="18" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  );
}) as any;

export const TennisIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="10" cy="10" r="7" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <circle cx="19" cy="5" r="2" />
    </svg>
  );
}) as any;

export const VolleyballIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12a9 9 0 0 1 7.8 4.5" />
      <path d="M12 12a9 9 0 0 1-7.8 4.5" />
      <path d="M12 12V3" />
      <path d="M7 6.5a9 9 0 0 1 8 0" />
      <path d="M17.5 17.5a9 9 0 0 1-4 7" />
      <path d="M6.5 17.5a9 9 0 0 0 4 7" />
    </svg>
  );
}) as any;

export const SanskritIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M4 5h16" />
      <path d="M16 5v14" />
      <path d="M7 8.5a3 3 0 0 1 5 2c0 1.8-1.8 2.5-3.5 2.5" />
      <path d="M8.5 13c2.5 0 4.5.8 4.5 3.5s-2 3.5-4.5 3.5" />
      <path d="M10.5 13h5.5" />
    </svg>
  );
}) as any;

export const HindiIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { size = 24, strokeWidth = 2, className = "", ...rest } = props;
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M4 5h16" />
      <path d="M16 5v14" />
      <path d="M7 8.5a3 3 0 0 1 5 2c0 1.8-1.8 2.5-3.5 2.5" />
      <path d="M8.5 13c2.5 0 4.5.8 4.5 3.5s-2 3.5-4.5 3.5" />
      <path d="M10.5 13h5.5" />
    </svg>
  );
}) as any;

// ==========================================
// CATEGORY DEFINITIONS
// 1. Health & Fitness (1st)
// 2. Studies (2nd - MANDATORY)
// 3. Sports (3rd - MANDATORY)
// 4. Mind & Focus
// 5. Productivity
// 6. Lifestyle
// ==========================================

export const HABIT_CATEGORIES = [
  "Health & Fitness",
  "Studies",
  "Sports",
  "Mind & Focus",
  "Productivity",
  "Lifestyle",
] as const;

export type HabitCategoryType = (typeof HABIT_CATEGORIES)[number];

export interface HabitIconOption {
  id: string;
  label: string;
  icon: LucideIcon;
  category: HabitCategoryType;
  subcategory?: string;
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

// ==========================================
// SPORTS SUB-OPTIONS (EXACT ORDER MANDATED)
// 1. Cricket
// 2. Football
// 3. Basketball
// 4. Badminton
// 5. Swimming
// 6. Tennis
// 7. Running
// 8. Cycling
// 9. Athletics (second-last)
// 10. Volleyball (LAST)
// ==========================================

export const SPORTS_OPTIONS: HabitIconOption[] = [
  { id: "cricket", label: "Cricket", icon: CricketIcon, category: "Sports", subcategory: "Cricket" },
  { id: "football", label: "Football", icon: FootballIcon, category: "Sports", subcategory: "Football" },
  { id: "basketball", label: "Basketball", icon: BasketballIcon, category: "Sports", subcategory: "Basketball" },
  { id: "badminton", label: "Badminton", icon: BadmintonIcon, category: "Sports", subcategory: "Badminton" },
  { id: "swimming", label: "Swimming", icon: Waves, category: "Sports", subcategory: "Swimming" },
  { id: "tennis", label: "Tennis", icon: TennisIcon, category: "Sports", subcategory: "Tennis" },
  { id: "running", label: "Running", icon: Footprints, category: "Sports", subcategory: "Running" },
  { id: "cycling", label: "Cycling", icon: Bike, category: "Sports", subcategory: "Cycling" },
  { id: "athletics", label: "Athletics", icon: Trophy, category: "Sports", subcategory: "Athletics" },
  { id: "volleyball", label: "Volleyball", icon: VolleyballIcon, category: "Sports", subcategory: "Volleyball" },
];

// ==========================================
// STUDIES / SUBJECTS SUB-OPTIONS (EXACT ORDER MANDATED)
// 1. Maths
// 2. English
// 3. Physics
// 4. Chemistry
// 5. Biology
// 6. Sanskrit
// 7. Hindi
// 8. Art
// ==========================================

export const STUDIES_OPTIONS: HabitIconOption[] = [
  { id: "maths", label: "Maths", icon: Calculator, category: "Studies", subcategory: "Maths" },
  { id: "english", label: "English", icon: BookOpen, category: "Studies", subcategory: "English" },
  { id: "physics", label: "Physics", icon: Atom, category: "Studies", subcategory: "Physics" },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical, category: "Studies", subcategory: "Chemistry" },
  { id: "biology", label: "Biology", icon: Dna, category: "Studies", subcategory: "Biology" },
  { id: "sanskrit", label: "Sanskrit", icon: SanskritIcon, category: "Studies", subcategory: "Sanskrit" },
  { id: "hindi", label: "Hindi", icon: HindiIcon, category: "Studies", subcategory: "Hindi" },
  { id: "art", label: "Art", icon: Palette, category: "Studies", subcategory: "Art" },
  { id: "geography", label: "Geography", icon: Globe, category: "Studies", subcategory: "Geography" },
  { id: "social_studies", label: "Social Studies", icon: Users, category: "Studies", subcategory: "Social Studies" },
  { id: "history", label: "History", icon: Landmark, category: "Studies", subcategory: "History" },
  { id: "economics", label: "Economics", icon: TrendingUp, category: "Studies", subcategory: "Economics" },
  { id: "civics", label: "Civics", icon: Scale, category: "Studies", subcategory: "Civics" },
];

// Complete combined catalog of habit icons
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

  // Studies
  ...STUDIES_OPTIONS,

  // Sports
  ...SPORTS_OPTIONS,

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

export const ICON_MAP: Record<string, LucideIcon> = {
  // Sports aliases
  cricket: CricketIcon,
  football: FootballIcon,
  soccer: FootballIcon,
  basketball: BasketballIcon,
  badminton: BadmintonIcon,
  shuttle: BadmintonIcon,
  swimming: Waves,
  swim: Waves,
  waves: Waves,
  tennis: TennisIcon,
  running: Footprints,
  run: Footprints,
  cycling: Bike,
  cycle: Bike,
  bike: Bike,
  athletics: Trophy,
  volleyball: VolleyballIcon,

  // Studies / Subjects aliases
  maths: Calculator,
  math: Calculator,
  mathematics: Calculator,
  calculator: Calculator,
  english: BookOpen,
  physics: Atom,
  atom: Atom,
  chemistry: FlaskConical,
  chem: FlaskConical,
  flask: FlaskConical,
  "flask-conical": FlaskConical,
  flask_conical: FlaskConical,
  biology: Dna,
  bio: Dna,
  dna: Dna,
  sanskrit: SanskritIcon,
  hindi: HindiIcon,
  art: Palette,
  palette: Palette,
  drawing: Palette,
  painting: Palette,
  geography: Globe,
  geo: Globe,
  globe: Globe,
  map: Globe,
  social_studies: Users,
  "social-studies": Users,
  socialstudies: Users,
  "social studies": Users,
  society: Users,
  community: Users,
  history: Landmark,
  landmark: Landmark,
  historical: Landmark,
  scroll: Landmark,
  heritage: Landmark,
  economics: TrendingUp,
  economy: TrendingUp,
  eco: TrendingUp,
  "trending-up": TrendingUp,
  trending_up: TrendingUp,
  civics: Scale,
  civic: Scale,
  scale: Scale,
  polity: Scale,
  government: Scale,

  // Generic and existing
  dumbbell: Dumbbell,
  footprints: Footprints,
  activity: Activity,
  heart: Heart,
  droplet: Droplet,
  "glass-water": GlassWater,
  glass_water: GlassWater,
  apple: Apple,
  salad: Salad,
  pill: Pill,
  bed: Bed,
  brain: Brain,
  "book-open": BookOpen,
  book_open: BookOpen,
  "graduation-cap": GraduationCap,
  graduation_cap: GraduationCap,
  code: Code,
  lightbulb: Lightbulb,
  feather: Feather,
  headphones: Headphones,
  music: Music,
  "check-square": CheckSquare,
  check_square: CheckSquare,
  target: Target,
  zap: Zap,
  clock: Clock,
  laptop: Laptop,
  briefcase: Briefcase,
  "dollar-sign": DollarSign,
  dollar_sign: DollarSign,
  trophy: Trophy,
  coffee: Coffee,
  sun: Sun,
  moon: Moon,
  flame: Flame,
  smile: Smile,
  utensils: Utensils,
  camera: Camera,
  "tree-pine": TreePine,
  tree_pine: TreePine,
  sprout: Sprout,
  compass: Compass,
  sparkles: Sparkles,
  "check-circle-2": CheckCircle2,
  check_circle_2: CheckCircle2,
};

export function getHabitIconComponent(iconId?: string, habitName: string = "", subcategory?: string): LucideIcon {
  // 1. Direct Icon ID match
  if (iconId && typeof iconId === "string") {
    const raw = iconId.trim().toLowerCase();
    if (ICON_MAP[raw]) return ICON_MAP[raw];
    const hyphenated = raw.replace(/_/g, "-");
    if (ICON_MAP[hyphenated]) return ICON_MAP[hyphenated];
    const underscored = raw.replace(/-/g, "_");
    if (ICON_MAP[underscored]) return ICON_MAP[underscored];
  }

  // 2. Subcategory match if provided
  if (subcategory && typeof subcategory === "string") {
    const rawSub = subcategory.trim().toLowerCase();
    if (ICON_MAP[rawSub]) return ICON_MAP[rawSub];
  }

  // 3. Habit name / context fuzzy matching
  const nameLower = habitName.toLowerCase();
  
  // Sports keywords
  if (nameLower.includes("cricket")) return CricketIcon;
  if (nameLower.includes("football") || nameLower.includes("soccer")) return FootballIcon;
  if (nameLower.includes("basketball") || nameLower.includes("hoop")) return BasketballIcon;
  if (nameLower.includes("badminton") || nameLower.includes("shuttle")) return BadmintonIcon;
  if (nameLower.includes("swim") || nameLower.includes("pool") || nameLower.includes("lap")) return Waves;
  if (nameLower.includes("tennis")) return TennisIcon;
  if (nameLower.includes("volleyball") || nameLower.includes("volley")) return VolleyballIcon;
  if (nameLower.includes("athletic") || nameLower.includes("sprint") || nameLower.includes("marathon")) return Trophy;
  if (nameLower.includes("cycle") || nameLower.includes("bike") || nameLower.includes("biking")) return Bike;
  if (nameLower.includes("run") || nameLower.includes("walk") || nameLower.includes("step") || nameLower.includes("jog")) return Footprints;

  // Studies keywords
  if (nameLower.includes("math") || nameLower.includes("algebra") || nameLower.includes("calculus") || nameLower.includes("geometry")) return Calculator;
  if (nameLower.includes("physics")) return Atom;
  if (nameLower.includes("chemistry") || nameLower.includes("organic chem")) return FlaskConical;
  if (nameLower.includes("biology") || nameLower.includes("botany") || nameLower.includes("zoology")) return Dna;
  if (nameLower.includes("sanskrit")) return SanskritIcon;
  if (nameLower.includes("hindi")) return HindiIcon;
  if (nameLower.includes("english") || nameLower.includes("grammar") || nameLower.includes("vocab") || nameLower.includes("essay")) return BookOpen;
  if (nameLower.includes("art") || nameLower.includes("sketch") || nameLower.includes("paint") || nameLower.includes("draw")) return Palette;
  if (nameLower.includes("geography") || nameLower.includes("geo")) return Globe;
  if (nameLower.includes("social studies") || nameLower.includes("social-studies") || nameLower.includes("social science") || nameLower.includes("civics & history")) return Users;
  if (nameLower.includes("history") || nameLower.includes("historical") || nameLower.includes("ancient")) return Landmark;
  if (nameLower.includes("economics") || nameLower.includes("economy") || nameLower.includes("microeconomics") || nameLower.includes("macroeconomics") || nameLower.includes("finance")) return TrendingUp;
  if (nameLower.includes("civics") || nameLower.includes("civic") || nameLower.includes("polity") || nameLower.includes("political science") || nameLower.includes("constitution")) return Scale;

  // Lifestyle / Health keywords
  if (nameLower.includes("plant") || nameLower.includes("garden") || nameLower.includes("flower") || nameLower.includes("sprout") || (nameLower.includes("water") && nameLower.includes("plant"))) return Sprout;
  if (nameLower.includes("dish") || nameLower.includes("dishes") || nameLower.includes("clean") || nameLower.includes("tidy") || nameLower.includes("chore")) return Sparkles;
  if (nameLower.includes("bed") || nameLower.includes("sleep") || nameLower.includes("rest") || nameLower.includes("wake")) return Bed;
  if (nameLower.includes("gym") || nameLower.includes("workout") || nameLower.includes("lift") || nameLower.includes("pushup") || nameLower.includes("weight") || nameLower.includes("fitness")) return Dumbbell;
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
    
    // Check direct color matches
    const matched = HABIT_COLORS.find(c => c.id.toLowerCase() === cleanId || c.name.toLowerCase() === cleanId);
    if (matched) return matched;

    // Check category matches
    if (cleanId === "studies" || cleanId.includes("study")) return HABIT_COLORS[2]; // blue
    if (cleanId === "sports" || cleanId.includes("sport")) return HABIT_COLORS[0]; // emerald
    if (cleanId.includes("fitness") || cleanId.includes("health")) return HABIT_COLORS[0]; // emerald
    if (cleanId.includes("mind") || cleanId.includes("focus")) return HABIT_COLORS[1]; // cyan
    if (cleanId.includes("productivity")) return HABIT_COLORS[3]; // purple
    if (cleanId.includes("lifestyle")) return HABIT_COLORS[5]; // amber
  }

  const nameLower = habitName.toLowerCase();
  if (nameLower.includes("cricket") || nameLower.includes("football") || nameLower.includes("sport") || nameLower.includes("gym") || nameLower.includes("workout") || nameLower.includes("run") || nameLower.includes("fit")) return HABIT_COLORS[0]; // emerald
  if (nameLower.includes("water") || nameLower.includes("drink") || nameLower.includes("hydrate") || nameLower.includes("clean") || nameLower.includes("dish")) return HABIT_COLORS[1]; // cyan
  if (nameLower.includes("math") || nameLower.includes("physics") || nameLower.includes("chem") || nameLower.includes("bio") || nameLower.includes("study") || nameLower.includes("read") || nameLower.includes("code") || nameLower.includes("geography") || nameLower.includes("history") || nameLower.includes("civic") || nameLower.includes("economic") || nameLower.includes("social")) return HABIT_COLORS[2]; // blue
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
