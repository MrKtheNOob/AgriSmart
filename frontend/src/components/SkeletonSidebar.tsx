
const SkeletonSidebar = () => {
  return (
    <div className="space-y-8 animate-pulse p-2">
      <div className="border-b border-slate-100 pb-6">
        <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
        <div className="h-10 w-48 bg-slate-300 rounded-lg mb-4"></div>
      </div>
      <section className="space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded"></div>
        <div className="h-24 w-full bg-slate-100 rounded-xl"></div>
      </section>
      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-slate-200 rounded"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
        </div>
      </section>
    </div>
  );
};

export default SkeletonSidebar;
