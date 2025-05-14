import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // If it's today, show time only
  const today = new Date();
  const isToday = today.getDate() === d.getDate() && 
                 today.getMonth() === d.getMonth() && 
                 today.getFullYear() === d.getFullYear();
  
  if (isToday) {
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // If it's yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.getDate() === d.getDate() && 
                      yesterday.getMonth() === d.getMonth() && 
                      yesterday.getFullYear() === d.getFullYear();
  
  if (isYesterday) {
    return "Yesterday";
  }
  
  // If it's within the last week, show day name
  const withinLastWeek = today.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  
  if (withinLastWeek) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  // Otherwise, show full date
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + '...';
}

export function getRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'text-soft-blue';
    case 'rare':
      return 'text-golden-yellow';
    case 'ultra-rare':
    case 'ultra rare':
      return 'text-purple-500';
    case 'limited':
    case 'limited edition':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getRarityIcon(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'award';
    case 'rare':
      return 'star';
    case 'ultra-rare':
    case 'ultra rare':
      return 'crown';
    case 'limited':
    case 'limited edition':
      return 'gem';
    default:
      return 'circle';
  }
}
