/* ============================================================
   LAUNCHPAD — root app (stage scaling + wiring + tweaks)
   ============================================================ */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "space",
  "accent": "#38bdf8",
  "kidName": "Jake",
  "sound": true,
  "reduceMotion": false
}/*EDITMODE-END*/;

function useScale(ref) {
  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
      if (ref.current) ref.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
}

function Starfield() {
  const stars = React.useMemo(() =>
    Array.from({ length: 42 }, () => ({
      left: Math.random() * 100, top: Math.random() * 100,
      delay: (Math.random() * 4).toFixed(2), dur: (3 + Math.random() * 4).toFixed(2),
      sc: (0.5 + Math.random()).toFixed(2),
    })), []);
  return (
    <div className="starfield">
      {stars.map((s, i) => (
        <i key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`,
          animationDuration: `${s.dur}s`, transform: `scale(${s.sc})` }}></i>
      ))}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const stageRef = useRef(null);
  useScale(stageRef);

  const [app, setApp] = useState(null);        // {id, origin}
  const [play, setPlay] = useState(null);       // {origin, initialGame} or null
  const [parental, setParental] = useState(false);
  const [imp, setImp] = useState(false);
  const [mode, setMode] = useState("launchpad"); // 'launchpad' | 'windows'
  const [gate, setGate] = useState(false);        // PIN gate before windows

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
    document.documentElement.style.setProperty("--comet-cyan", t.accent);
    if (t.reduceMotion) document.documentElement.setAttribute("data-reduce", "");
    else document.documentElement.removeAttribute("data-reduce");
  }, [t.theme, t.accent, t.reduceMotion]);

  useEffect(() => { if (window.SFX) SFX.enabled = t.sound; }, [t.sound]);

  const openApp = (id, origin) => { window.SFX && SFX.open(); setApp({ id, origin }); };
  const openPlay = (origin, initialGame) => { window.SFX && SFX.launch(); setPlay({ origin, initialGame: initialGame || null }); };
  const openParental = () => { window.SFX && SFX.open(); setParental(true); };
  const openImport = () => { window.SFX && SFX.open(); setImp(true); };
  const launchDirect = (game, origin) => openPlay(origin, game);
  const openWindows = () => { window.SFX && SFX.select(); setGate(true); };
  const unlockWindows = () => { setGate(false); setMode("windows"); };
  const backToLaunchpad = () => { window.SFX && SFX.back(); setMode("launchpad"); };

  return (
    <div className="stage-wrap">
      <div className="stage" ref={stageRef}>
        {mode === "launchpad" && (
          <React.Fragment>
            {!t.reduceMotion && <Starfield />}
            <Desktop
              kidName={t.kidName}
              onOpenApp={openApp} onOpenPlay={openPlay} onOpenParental={openParental}
              onLaunchDirect={launchDirect} onOpenWindows={openWindows}
            />
          </React.Fragment>
        )}
        {mode === "windows" && (
          <WindowsDesktop
            kidName={t.kidName}
            onHome={backToLaunchpad} onOpenPlay={openPlay}
            onOpenParental={openParental} onLaunchDirect={(g) => launchDirect(g)}
          />
        )}

        {app && <AppShell app={{ id: app.id }} origin={app.origin} onClose={() => setApp(null)} />}
        {play && <PlayOverlay kidName={t.kidName} origin={play.origin} initialGame={play.initialGame}
          onExit={() => setPlay(null)} onOpenImport={openImport} />}
        {parental && <ParentalPanel kidName={t.kidName} onClose={() => setParental(false)} />}
        {imp && <ImportManager onClose={() => setImp(false)} />}
        {gate && <PinGate onUnlock={unlockWindows} onCancel={() => setGate(false)} />}
      </div>

      <TweaksPanel>
        <TweakSection label="Profil" />
        <TweakText label="Name" value={t.kidName} onChange={(v) => setTweak("kidName", v)} />
        <TweakSection label="Aussehen" />
        <TweakRadio label="Theme" value={t.theme} options={["space", "midnight", "aurora"]} onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Akzentfarbe" value={t.accent}
          options={["#38bdf8", "#a855f7", "#2dd4bf", "#fb7185", "#ffc83d"]} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Bewegung & Sound" />
        <TweakToggle label="Soundeffekte" value={t.sound} onChange={(v) => setTweak("sound", v)} />
        <TweakToggle label="Animationen reduzieren" value={t.reduceMotion} onChange={(v) => setTweak("reduceMotion", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
