
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-pulse opacity-40"></div>
        <div className="relative bg-white p-5 rounded-full shadow-sm border border-green-100">
          <svg
            className="w-10 h-10 text-green-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-3">
        Analyse de parcelle
      </h3>

      <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
        Cliquez sur une zone du Senegal pour lancer une
        <span className="text-green-700 font-semibold">
          {' '}analyse environnementale{' '}
        </span>
        basée sur les données de sol et les tendances climatiques locales.
      </p>

      <p className="text-[11px] text-slate-400 mt-6 uppercase tracking-wide">
        Sol • Climat • Risque • Culture optimale
      </p>
    </div>
  );
};

export default EmptyState;
