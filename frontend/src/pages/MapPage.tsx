import { useEffect, useMemo, useRef, useState } from "react";
import SenegalMap from "../components/Map";
import Sidebar from "../components/Sidebar";
import BottomSheet from "../components/BottomSheet";
import { BASE_URL } from "../utils";
import { useMapLogic } from "../hooks/useMapLogic";
import { getTelemetrySessionId, sendTelemetryDownload } from "../services/telemetry";

export default function MapPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement | null>(null);
  const {
    markerPosition,
    locationName,
    recommendation,
    loading,
    error,
    status,
    handleMapClick,
    triggerAnalysis,
    clearRecommendation,
  } = useMapLogic();
  const telemetrySessionId = useMemo(() => getTelemetrySessionId(), []);

  useEffect(() => {
    fetch(BASE_URL + "/health")
      .then((res) => res.json())
      .then((data) => console.log("API Health:", data))
      .catch((err) => console.error("API Health Check Failed:", err));
  }, []);

  useEffect(() => {
    if (markerPosition || recommendation || loading) {
      setIsDrawerOpen(true);
    }
  }, [markerPosition, recommendation, loading]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    clearRecommendation();
  };

  const handleDownloadPdf = async () => {
    if (!recommendation || !markerPosition || !pdfReportRef.current) return;

    await sendTelemetryDownload(telemetrySessionId, {
      lat: markerPosition[0],
      lng: markerPosition[1],
      data: {
        location_name: locationName,
        report_type: "analysis_pdf",
      },
    }).catch((error) => {
      console.error("Failed to log telemetry download:", error);
    });

    const printWindow = window.open("", "_blank", "width=1200,height=1600");
    if (!printWindow) {
      throw new Error("Unable to open print window");
    }

    const reportHtml = pdfReportRef.current.outerHTML;
    const styleNodes = Array.from(document.head.querySelectorAll("style, link[rel='stylesheet']"));
    const styleMarkup = styleNodes
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${locationName || "Agrismart"} - Analysis Report</title>
          ${styleMarkup}
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              width: 210mm;
            }
            .print-root {
              width: 190mm;
              margin: 0 auto;
            }
            .print-root button {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-root">${reportHtml}</div>
        </body>
      </html>`);
    printWindow.document.close();

    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };

    if (printWindow.document.readyState === "complete") {
      triggerPrint();
    } else {
      printWindow.onload = triggerPrint;
    }
  };

  return (
    <div className="flex flex-col h-full md:flex-row">
      <div className="grow md:w-7/12 lg:w-3/4 h-[50vh] md:h-full relative border-r border-slate-200">
        <SenegalMap onMapClick={handleMapClick} markerPosition={markerPosition} />
      </div>

      <aside className="hidden md:block md:w-5/12 lg:w-1/4 bg-white shadow-xl z-10 overflow-y-auto">
        <Sidebar
          loading={loading}
          error={error}
          recommendation={recommendation}
          markerPosition={markerPosition}
          locationName={locationName}
          status={status}
          onClear={clearRecommendation}
          fetchAnalysis={triggerAnalysis}
          onDownloadPdf={handleDownloadPdf}
        />
      </aside>

      {recommendation ? (
        <div className="fixed -left-[10000px] top-0 w-[794px] bg-white pointer-events-none" aria-hidden="true">
          <Sidebar
            loading={loading}
            error={error}
            recommendation={recommendation}
            markerPosition={markerPosition}
            locationName={locationName}
            status={status}
            onClear={handleCloseDrawer}
            fetchAnalysis={triggerAnalysis}
            variant="pdf"
            containerRef={pdfReportRef}
          />
        </div>
      ) : null}

      <BottomSheet isOpen={isDrawerOpen} onClose={handleCloseDrawer}>
        <div className="relative min-h-75">
          <Sidebar
            loading={loading}
            error={error}
            recommendation={recommendation}
            markerPosition={markerPosition}
            locationName={locationName}
            status={status}
            onClear={handleCloseDrawer}
            fetchAnalysis={triggerAnalysis}
            onDownloadPdf={handleDownloadPdf}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
