import { createPortal } from "react-dom";
import type { Farm } from "../../services/management";

interface SaveAnalysisModalProps {
  isOpen: boolean;
  loading: boolean;
  farms: Farm[];
  selectedFarmId: string;
  newFarmName: string;
  sectorName: string;
  saveError: string | null;
  saveSuccess: string | null;
  onClose: () => void;
  onSelectedFarmIdChange: (value: string) => void;
  onNewFarmNameChange: (value: string) => void;
  onSectorNameChange: (value: string) => void;
  onSave: () => void;
}

export default function SaveAnalysisModal({
  isOpen,
  loading,
  farms,
  selectedFarmId,
  newFarmName,
  sectorName,
  saveError,
  saveSuccess,
  onClose,
  onSelectedFarmIdChange,
  onNewFarmNameChange,
  onSectorNameChange,
  onSave,
}: SaveAnalysisModalProps) {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-3000 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl border border-slate-100 p-6">
        <ModalHeader onClose={onClose} />

        <div className="space-y-4">
          <FarmSelect
            farms={farms}
            selectedFarmId={selectedFarmId}
            onSelectedFarmIdChange={onSelectedFarmIdChange}
          />

          <NewFarmNameInput
            isVisible={selectedFarmId === "new"}
            value={newFarmName}
            onChange={onNewFarmNameChange}
          />

          <SectorNameInput value={sectorName} onChange={onSectorNameChange} />
        </div>

        <SaveStatusMessages saveError={saveError} saveSuccess={saveSuccess} />

        <ModalActions loading={loading} onClose={onClose} onSave={onSave} />
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}



interface ModalHeaderProps {
  onClose: () => void;
}

function ModalHeader({ onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h3 className="text-xl font-bold text-slate-900">
          Sauvegarder l&apos;analyse
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Choisissez une ferme existante ou créez-en une nouvelle.
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

interface FarmSelectProps {
  farms: Farm[];
  selectedFarmId: string;
  onSelectedFarmIdChange: (value: string) => void;
}

function FarmSelect({
  farms,
  selectedFarmId,
  onSelectedFarmIdChange,
}: FarmSelectProps) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
        Ferme
      </span>
      <select
        value={selectedFarmId}
        onChange={(e) => onSelectedFarmIdChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-500"
      >
        <option value="new">Créer une nouvelle ferme</option>
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name}
          </option>
        ))}
      </select>
    </label>
  );
}

interface NewFarmNameInputProps {
  isVisible: boolean;
  value: string;
  onChange: (value: string) => void;
}

function NewFarmNameInput({
  isVisible,
  value,
  onChange,
}: NewFarmNameInputProps) {
  if (!isVisible) return null;

  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
        Nom de la ferme
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ferme Principale"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-500"
      />
    </label>
  );
}

interface SectorNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

function SectorNameInput({ value, onChange }: SectorNameInputProps) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
        Nom du champ / secteur
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Secteur Nord"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-500"
      />
    </label>
  );
}

interface SaveStatusMessagesProps {
  saveError: string | null;
  saveSuccess: string | null;
}

function SaveStatusMessages({
  saveError,
  saveSuccess,
}: SaveStatusMessagesProps) {
  return (
    <>
      {saveError ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {saveSuccess}
        </p>
      ) : null}
    </>
  );
}

interface ModalActionsProps {
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
}

function ModalActions({ loading, onClose, onSave }: ModalActionsProps) {
  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Annuler
      </button>
      <button
        onClick={onSave}
        disabled={loading}
        className="flex-1 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}
