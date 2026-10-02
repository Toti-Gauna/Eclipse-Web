import {
  AudioLines,
  Bot,
  BookUser,
  Building,
  CalendarCheck,
  Clapperboard,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MonitorPlay,
  Plus,
  ScanSearch,
  Search,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Trophy,
  Workflow,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

/** Icons referenced by name from /content/*.json. Add new ones here. */
export const contentIcons: Record<string, LucideIcon> = {
  AudioLines,
  Bot,
  BookUser,
  Building,
  CalendarCheck,
  Clapperboard,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MonitorPlay,
  Plus,
  ScanSearch,
  Search,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Trophy,
  Workflow,
};

export function ContentIcon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = contentIcons[name] ?? Plus;
  return <Cmp aria-hidden strokeWidth={1.5} {...props} />;
}
