import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import MapPage from "./pages/MapPage";
import FarmsPage from "./pages/FarmsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WorkspaceLayout />}>
          <Route index element={<MapPage />} />
          <Route path="farms" element={<FarmsPage />} />
          
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
