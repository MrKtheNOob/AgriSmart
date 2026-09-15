import { useEffect, useState } from 'react';
import { BASE_URL } from '../utils';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sprout } from 'lucide-react';

export default function Navbar() {
  const [testerCount, setTesterCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`${BASE_URL}/telemetry/count`);
        if (!response.ok) throw new Error('Unable to fetch tester count');
        const data = await response.json();
        if (!Number.isInteger(data.count) || data.count < 0) {
          throw new Error('Invalid tester count');
        }
        setTesterCount(data.count);
      } catch (err) {
        console.error('Failed to fetch telemetry count:', err);
      }
    };

    fetchCount();
    // Refresh every minute to stay updated
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="border-b border-line px-1 py-[3px] md:px-3.5 md:py-2.5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3 lg:min-h-16 lg:grid-cols-[1fr_auto_1fr] lg:py-0">
          <Link to="/" className="flex items-center gap-[9px] text-[22px] font-bold tracking-[-1px] md:text-2xl" aria-label="AgriSmart, retour à l’accueil">
            <Sprout size={27} strokeWidth={1.6} /> AgriSmart <span className="font-normal text-terra">/</span>
          </Link>
          <div className="hidden text-center lg:block"><span className="text-[9px] tracking-[2px]">CARNET DE TERRAIN</span><p className="mt-[3px] font-serif text-[17px] italic">Comprendre avant de cultiver.</p></div>

          <Link to="/#retours" className="flex items-center justify-self-end gap-2 border-b border-ink pb-2 text-xs">Vos retours <ArrowUpRight size={16} /></Link>
          <p className="col-span-2 text-xs font-medium text-green-700 lg:col-span-3 lg:pb-2 lg:text-right" aria-live="polite">
            {testerCount === null
              ? 'Nombre de testeurs indisponible pour le moment'
              : `${testerCount.toLocaleString('fr-FR')} ${testerCount === 1 ? 'testeur actif' : 'testeurs actifs'}`}
          </p>
        </div>
      </div>
    </nav>
  );
}
