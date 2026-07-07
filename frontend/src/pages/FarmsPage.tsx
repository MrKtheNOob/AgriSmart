import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Plus,
  Search,
  EllipsisVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ENABLE_MANAGEMENT } from "../config/featureFlags";
import {
  getFarm,
  listAnalysisReports,
  listFarmReports,
  listFarms,
  type AnalysisReport,
  type Farm,
} from "../services/management";

type AnalysisPayload = Record<string, unknown>;

function formatDate(value: string | null | undefined) {
  if (!value) return "New";
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPayload(report: AnalysisReport): AnalysisPayload {
  return report.analysis_payload && typeof report.analysis_payload === "object"
    ? report.analysis_payload
    : {};
}

function getNestedValue(payload: AnalysisPayload, path: string[]): unknown {
  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, payload);
}

function getTopCropName(report: AnalysisReport) {
  const crops = getNestedValue(getPayload(report), [
    "recommendation",
    "recommended_crops",
  ]);
  if (Array.isArray(crops) && crops.length > 0) {
    const crop = crops[0] as Record<string, unknown>;
    const name = crop.name;
    if (typeof name === "string" && name.trim()) return name;
  }

  return report.title || report.sector_name || "Analyse";
}

function getYieldLabel(report: AnalysisReport) {
  const crops = getNestedValue(getPayload(report), [
    "recommendation",
    "recommended_crops",
  ]);
  if (Array.isArray(crops) && crops.length > 0) {
    const crop = crops[0] as Record<string, unknown>;
    const revenue = crop.revenue_per_ha;
    if (typeof revenue === "number" && Number.isFinite(revenue)) {
      return `~ ${new Intl.NumberFormat("fr-FR").format(revenue / 10)} /ha`;
    }
  }

  return "À calculer";
}

function getStatusLabel(report: AnalysisReport) {
  const waterInsight = getNestedValue(getPayload(report), [
    "water_insight",
    "category",
  ]);
  if (typeof waterInsight === "string" && waterInsight.trim()) return "Nocuité";
  return "Enregistré";
}

function getSoilProperties(report?: AnalysisReport | null) {
  const payload = report ? getPayload(report) : {};
  const soil = getNestedValue(payload, ["soil"]);
  if (!soil || typeof soil !== "object") return {};
  const soilRecord = soil as Record<string, unknown>;
  const properties = soilRecord.properties;
  if (!properties || typeof properties !== "object") return {};
  return properties as Record<string, unknown>;
}

function getTextProperty(
  properties: Record<string, unknown>,
  keys: string[],
  fallback = "—",
) {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  }
  return fallback;
}

function getTextureLabel(report?: AnalysisReport | null) {
  const payload = report ? getPayload(report) : {};
  const soil = getNestedValue(payload, ["soil", "classification"]);
  if (typeof soil === "string" && soil.trim()) return soil;

  const properties = getSoilProperties(report);
  return getTextProperty(properties, ["Classe texturale (USDA)", "USDA Texture Class"], "—");
}

function FarmCard({
  farm,
  lastAnalysis,
  reportCount,
  isSelected,
  onClick,
}: {
  farm: Farm;
  lastAnalysis: AnalysisReport | undefined;
  reportCount: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full  border p-4 text-left transition-all ${
        isSelected
          ? "border-slate-300 bg-slate-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {farm.name}
            {reportCount > 0 ? ` - ${reportCount} Secteurs` : ""}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Last Analysis: {formatDate(lastAnalysis?.created_at)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {farm.commune || farm.region || "Commune non renseignée"}
          </p>
        </div>
        <EllipsisVertical size={18} className="mt-1 text-slate-400" />
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className=" border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center  bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
      {label}
    </span>
  );
}

function DetailMap({ farm }: { farm: Farm }) {
  return (
    <div className="relative mx-auto h-60 w-60 overflow-hidden  border border-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.75), rgba(255,255,255,0.05) 35%, transparent 36%), linear-gradient(135deg, #dbeafe 0%, #ecfccb 45%, #fef3c7 100%)",
        }}
      />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-4 top-10 h-px w-44 bg-slate-300 rotate-12" />
        <div className="absolute left-2 top-24 h-px w-52 bg-slate-300 -rotate-12" />
        <div className="absolute left-10 top-44 h-px w-40 bg-slate-300 rotate-45" />
        <div className="absolute right-10 top-12 h-52 w-px bg-slate-300 rotate-12" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <MapPin size={42} className="text-blue-600 drop-shadow-lg" />
          <div className="absolute inset-x-1/2 top-10 h-10 w-10 -translate-x-1/2  bg-blue-600/15 blur-xl" />
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2  bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
        {farm.commune || farm.region || "Central"}
      </div>
    </div>
  );
}

