import { NavLink, Outlet } from "react-router-dom";
import { Home, Layers, MapPin, Settings } from "lucide-react";
import Navbar from "../components/Navbar";
import { ENABLE_MANAGEMENT } from "../config/featureFlags";

function LeftSidebar() {
  const baseLink =
    "flex flex-col items-center gap-1 py-4 w-full transition-colors";
  const devLabel =
    "flex flex-col items-center gap-1 py-4 w-full rounded-xl border-b border-slate-200 opacity-55 cursor-not-allowed";

  return (
    <aside className="hidden md:flex w-24 flex-col justify-between bg-white shadow-xl z-10 overflow-y-auto">
      <nav className="space-y-2 p-2">
        <div className={devLabel}>
          <Home size={22} className="text-slate-700" />
          <span className="text-xs text-slate-500">Development</span>
        </div>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${baseLink} ${isActive ? "bg-slate-50" : "hover:bg-slate-100"}`
          }
        >
          <MapPin size={22} className="text-green-500" />
          <span className="text-xs text-green-500">Map</span>
        </NavLink>

        {ENABLE_MANAGEMENT ? (
          <NavLink
            to="/farms"
            className={({ isActive }) =>
              `${baseLink} rounded-xl ${isActive ? "bg-slate-50" : "hover:bg-slate-100"}`
            }
          >
            <Layers size={22} className="text-slate-800" />
            <span className="text-xs text-slate-600">My Farms</span>
          </NavLink>
        ) : (
          <div className={devLabel}>
            <Layers size={22} className="text-slate-400" />
            <span className="text-xs text-slate-500">Development</span>
          </div>
        )}
      </nav>

      <nav className="p-2">
        <div className={devLabel}>
          <Settings size={22} className="text-slate-400" />
          <span className="text-xs text-slate-500">Development</span>
        </div>
      </nav>
    </aside>
  );
}

export default function WorkspaceLayout() {
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
