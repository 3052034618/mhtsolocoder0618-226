import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, Film, Clapperboard } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "项目" },
  { to: "/library", icon: BookOpen, label: "收藏库" },
  { to: "/", icon: Film, label: "脚本" },
  { to: "/", icon: Clapperboard, label: "分镜" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-ink-900 font-body text-white">
      <aside className="flex w-16 flex-shrink-0 flex-col items-center bg-ink-800 py-4 border-r border-ink-700/50">
        <div className="flex items-center justify-center w-10 h-10">
          <span className="font-display text-lg font-bold text-gradient-amber">SC</span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
          {navItems.map(({ to, icon: Icon, label }, idx) => {
            const isActive = idx === 0
              ? pathname === "/" || pathname.startsWith("/project")
              : idx === 1
                ? pathname === "/library"
                : false;
            return (
              <Link
                key={idx}
                to={to}
                title={label}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "text-ink-500 hover:bg-ink-700 hover:text-white"
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </nav>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-sm" title="张导">
          🎬
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