function AnalysisHistoryTable({
  reports,
}: {
  reports: AnalysisReport[];
}) {
  return (
    <div className=" border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-black text-slate-900">
          Historique des Analyses
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-sm text-slate-500">
              <th className="border-b border-slate-200 px-5 py-4 font-semibold">
                Date
              </th>
              <th className="border-b border-slate-200 px-5 py-4 font-semibold">
                Type de Culture
              </th>
              <th className="border-b border-slate-200 px-5 py-4 font-semibold">
                Rendement Prévu
              </th>
              <th className="border-b border-slate-200 px-5 py-4 font-semibold">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map((report) => (
                <tr key={report.id} className="text-slate-800">
                  <td className="border-b border-slate-100 px-5 py-4">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    {getTopCropName(report)}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    {getYieldLabel(report)}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    <StatusBadge label={getStatusLabel(report)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  Aucune analyse enregistrée pour cette ferme.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FarmsPage() {
  if (!ENABLE_MANAGEMENT) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-600">
            Development
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">My Farms</h1>
          <p className="mt-3 text-sm text-slate-600">
            This management area is behind a feature flag while the Senegal
            analysis flow remains the public-facing feature.
          </p>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedFarmReports, setSelectedFarmReports] = useState<
    AnalysisReport[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [farmList, reportList] = await Promise.all([
          listFarms(),
          listAnalysisReports(),
        ]);
        setFarms(farmList);
        setReports(reportList);
        setSelectedFarmId((current) => current ?? farmList[0]?.id ?? null);
      } catch (err) {
        console.error("Failed to load farms page data:", err);
        setError("Impossible de charger les fermes.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedFarmId) {
      setSelectedFarm(null);
      setSelectedFarmReports([]);
      return;
    }

    const loadSelectedFarm = async () => {
      try {
        setDetailLoading(true);
        const [farm, farmReports] = await Promise.all([
          getFarm(selectedFarmId),
          listFarmReports(selectedFarmId),
        ]);
        setSelectedFarm(farm);
        setSelectedFarmReports(farmReports);
      } catch (err) {
        console.error("Failed to load selected farm:", err);
        setError("Impossible de charger le détail de la ferme.");
      } finally {
        setDetailLoading(false);
      }
    };

    loadSelectedFarm();
  }, [selectedFarmId]);

  const reportByFarm = useMemo(() => {
    return reports.reduce<Map<number, AnalysisReport[]>>((acc, report) => {
      const bucket = acc.get(report.farm_id) || [];
      bucket.push(report);
      acc.set(report.farm_id, bucket);
      return acc;
    }, new Map());
  }, [reports]);

  const filteredFarms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return farms;
    return farms.filter((farm) =>
      [farm.name, farm.region, farm.commune]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [farms, search]);

  const selectedFarmSummaryReport = selectedFarmReports[0] || null;
  const soilProperties = getSoilProperties(selectedFarmSummaryReport);
  const farmsToRender = filteredFarms.map((farm) => {
    const farmReports = reportByFarm.get(farm.id) || [];
    return {
      farm,
      reportCount: farmReports.length,
      lastAnalysis: farmReports[0],
    };
  });

  const hasFarms = farms.length > 0;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto grid max-w-400 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className=" border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Mes Fermes
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {selectedFarm
                  ? `${selectedFarm.name} · ${selectedFarmReports.length} secteur${selectedFarmReports.length === 1 ? "" : "s"}`
                  : "Sélectionnez une ferme pour afficher ses analyses"}
              </p>
            </div>
            <button className="inline-flex items-center gap-2  bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
              <Plus size={16} />
              Rechercher
            </button>
          </div>

          <label className="mb-5 flex items-center gap-3  border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une commune..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <div className="h-24  bg-slate-100 animate-pulse" />
                <div className="h-24  bg-slate-100 animate-pulse" />
                <div className="h-24  bg-slate-100 animate-pulse" />
              </div>
            ) : error ? (
              <div className=" border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : hasFarms ? (
              farmsToRender.length > 0 ? (
                farmsToRender.map(({ farm, lastAnalysis, reportCount }) => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    lastAnalysis={lastAnalysis}
                    reportCount={reportCount}
                    isSelected={farm.id === selectedFarmId}
                    onClick={() => setSelectedFarmId(farm.id)}
                  />
                ))
              ) : (
                <div className=" border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Aucun résultat pour cette recherche.
                </div>
              )
            ) : (
              <div className=" border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Aucune ferme enregistrée pour le moment.
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-6">
          <div className=" border border-slate-200 bg-white p-6 shadow-sm">
            {detailLoading || !selectedFarm ? (
              <div className="space-y-4">
                <div className="h-8 w-1/3  bg-slate-100 animate-pulse" />
                <div className="h-5 w-1/4  bg-slate-100 animate-pulse" />
                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-20  bg-slate-100 animate-pulse" />
                    <div className="h-20  bg-slate-100 animate-pulse" />
                    <div className="h-20  bg-slate-100 animate-pulse" />
                  </div>
                  <div className="h-60  bg-slate-100 animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">
                      {selectedFarm.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedFarm.commune || selectedFarm.region || "Ferme Principale"}
                    </p>
                  </div>

                  <DetailMap farm={selectedFarm} />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MetricCard
                    label="AREA YEE TOTAL"
                    value={
                      selectedFarm.area_ha
                        ? `${new Intl.NumberFormat("fr-FR", {
                            maximumFractionDigits: 1,
                          }).format(selectedFarm.area_ha)} ha`
                        : "27.8 m²"
                    }
                  />
                  <MetricCard
                    label="TEXTURE DOMINANTE"
                    value={getTextureLabel(selectedFarmSummaryReport)}
                    valueClassName="text-slate-800"
                  />
                  <MetricCard
                    label="AZOTE (N)"
                    value={getTextProperty(soilProperties, [
                      "Nitrogen, total",
                      "Nitrogen",
                    ])}
                  />
                  <MetricCard
                    label="PHOSPHORE (P)"
                    value={getTextProperty(soilProperties, [
                      "Phosphorus, extractable",
                      "Phosphorus",
                    ])}
                  />
                  <MetricCard
                    label="POTASSIUM (K)"
                    value={getTextProperty(soilProperties, [
                      "Potassium, extractable",
                      "Potassium",
                    ])}
                  />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <MetricCard
                    label="Contenu en pierres"
                    value={getTextProperty(soilProperties, [
                      "Stone content",
                    ])}
                    valueClassName="text-slate-800 text-base"
                  />
                  <MetricCard
                    label="Contenu en pierroit"
                    value={getTextProperty(soilProperties, [
                      "Bulk density, <2mm fraction",
                    ])}
                    valueClassName="text-slate-800 text-base"
                  />
                  <MetricCard
                    label="Capacité d'Echange (CEC)"
                    value={getTextProperty(soilProperties, [
                      "Effective Cation Exchange Capacity",
                      "Cation Exchange Capacity",
                    ])}
                    valueClassName="text-slate-800 text-base"
                  />
                </div>
              </>
            )}
          </div>

          <AnalysisHistoryTable reports={selectedFarmReports} />

          <button
            onClick={() => navigate("/")}
            className="w-full  bg-blue-700 px-5 py-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            ** [ + Lancer une Nouvelle Analyse Ici ]
          </button>
        </section>
      </div>
    </div>
  );
}
