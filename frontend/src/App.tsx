import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from 'react'
import LandingPage from './pages/LandingPage'

// The public page does not need to download Leaflet or geographic datasets.
const WorkspaceLayout = lazy(() => import('./layouts/WorkspaceLayout'))
const MapPage = lazy(() => import('./pages/MapPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p role="status" className="p-8">Chargement de la carte…</p>}>
      <Routes>
        <Route index element={<LandingPage />} />
        <Route element={<WorkspaceLayout />}>
          <Route path="analyse" element={<MapPage />} />


        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
