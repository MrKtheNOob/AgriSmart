import { ArrowDown, ArrowRight, ArrowUpRight, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Shared utility strings keep repeated editorial elements consistent.
const styles = {
  "container": "mx-auto w-[calc(100%-2.5rem)] max-w-[77.5rem] sm:w-[calc(100%-3rem)] min-[901px]:w-[calc(100%-7rem)]",
  "eyebrow": "mb-6.5 text-[9px] leading-[1.7] font-bold tracking-[1.2px] sm:text-[10px] sm:tracking-[1.7px]",
  "brand": "inline-flex items-center gap-2 text-[22px] font-bold tracking-[-1px] sm:text-2xl [&_span]:ml-1 [&_span]:font-normal [&_span]:text-terra",
  "button": "inline-flex items-center justify-between gap-7.5 border border-ink bg-ink px-6 py-4.5 text-[13px] font-semibold text-[#fff] transition-colors duration-150 hover:bg-green-600",
  "link": "mt-6 inline-flex items-center gap-6.5 border-b border-current pb-2 text-[13px]",
  "landing": "bg-paper font-sans text-ink [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-terra [&_a:focus-visible]:outline-offset-5 [&_textarea:focus-visible]:outline-3 [&_textarea:focus-visible]:outline-terra [&_textarea:focus-visible]:outline-offset-5 [&_h1]:font-serif [&_h1]:font-normal [&_h1]:tracking-[-2.5px] [&_h2]:mb-5.5 [&_h2]:font-serif [&_h2]:text-[clamp(34px,3.5vw,49px)] [&_h2]:leading-[1.16] [&_h2]:font-normal [&_h2]:tracking-[-1.6px] [&_em]:font-normal [&_em]:text-olive motion-reduce:[&_*]:transition-none",
  "landing-skip": "absolute -top-24 z-[100] bg-paper p-4 focus:top-2.5",
  "landing-header": "flex min-h-20 flex-wrap items-center justify-between gap-3.5 border-b border-line py-4.5 sm:min-h-25 sm:flex-nowrap sm:gap-6 sm:py-0 [&_nav]:order-3 [&_nav]:flex [&_nav]:w-full [&_nav]:gap-6 [&_nav]:text-xs sm:[&_nav]:order-none sm:[&_nav]:w-auto sm:[&_nav]:gap-8 sm:[&_nav]:text-[13px] [&_nav_a:hover]:underline [&_nav_a]:underline-offset-6",
  "landing-nav-cta": "flex items-center gap-2 border-b border-ink py-2.5 text-[11px] font-bold sm:gap-4.5 sm:text-[13px]",
  "landing-hero": "grid grid-cols-1 items-center gap-8 pt-10 sm:grid-cols-[1.04fr_1fr] sm:gap-6.5 sm:pt-12 min-[901px]:gap-9.5 min-[901px]:pt-18 min-[1500px]:pt-22.5",
  "landing-hero-copy": "[&_h1]:mb-6.5 [&_h1]:text-[clamp(45px,11vw,65px)] [&_h1]:leading-[1.04] sm:[&_h1]:text-[55px] min-[901px]:[&_h1]:text-[clamp(52px,5.7vw,82px)] [&>p:first-child]:flex [&>p:first-child]:items-center [&>p:first-child]:gap-2 [&>p:first-child>span]:size-1.5 [&>p:first-child>span]:shrink-0 [&>p:first-child>span]:bg-terra",
  "landing-intro": "mb-7.5 max-w-[25.625rem] text-[15px] leading-[1.8] text-muted sm:text-base",
  "landing-hero-note": "mt-3.5 text-[10px] text-muted",
  "landing-field": "m-0 border border-[#d2cbb9] bg-[#e7dec9] sm:rotate-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&_figcaption]:flex [&_figcaption]:justify-between [&_figcaption]:gap-3.5 [&_figcaption]:bg-[#ece5d5] [&_figcaption]:p-3 [&_figcaption]:font-mono [&_figcaption]:text-[9px] [&_figcaption]:tracking-[.6px] min-[901px]:[&_figcaption]:px-5 min-[901px]:[&_figcaption]:py-4 [&_figcaption>span:first-child]:font-serif [&_figcaption>span:first-child]:text-sm [&_figcaption>span:first-child]:tracking-normal [&_figcaption>span:last-child]:hidden min-[901px]:[&_figcaption>span:last-child]:block",
  "landing-field-top": "flex justify-between gap-3.5 border-b border-[#cec7b5] p-3 font-mono text-[7px] tracking-[.6px] min-[901px]:px-5 min-[901px]:py-4 min-[901px]:text-[9px]",
  "landing-scroll": "col-span-full flex items-center gap-3.5 pb-7 text-[9px] tracking-[1.5px] sm:pt-5 sm:pb-9",
  "landing-premise": "bg-green-50 py-12.5 sm:py-16",
  "landing-premise-grid": "grid grid-cols-1 gap-6 sm:grid-cols-[1fr_2fr] sm:gap-9 [&>div>p]:max-w-[35.625rem] [&>div>p]:text-[15px] [&>div>p]:leading-[1.85] [&>div>p]:text-[#56604e]",
  "landing-method": "scroll-mt-7.5 py-14 sm:py-22.5",
  "landing-section-heading": "mb-6 sm:mb-11 sm:flex sm:items-start sm:justify-between sm:gap-10 sm:[&_h2]:w-2/3",
  "landing-steps": "grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-0 [&_article]:border-t [&_article]:border-ink [&_article]:pt-5 sm:[&_article]:pt-6 sm:[&_article]:pr-8 sm:[&_article+article]:border-l sm:[&_article+article]:border-l-line sm:[&_article+article]:pl-8 [&_h3]:mt-4 [&_h3]:mb-3.5 [&_h3]:text-[19px] [&_h3]:font-medium [&_h3]:tracking-[-.6px] sm:[&_h3]:mt-7.5 [&_p]:text-sm [&_p]:leading-[1.85] [&_p]:text-muted",
  "landing-step-number": "font-serif text-[31px] text-[#89916b]",
  "landing-evidence": "bg-[#243e31] py-12.5 text-paper sm:pt-20 sm:pb-8 [&_h2_em]:text-[#c5cb9b]",
  "landing-evidence-grid": "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10 min-[901px]:gap-22.5 [&>div>p:first-child]:text-[#b5c19c] [&>div>p:not(:first-child)]:max-w-[26.25rem] [&>div>p:not(:first-child)]:text-sm [&>div>p:not(:first-child)]:leading-[1.9] [&>div>p:not(:first-child)]:text-[#cad2c5]",
  "landing-evidence-list": "m-0 [&>div]:border-t [&>div]:border-[#62705b] [&>div]:pt-5 [&>div]:pb-6 [&_dt]:font-serif [&_dt]:text-[25px] [&_dt_span]:mb-3 [&_dt_span]:block [&_dt_span]:font-sans [&_dt_span]:text-[9px] [&_dt_span]:tracking-[1.5px] [&_dt_span]:text-[#c5cb9b] [&_dd]:mt-2.5 [&_dd]:text-[13px] [&_dd]:leading-[1.8] [&_dd]:text-[#cad2c5]",
  "landing-limits": "mt-12 grid grid-cols-1 gap-6 border-t border-[#62705b] pt-6 sm:grid-cols-[1fr_3fr] sm:gap-5 [&_span]:pt-1 [&_span]:text-[9px] [&_span]:tracking-[1.3px] [&_span]:text-[#c5cb9b] [&_p]:m-0 [&_p]:text-xs [&_p]:leading-[1.8] [&_p]:text-[#cad2c5]",
  "landing-next": "py-14 text-center sm:py-22 [&>p:not(:first-child)]:mx-auto [&>p:not(:first-child)]:max-w-[33.4375rem] [&>p:not(:first-child)]:text-sm [&>p:not(:first-child)]:leading-[1.85] [&>p:not(:first-child)]:text-muted",
  "landing-feedback": "scroll-mt-5 bg-[#e9e3d4] py-12.5 sm:py-19",
  "landing-feedback-grid": "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10 min-[901px]:gap-25 [&>div>p:not(:first-child)]:max-w-[27.5rem] [&>div>p:not(:first-child)]:text-sm [&>div>p:not(:first-child)]:leading-[1.8] [&>div>p:not(:first-child)]:text-[#626759]",
  "landing-feedback-form": "pt-4 [&_label]:mb-4.5 [&_label]:block [&_label]:text-[17px] [&_label]:leading-[1.6] [&_textarea]:mb-5 [&_textarea]:block [&_textarea]:min-h-40 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-none [&_textarea]:border [&_textarea]:border-[#969e89] [&_textarea]:bg-paper [&_textarea]:p-4 [&_textarea]:font-sans [&_textarea]:text-sm [&_textarea]:leading-[1.7] [&>p]:text-[11px]!",
  "landing-footer": "flex flex-wrap items-center justify-between gap-5 py-7.5 sm:flex-nowrap [&>p]:order-3 [&>p]:w-full [&>p]:font-serif [&>p]:text-[15px] [&>p]:text-muted [&>p]:italic sm:[&>p]:order-none sm:[&>p]:w-auto [&>a:last-child]:flex [&>a:last-child]:items-center [&>a:last-child]:gap-2.5 [&>a:last-child]:text-[11px]"
}

const steps = [
  ['01', 'Situez votre terrain.', 'Choisissez un point sur la carte du Sénégal. L’analyse associe les données de sol disponibles au profil climatique historique de la station la plus proche.'],
  ['02', 'Comprenez ses conditions.', 'Explorez la texture du sol, ses propriétés, sa capacité estimée à retenir l’eau et les variations mensuelles du climat.'],
  ['03', 'Comparez vos possibilités.', 'Découvrez trois cultures classées par adéquation au sol et aux températures pendant leur durée de croissance, à partir du mois actuel.'],
]

/** A deliberately illustrative field drawing, not a satellite image or measured parcel. */
function FieldIllustration() {
  return (
    <figure className={styles["landing-field"]}>
      <div className={styles["landing-field-top"]}><span>REGARDER LE TERRAIN AUTREMENT</span><span>SÉNÉGAL / SN</span></div>
      <svg viewBox="0 0 600 510" role="img" aria-label="Illustration de parcelles agricoles et de leurs lignes de culture">
        <defs>
          <pattern id="field-rows" width="17" height="17" patternUnits="userSpaceOnUse" patternTransform="rotate(-27)">
            <rect width="17" height="17" fill="#b9bc86" />
            <path d="M 3 0 V 17" stroke="#68744b" strokeWidth="3" />
          </pattern>
          <pattern id="field-furrows" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(34)">
            <rect width="22" height="22" fill="#d3b783" />
            <path d="M 5 0 V 22" stroke="#b3925f" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="600" height="510" fill="#e7dec9" />
        <path d="M-40 160 Q160 130 245 -40 M-30 195 Q190 159 284 -35 M-20 225 Q205 200 320 -20 M-15 250 Q240 233 355 -10" fill="none" stroke="#c6c3a8" strokeWidth="1.5" />
        <path d="M-20 285 L181 192 L323 308 L224 535 L-20 510Z" fill="url(#field-rows)" stroke="#efe8d8" strokeWidth="9" />
        <path d="M192 184 L320 42 L560 138 L329 297Z" fill="#81906b" stroke="#efe8d8" strokeWidth="9" />
        <path d="M344 310 L580 151 L638 347 L441 460Z" fill="url(#field-furrows)" stroke="#efe8d8" strokeWidth="9" />
        <path d="M332 330 L430 473 L598 552 L238 553Z" fill="#a6ac79" stroke="#efe8d8" strokeWidth="9" />
        {Array.from({ length: 9 }, (_, index) => (
          <path key={index} d={`M${225 + index * 13} ${157 - index * 13} l135 55`} stroke="#a3ac85" strokeWidth="4" />
        ))}
        <path d="M620 1 C420 8 530 70 590 95 S540 120 630 174" fill="none" stroke="#a8beb7" strokeWidth="24" />
        <path d="M182 192 L323 308 L224 535 M323 308 L580 151" stroke="#faf5e8" strokeWidth="4" fill="none" strokeDasharray="5 8" />
        <circle cx="325" cy="306" r="23" fill="#f7f3e9" fillOpacity=".5" />
        <circle cx="325" cy="306" r="9" fill="#234b38" stroke="#faf5e8" strokeWidth="3" />
        <path d="M325 278 V223 H443" fill="none" stroke="#234b38" strokeWidth="1.5" />
        <rect x="396" y="196" width="162" height="44" fill="#f7f3e9" />
        <text x="412" y="223" fill="#234b38" fontSize="14" fontFamily="monospace">Tout part d’ici.</text>
        <path d="M46 55 V99 M39 64 L46 55 L53 64" fill="none" stroke="#234b38" strokeWidth="1.5" />
        <text x="41" y="44" fill="#234b38" fontSize="12" fontFamily="monospace">N</text>
      </svg>
      <figcaption><span>Le sol. Le climat. Vos possibilités.</span><span>ILLUSTRATION</span></figcaption>
    </figure>
  )
}

/** Public introduction; the analysis workspace is available separately at /analyse. */
export default function LandingPage() {
  // Anchor navigation is smooth only on this page, unless reduced motion is requested.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('scroll-smooth', 'motion-reduce:scroll-auto')
    return () => root.classList.remove('scroll-smooth', 'motion-reduce:scroll-auto')
  }, [])

  const [feedback, setFeedback] = useState('')
  const feedbackUrl = `https://github.com/MrKtheNOob/AgriSmart/issues/new?${new URLSearchParams({
    title: 'Retour sur AgriSmart',
    body: `## Mon besoin ou mon retour\n\n${feedback.trim()}\n\n## Ce qui pourrait m’aider davantage\n\n`,
  })}`

  return (
    <div className={styles["landing"]}>
      <a className={styles["landing-skip"]} href="#contenu">Aller au contenu</a>
      <header className={styles["landing-header"] + ' ' + styles["container"]}>
        <Link to="/" className={styles["brand"]} aria-label="AgriSmart, accueil"><Sprout size={27} strokeWidth={1.6} /> AgriSmart<span> / </span></Link>
        <nav aria-label="Navigation principale"><a href="#methode">La méthode</a><a href="#retours">Vos retours</a></nav>
        <Link to="/analyse" className={styles["landing-nav-cta"]}>Ouvrir la carte <ArrowUpRight size={17} /></Link>
      </header>

      <main id="contenu">
        <section className={styles["landing-hero"] + ' ' + styles["container"]} aria-labelledby="hero-title">
          <div className={styles["landing-hero-copy"]}>
            <p className={styles["eyebrow"]}><span /> AIDE À LA DÉCISION AGRICOLE · SÉNÉGAL</p>
            <h1 id="hero-title">Avant de planter,<br />comprenez<br /><em>votre terrain.</em></h1>
            <p className={styles["landing-intro"]}>Chaque terrain a ses possibilités. Croisez les données de sol et de climat pour choisir vos cultures avec des repères concrets.</p>
            <Link to="/analyse" className={styles["button"]}>Explorer mon terrain <ArrowUpRight size={21} /></Link>
            <p className={styles["landing-hero-note"]}>Version exploratoire · Accès libre, sans inscription</p>
          </div>
          <FieldIllustration />
          <a href="#methode" className={styles["landing-scroll"]}><ArrowDown size={16} /> DE LA DONNÉE À LA DÉCISION</a>
        </section>

        <section className={styles["landing-premise"]}>
          <div className={styles["container"] + ' ' + styles["landing-premise-grid"]}>
            <p className={styles["eyebrow"]}>UNE QUESTION DE TERRAIN</p>
            <div><h2>« Qu’est-ce que je peux<br />cultiver ici, et pourquoi ? »</h2><p>Vous préparez une mise en culture ou explorez le potentiel agricole d’un terrain avant une acquisition ? AgriSmart vous aide à comprendre les conditions locales avant d’engager du temps et des moyens.</p></div>
          </div>
        </section>

        <section id="methode" className={styles["landing-method"] + ' ' + styles["container"]} aria-labelledby="method-title">
          <div className={styles["landing-section-heading"]}><p className={styles["eyebrow"]}>COMMENT ÇA MARCHE</p><h2 id="method-title">Un point sur la carte.<br />Des raisons pour décider.</h2></div>
          <div className={styles["landing-steps"]}>{steps.map(([number, title, description]) => <article key={number}><span className={styles["landing-step-number"]}>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>

        <section className={styles["landing-evidence"]} aria-labelledby="evidence-title">
          <div className={styles["container"] + ' ' + styles["landing-evidence-grid"]}>
            <div><p className={styles["eyebrow"]}>DES REPÈRES, PAS UNE BOÎTE NOIRE</p><h2 id="evidence-title">Les données éclairent.<br /><em>Vous décidez.</em></h2><p>Le classement est calculé à partir des exigences des cultures. L’IA intervient ensuite pour expliquer les résultats en français, avec l’appui d’une base documentaire agronomique.</p><Link to="/analyse" className={styles["link"]}>Voir ce que révèle un terrain <ArrowRight size={19} /></Link></div>
            <dl className={styles["landing-evidence-list"]}>
              <div><dt><span>01 / SOL</span>Ce que le terrain offre</dt><dd>pH, texture, nutriments et estimation de la rétention d’eau, à partir des données iSDAsoil.</dd></div>
              <div><dt><span>02 / CLIMAT</span>Le rythme des saisons</dt><dd>Températures, précipitations et humidité mensuelles historiques. Le score climatique utilise actuellement la température.</dd></div>
              <div><dt><span>03 / CULTURES</span>Une comparaison expliquée</dt><dd>Trois cultures, des scores sol et climat, puis une explication contextualisée. Les scores indiquent une adéquation, pas une probabilité de réussite.</dd></div>
            </dl>
          </div>
          <div className={styles["container"] + ' ' + styles["landing-limits"]}><span>À GARDER EN TÊTE</span><p>Le climat présenté est historique : ce n’est pas une prévision météo. Cette première lecture complète l’observation du terrain et le conseil agronomique ; elle ne constitue ni une analyse de laboratoire ni une garantie de rendement ou de rentabilité.</p></div>
        </section>

        <section className={styles["landing-next"] + ' ' + styles["container"]}><p className={styles["eyebrow"]}>LA SUITE, EN PRÉPARATION</p><h2>Et si vous pouviez comparer<br /><em>les mois de plantation ?</em></h2><p>Une vue saisonnière pour explorer les cultures selon le mois de départ et repérer les périodes moins favorables. Vos besoins nous aideront à construire cette prochaine étape.</p><a href="#retours" className={styles["link"]}>Dire ce qui me serait utile <ArrowDown size={18} /></a></section>

        <section id="retours" className={styles["landing-feedback"]} aria-labelledby="feedback-title"><div className={styles["container"] + ' ' + styles["landing-feedback-grid"]}>
          <div><p className={styles["eyebrow"]}>CONSTRUISONS À PARTIR DU RÉEL</p><h2 id="feedback-title">Votre terrain.<br />Vos questions.<br /><em>La prochaine étape.</em></h2><p>Exploitant, conseiller, porteur de projet ou simplement curieux : racontez-nous la décision que vous cherchez à prendre. Ce qui manque nous intéresse autant que ce qui fonctionne.</p></div>
          <div className={styles["landing-feedback-form"]}><label htmlFor="landing-feedback">Qu’aimeriez-vous pouvoir décider avec AgriSmart ?</label><textarea id="landing-feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1500} rows={5} placeholder="J’ai un terrain et j’aimerais comprendre…" /><a className={styles["button"]} href={feedbackUrl} target="_blank" rel="noopener noreferrer">Partager mon retour <ArrowUpRight size={19} /></a><p>Ouvre une issue GitHub préremplie. Un compte GitHub est nécessaire ; votre retour sera public après publication. Évitez les informations personnelles.</p></div>
        </div></section>
      </main>
      <footer className={styles["landing-footer"] + ' ' + styles["container"]}><Link to="/" className={styles["brand"]}><Sprout size={23} /> AgriSmart<span> / </span></Link><p>Comprendre avant de cultiver.</p><a href="https://github.com/MrKtheNOob/AgriSmart" target="_blank" rel="noopener noreferrer">Le projet sur GitHub <ArrowUpRight size={15} /></a></footer>
    </div>
  )
}
