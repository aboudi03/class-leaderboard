export type ThemeId = "neon" | "dreamy";

export type ClassRoom = {
  id: string;
  name: string;
  shortName: string;
  theme: ThemeId;
  room: string;
};

export type Student = {
  id: string;
  classId: string;
  name: string;
  photo: string | null;
  points: number;
  createdAt: string;
};

export type PointTransaction = {
  id: string;
  studentId: string;
  points: number;
  type: "positive" | "negative";
  reason: string;
  date: string;
  time: string;
  createdAt: string;
};

export type AppData = { students: Student[]; transactions: PointTransaction[] };

export const CLASSES: ClassRoom[] = [
  { id: "g3-boys", name: "Grade 3 Boys", shortName: "G3 Boys", theme: "neon", room: "Room 203" },
  { id: "g3-girls", name: "Grade 3 Girls", shortName: "G3 Girls", theme: "dreamy", room: "Room 204" },
  { id: "g4", name: "Grade 4", shortName: "Grade 4", theme: "dreamy", room: "Room 301" },
  { id: "g5", name: "Grade 5", shortName: "Grade 5", theme: "dreamy", room: "Room 302" },
];

export const LEVELS = {
  neon: [
    { name: "Rookie", icon: "◆", color: "#42ef95" },
    { name: "Player", icon: "◈", color: "#31c5ff" },
    { name: "Pro", icon: "⚡", color: "#a878ff" },
    { name: "Champion", icon: "◇", color: "#ff9f43" },
    { name: "Master", icon: "⬡", color: "#ff5678" },
    { name: "Legend", icon: "ϟ", color: "#d8ff3e" },
    { name: "Ultimate Champion", icon: "🏆", color: "#ffd45e" },
  ],
  dreamy: [
    { name: "Rising Star", icon: "🌱", color: "#5bc99f" },
    { name: "Star", icon: "⭐", color: "#f2b84b" },
    { name: "Super Star", icon: "✨", color: "#a672ee" },
    { name: "Champion", icon: "👑", color: "#ed75ad" },
    { name: "Diamond", icon: "💎", color: "#65bfda" },
    { name: "Legend", icon: "🌟", color: "#8b66d8" },
    { name: "Ultimate Star", icon: "🏆", color: "#d99d32" },
  ],
} as const;

export const POSITIVE_REASONS = [
  { reason: "Active participation", points: 10, icon: "Hand" },
  { reason: "Helped a friend", points: 10, icon: "Heart" },
  { reason: "Excellent behavior", points: 15, icon: "Sparkles" },
  { reason: "Respect the rules", points: 15, icon: "Shield" },
  { reason: "Other", points: 10, icon: "Plus" },
];

export const NEGATIVE_REASONS = [
  "Did not follow the rules",
  "Disrupting the class",
  "Disrespectful behavior",
  "Other",
].map((reason) => ({ reason, points: -10 }));

export function levelIndex(points: number) {
  return Math.min(6, Math.floor(Math.max(0, points) / 50));
}

export function getLevel(points: number, theme: ThemeId) {
  return LEVELS[theme][levelIndex(points)];
}

export function getProgress(points: number, theme: ThemeId) {
  const index = levelIndex(points);
  if (index === 6) return { current: points, target: 300, percent: 100, remaining: 0, next: null };
  const target = (index + 1) * 50;
  return {
    current: points,
    target,
    percent: ((points - index * 50) / 50) * 100,
    remaining: target - points,
    next: LEVELS[theme][index + 1],
  };
}

export function seedData(): AppData {
  return { students: [], transactions: [] };
}
