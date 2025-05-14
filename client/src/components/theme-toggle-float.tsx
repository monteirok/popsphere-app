import { ThemeSwitch } from "@/components/ui/theme-switch";

export function ThemeToggleFloat() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 p-2 rounded-full shadow-lg">
        <ThemeSwitch />
      </div>
    </div>
  );
}