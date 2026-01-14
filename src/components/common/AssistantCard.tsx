import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface AssistantCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  iconColor: string;
  iconBgColor: string;
}

export function AssistantCard({ title, description, icon: Icon, href, iconColor, iconBgColor }: AssistantCardProps) {
  return (
    <Link href={href}>
      <div className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer h-full">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-20 h-20 rounded-2xl ${iconBgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-10 h-10 ${iconColor}`} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-100 mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
          </div>
          <div className="pt-4">
            <span className="text-sm text-blue-400 group-hover:text-blue-300 flex items-center gap-2">
              Open Assistant
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
