import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Layers, MapPin, Settings } from "lucide-react";
import Navbar from "../components/Navbar";
import { ENABLE_MANAGEMENT } from "../config/featureFlags";
import { getTelemetrySessionId, sendTelemetryVisit } from "../services/telemetry";
import '../styles/workspace.css'

function LeftSidebar() {
  const baseLink =
    "flex flex-col items-center gap-1 py-4 w-full transition-colors";
  const devLabel =
    "flex flex-col items-center gap-1 py-4 w-full rounded-xl border-b border-slate-200 opacity-55 cursor-not-allowed";

  return (
    <aside className="hidden w-24 flex-col justify-between overflow-y-auto border-r border-line bg-paper md:flex z-10">
      <nav className="space-y-2 p-2">
        <NavLink to="/" className={baseLink}>
          <Home size={22} className="text-slate-700" />
          <span className="text-xs text-slate-500">Accueil</span>
        </NavLink>

        <NavLink
          to="/analyse"
          end
          className={({ isActive }) =>
            `${baseLink} ${isActive ? "border-l-2 border-ink bg-green-50" : "hover:bg-slate-100"}`
          }
        >
          <MapPin size={22} className="text-green-500" />
          <span className="text-xs text-green-500">Carte</span>
        </NavLink>

        {ENABLE_MANAGEMENT ? (
          <NavLink
            to="/farms"
            className={({ isActive }) =>
              `${baseLink} rounded-xl ${isActive ? "bg-slate-50" : "hover:bg-slate-100"}`
            }
          >
            <Layers size={22} className="text-slate-800" />
            <span className="text-xs text-slate-600">Parcelles</span>
          </NavLink>
        ) : (
          <div className={devLabel}>
            <Layers size={22} className="text-slate-400" />
            <span className="text-xs text-slate-500">À venir</span>
          </div>
        )}
      </nav>

      <nav className="p-2">
        <div className={devLabel}>
          <Settings size={22} className="text-slate-400" />
          <span className="text-xs text-slate-500">À venir</span>
        </div>
      </nav>
    </aside>
  );
}

export default function WorkspaceLayout() {
  useEffect(() => {
    const sessionId = getTelemetrySessionId();
    void sendTelemetryVisit(sessionId).catch((error) => {
      console.error("Failed to send telemetry visit:", error);
    });
  }, []);

  return (
    <div className="workspace flex h-dvh flex-col bg-paper font-sans text-ink [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-terra [&_a:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-terra [&_button:focus-visible]:outline-offset-3 [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-terra [&_input:focus-visible]:outline-offset-3 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none">
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
