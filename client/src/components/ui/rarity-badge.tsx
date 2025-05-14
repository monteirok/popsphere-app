import { Award, Star, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface RarityBadgeProps {
  rarity: string;
  size?: "xs" | "sm" | "md";
  showText?: boolean;
  className?: string;
}

export default function RarityBadge({ 
  rarity, 
  size = "sm", 
  showText = false,
  className
}: RarityBadgeProps) {
  // Define sizes for icons
  const sizeMap = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };
  
  // Define text size
  const textSize = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
  };
  
  const getIconAndColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return {
          icon: <Award className={cn(sizeMap[size], "text-soft-blue")} />,
          textColor: "text-soft-blue",
          label: "Common"
        };
      case "rare":
        return {
          icon: <Star className={cn(sizeMap[size], "text-golden-yellow")} />,
          textColor: "text-golden-yellow",
          label: "Rare"
        };
      case "ultra-rare":
      case "ultra rare":
        return {
          icon: <Crown className={cn(sizeMap[size], "text-purple-500")} />,
          textColor: "text-purple-500",
          label: "Ultra Rare"
        };
      case "limited":
      case "limited edition":
        return {
          icon: <Gem className={cn(sizeMap[size], "text-red-500")} />,
          textColor: "text-red-500",
          label: "Limited"
        };
      default:
        return {
          icon: <Award className={cn(sizeMap[size], "text-gray-400")} />,
          textColor: "text-gray-400",
          label: "Unknown"
        };
    }
  };
  
  const { icon, textColor, label } = getIconAndColor(rarity);
  
  return (
    <div className={cn("flex items-center", className)}>
      {icon}
      {showText && (
        <span className={cn("ml-0.5", textSize[size], textColor)}>
          {label}
        </span>
      )}
    </div>
  );
}
