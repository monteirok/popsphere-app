import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarWithStatusProps {
  src: string;
  alt: string;
  status?: "online" | "offline" | "away" | "busy" | "new";
  className?: string;
  statusClassName?: string;
  fallback?: string;
}

export function AvatarWithStatus({
  src,
  alt,
  status,
  className = "w-10 h-10",
  statusClassName = "w-3 h-3",
  fallback
}: AvatarWithStatusProps) {
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-400";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "new":
        return "bg-soft-blue";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative">
      <Avatar className={className}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback || getInitials(alt)}</AvatarFallback>
      </Avatar>
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${statusClassName} ${getStatusColorClass(status)}`}
        />
      )}
    </div>
  );
}
