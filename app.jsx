const { useState, useEffect, useRef } = React;

// ── PASSPHRASE LOCK ──────────────────────────────────────────
const PASSPHRASE = "Be-the-change-you-want";
const LOCK_KEY = "routine_unlocked";

function LockScreen({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  function tryUnlock() {
    if (input === PASSPHRASE) {
      try { sessionStorage.setItem(LOCK_KEY, "1"); } catch {}
      onUnlock();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 600);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#FDF8FF",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');
        @keyframes shakeLock { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        input:focus { outline: none; }
      `}</style>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#2D1B4E",
        marginBottom: 8, textAlign: "center",
      }}>YOUR SPACE</div>
      <div style={{ fontSize: 12, color: "rgba(100,60,140,0.5)", marginBottom: 28, textAlign: "center" }}>
        Enter your passphrase to continue
      </div>
      <input
        ref={inputRef}
        type="password"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
        placeholder="Passphrase"
        style={{
          width: "100%", maxWidth: 320,
          background: "rgba(120,80,160,0.04)",
          border: `1px solid ${error ? "#F87171" : "rgba(120,80,160,0.15)"}`,
          borderRadius: 10, padding: "14px 16px",
          color: "#2D1B4E", fontSize: 15, fontFamily: "'DM Mono', monospace",
          textAlign: "center", marginBottom: 16,
          animation: error ? "shakeLock 0.4s ease" : "none",
        }}
      />
      <button onClick={tryUnlock} style={{
        background: "#C084FC", color: "#fff", border: "none",
        borderRadius: 10, padding: "12px 32px",
        fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700,
        letterSpacing: 1, cursor: "pointer",
      }}>UNLOCK</button>
      {error && <div style={{ color: "#F87171", fontSize: 12, marginTop: 12 }}>Not quite — try again</div>}
    </div>
  );
}

function Gate() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(LOCK_KEY) === "1"; } catch { return false; }
  });
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <App />;
}

// ── PASSPHRASE LOCK END ──────────────────────────────────────

// ── STORAGE ───────────────────────────────────────────────────
const SK = "laina_app_v3";
function load() { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function save(d) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} }

// ── HELPERS ───────────────────────────────────────────────────
function todayKey() { return new Date().toISOString().slice(0,10); }
function fmt(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`; }
function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((new Date(todayKey()) - new Date(dateStr)) / 86400000);
}

// ── LEVELS ────────────────────────────────────────────────────
const LEVELS = [
  { level:1, title:"Just Woke Up",   min:0    },
  { level:2, title:"Getting Going",  min:200  },
  { level:3, title:"In The Zone",    min:500  },
  { level:4, title:"Locked In",      min:1000 },
  { level:5, title:"On A Streak",    min:2000 },
  { level:6, title:"Unstoppable",    min:4000 },
  { level:7, title:"Morning Legend", min:7000 },
];
function getLevel(xp) { let l=LEVELS[0]; for(const x of LEVELS){if(xp>=x.min)l=x;} return l; }
function getNext(xp) { return LEVELS.find(l=>l.min>xp)||null; }

// ── HABIT ROADMAP ─────────────────────────────────────────────
// Each habit: dayFloor = min days since start, checksNeeded = check-ins required
const HABIT_JOURNEY = [
  { id:"wakeup",    label:"Feet on floor",        emoji:"🦶", xp:10,  duration:0,     dayFloor:0,  checksNeeded:0,  desc:"Your anchor. Everything starts here." },
  { id:"journal",   label:"Manifestation Journal", emoji:"✨", xp:40,  duration:0,     dayFloor:0,  checksNeeded:0,  desc:"Write it like it's already real." },
  { id:"xiidra_am",label:"Xiidra drops (AM)",   emoji:"👁️", xp:10,  duration:0,     dayFloor:0,  checksNeeded:0,  desc:"Every morning, first thing." },
  { id:"water",     label:"Drink water",           emoji:"💧", xp:10,  duration:0,     dayFloor:0,  checksNeeded:0,  desc:"Before anything else." },
  { id:"workout",   label:"Workout",               emoji:"💪", xp:60,  duration:45*60, dayFloor:5,  checksNeeded:3,  desc:"Show up for 5 days first, then we add this." },
  { id:"stretch",   label:"Stretch",               emoji:"🧘", xp:25,  duration:10*60, dayFloor:7,  checksNeeded:4,  desc:"Pairs with workout. Unlocks at day 7." },
  { id:"shower",    label:"Shower",                emoji:"🚿", xp:15,  duration:10*60, dayFloor:10, checksNeeded:6,  desc:"Part of the full morning block." },
  { id:"read",      label:"Read",                  emoji:"📖", xp:40,  duration:30*60, dayFloor:14, checksNeeded:9,  desc:"30 minutes. Weekdays only." },
  { id:"meditate",  label:"Meditate",              emoji:"🌬️", xp:35,  duration:5*60,  dayFloor:21, checksNeeded:13, desc:"The final piece. You've earned it." },
];

const EVENING_JOURNEY = [
  { id:"bath",       label:"Draw your bath",    emoji:"🛁", xp:15, duration:0,     dayFloor:0,  checksNeeded:0, desc:"Your wind-down anchor." },
  { id:"washface",   label:"Wash face",         emoji:"🧼", xp:10, duration:0,     dayFloor:0,  checksNeeded:0, desc:"Easy to skip, easy to do now." },
  { id:"moisturize", label:"Moisturizer / skincare", emoji:"🧴", xp:10, duration:0, dayFloor:0,  checksNeeded:0, desc:"Right after washing your face." },
  { id:"brush",      label:"Brush teeth",       emoji:"🪥", xp:10, duration:0,     dayFloor:0,  checksNeeded:0, desc:"Pairs naturally with floss." },
  { id:"floss",      label:"Floss",             emoji:"🦷", xp:10, duration:0,     dayFloor:0,  checksNeeded:0, desc:"Non-negotiable." },
  { id:"meds",       label:"Nightly meds/supplements", emoji:"💊", xp:10, duration:0, dayFloor:0, checksNeeded:0, desc:"Easy to forget once you're in bed." },
  { id:"xiidra_pm",label:"Xiidra drops (PM)",    emoji:"👁️", xp:10, duration:0,     dayFloor:0,  checksNeeded:0, desc:"Every evening." },
  { id:"gratitude",  label:"Gratitude journal", emoji:"🙏", xp:30, duration:10*60, dayFloor:7,  checksNeeded:4, desc:"Unlocks week 2." },
  { id:"todo",       label:"Tomorrow's to-do",  emoji:"📋", xp:20, duration:5*60,  dayFloor:14, checksNeeded:9, desc:"Set yourself up for tomorrow." },
];

// ── PARALYSIS STEPS ───────────────────────────────────────────
const PARALYSIS = [
  "Stand up. That's it. Just stand up.",
  "Put one shoe on. Just one.",
  "Open the app or doc. Don't do anything yet.",
  "Drink a sip of water. Literally one sip.",
  "Set a 2-minute timer and do the smallest version of the task.",
  "Walk to the room where the task lives.",
  "Touch the object you need — book, mat, journal, weights.",
  "Say out loud: 'I'm just starting for 2 minutes.'",
  "Shake out your hands for 10 seconds. Reset your body.",
  "Text someone: 'starting now.' Accountability counts.",
  "Phone face-down, out of reach. That's the whole move.",
  "Do the dumbest, smallest version of the task. Lower the bar completely.",
  "Clear one thing off your surface. Just one.",
  "Put on the clothes for the task, even if you don't do it yet.",
  "Write the task name at the top of a blank page. Nothing else.",
];

// ── MANIFEST PROMPTS ──────────────────────────────────────────
const MANIFEST_PROMPTS = [
  "Write as if it's already yours. What does your life look like?",
  "Describe your best self in present tense. She is...",
  "What have you already become? Write it like a memory.",
  "Your future self is writing to you. What is she saying?",
  "It's done. It's real. Describe it.",
];

const GRATITUDE_PROMPTS = [
  "What three things are you genuinely grateful for right now?",
  "Who showed up for you recently, and how?",
  "What small thing went right today?",
  "What's something about yourself you're proud of today?",
  "What moment today felt like it was meant for you?",
];

// ── HYDRATION ─────────────────────────────────────────────────
const HYDRATION_ITEMS = [
  { id:"water",      label:"Water (any amount)",            emoji:"💧", note:"Even 5 sips counts" },
  { id:"aloe",       label:"Aloe vera juice",               emoji:"🌿", note:"Great for dry mouth" },
  { id:"herbal_tea", label:"Herbal tea",                    emoji:"🍵", note:"Counts fully" },
  { id:"coffee",     label:"Coffee with almond milk",       emoji:"☕", note:"Pair with a few sips of water" },
  { id:"watermelon", label:"Watermelon",                    emoji:"🍉", note:"92% water" },
  { id:"grapes",     label:"Grapes",                        emoji:"🍇", note:"Easy snack hydration" },
  { id:"orange",     label:"Orange or clementine",          emoji:"🍊", note:"Hydrating + vitamin C" },
  { id:"cucumber",   label:"Cucumber",                      emoji:"🥒", note:"96% water" },
  { id:"tomato",     label:"Tomato",                        emoji:"🍅", note:"Counts as hydration food" },
  { id:"cottage",    label:"Cottage cheese / Greek yogurt", emoji:"🥛", note:"Surprising hydration source" },
  { id:"diluted",    label:"Diluted juice",                 emoji:"🧃", note:"If that's what works today" },
];

const HYDRATION_NUDGES = [
  "Have a few sips of water.",
  "Pair your coffee with water — just a few sips.",
  "Dry mouth check: water, fruit, or aloe?",
  "Tiny hydration reset: 5 sips counts.",
  "Before your next sweet drink, a few sips of water first.",
  "Grab something hydrating — watermelon, grapes, or cucumber.",
  "Aloe vera juice if your mouth feels dry.",
  "Herbal tea counts. You've got this.",
  "Even one piece of fruit moves the needle.",
  "How's your mouth feeling? A few sips might help.",
];

// ── SHOPPING CATEGORIES ───────────────────────────────────────
const SHOP_CATS = [
  { id:"produce",  label:"🥦 Produce"   },
  { id:"fridge",   label:"🧊 Fridge"    },
  { id:"pantry",   label:"🥫 Pantry"    },
  { id:"health",   label:"💊 Health"    },
  { id:"home",     label:"🏠 Home"      },
  { id:"other",    label:"📦 Other"     },
];

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Bebas+Neue&display=swap');
  *{box-sizing:border-box;} body{margin:0;background:#FDF8FF;}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
  @keyframes toastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastOut{to{opacity:0;transform:translateY(-10px)}}
  @keyframes unlockPop{0%{opacity:0;transform:scale(0.8)}60%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
  @keyframes glow{0%,100%{box-shadow:0 0 16px rgba(192,132,252,0.3)}50%{box-shadow:0 0 32px rgba(192,132,252,0.55)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  textarea{resize:none;} textarea:focus,input:focus{outline:none;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#C4B5FD;border-radius:2px;}
  .tab-btn{transition:all 0.2s;} .tab-btn:hover{opacity:0.8;}
  .habit-check{transition:all 0.15s;} .habit-check:hover{transform:scale(1.1);}
`;

// ── COMPONENTS ────────────────────────────────────────────────
function Toast({ amount, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,1500); return()=>clearTimeout(t); },[]);
  return <div style={{position:"fixed",top:80,right:20,zIndex:999,background:"#C084FC",color:"#fff",fontFamily:"monospace",fontWeight:700,fontSize:15,padding:"8px 16px",borderRadius:8,animation:"toastIn 0.3s ease, toastOut 0.3s ease 1.2s forwards",pointerEvents:"none"}}>+{amount} XP ⚡</div>;
}

function UnlockBanner({ habit, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3500); return()=>clearTimeout(t); },[]);
  return (
    <div onClick={onDone} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(80,50,120,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",animation:"unlockPop 0.5s ease forwards"}}>
        <div style={{fontSize:56,marginBottom:12}}>{habit.emoji}</div>
        <div style={{fontSize:11,color:"#C084FC",letterSpacing:3,marginBottom:8}}>NEW HABIT UNLOCKED</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"#2D1B4E",lineHeight:1,marginBottom:10}}>{habit.label}</div>
        <div style={{fontSize:13,color:"rgba(80,50,120,0.55)",marginBottom:16,maxWidth:280,margin:"0 auto 16px"}}>{habit.desc}</div>
        <div style={{color:"#C084FC",fontSize:14,fontFamily:"monospace"}}>+{habit.xp} XP now available</div>
      </div>
    </div>
  );
}

function TimerBlock({ habit, onComplete }) {
  const [running, setRunning] = useState(false);
  const [rem, setRem] = useState(habit.duration);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if(running&&rem>0){
      ref.current=setInterval(()=>setRem(r=>{
        if(r<=1){clearInterval(ref.current);setRunning(false);setDone(true);onComplete?.();return 0;}
        return r-1;
      }),1000);
    }
    return()=>clearInterval(ref.current);
  },[running]);
  const pct=((habit.duration-rem)/habit.duration)*100;
  return (
    <div style={{marginTop:8}}>
      <div style={{height:3,background:"rgba(120,80,160,0.08)",borderRadius:2,overflow:"hidden",marginBottom:8}}>
        <div style={{height:"100%",width:`${pct}%`,background:done?"#34D399":"#C084FC",borderRadius:2,transition:"width 1s linear"}}/>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontFamily:"monospace",fontSize:17,color:done?"#34D399":"#C084FC",minWidth:52}}>{done?"DONE":fmt(rem)}</span>
        {!done&&<button onClick={()=>setRunning(!running)} style={{background:running?"rgba(192,132,252,0.15)":"#C084FC",color:running?"#C084FC":"#FDFBFF",border:running?"1px solid #C084FC":"none",borderRadius:4,padding:"3px 12px",fontSize:11,fontFamily:"monospace",fontWeight:700,letterSpacing:1,cursor:"pointer"}}>{running?"PAUSE":"START"}</button>}
      </div>
    </div>
  );
}

// ── TOP BAR ───────────────────────────────────────────────────
function TopBar({ totalXP, streak, active, onSwitch }) {
  const level=getLevel(totalXP), next=getNext(totalXP);
  const pct=next?Math.min(100,((totalXP-level.min)/(next.min-level.min))*100):100;
  const tabs=[
    {id:"morning",  label:"☀️",  sub:"MORNING"},
    {id:"roadmap",  label:"🗺️",  sub:"JOURNEY"},
    {id:"hydration",label:"💧",  sub:"HYDRATION"},
    {id:"evening",  label:"🌙",  sub:"EVENING"},
    {id:"shop",     label:"🛒",  sub:"SHOP"},
  ];
  return (
    <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(253,248,255,0.97)",borderBottom:"1px solid rgba(120,80,160,0.06)",padding:"10px 16px"}}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:10,color:"#C084FC",letterSpacing:1}}>LVL {level.level} · {level.title.toUpperCase()}</span>
          <div style={{flex:1}}/>
          {streak>0&&<span style={{fontSize:11,color:"#F59E0B"}}>🔥 {streak}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{flex:1,height:4,background:"rgba(120,80,160,0.07)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#C084FC,#D8A0FF)",borderRadius:2,transition:"width 0.6s ease"}}/>
          </div>
          <span style={{fontSize:10,color:"rgba(100,60,140,0.3)",whiteSpace:"nowrap"}}>{totalXP} XP</span>
        </div>
        <div style={{display:"flex",gap:4}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>onSwitch(t.id)} className="tab-btn" style={{
              flex:1,padding:"6px 2px",borderRadius:6,border:"none",cursor:"pointer",
              background:active===t.id?"#C084FC":"rgba(120,80,160,0.05)",
              display:"flex",flexDirection:"column",alignItems:"center",gap:1,
            }}>
              <span style={{fontSize:14}}>{t.label}</span>
              <span style={{fontSize:8,fontFamily:"'DM Mono',monospace",fontWeight:500,letterSpacing:0.5,color:active===t.id?"#4A1D8C":"rgba(100,60,140,0.3)"}}>{t.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
function App() {
  const [db, setDb] = useState(load);
  const [active, setActive] = useState("morning");

  // Unlock gate
  const [phase, setPhase] = useState("unlock");
  const [uStep, setUStep] = useState(0);
  const [uAnswers, setUAnswers] = useState(["",""]);
  const [uInput, setUInput] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Morning
  const [mChecked, setMChecked] = useState({});
  const [manifestText, setManifestText] = useState("");
  const [manifestXp, setManifestXp] = useState(false);

  // Evening
  const [eChecked, setEChecked] = useState({});
  const [customEvening, setCustomEvening] = useState(()=>load().customEvening||[]);
  const [newCustom, setNewCustom] = useState("");
  const [customChecked, setCustomChecked] = useState({});
  const [gratText, setGratText] = useState("");
  const [gratXp, setGratXp] = useState(false);
  const [todoXp, setTodoXp] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [puzzleUnlocked, setPuzzleUnlocked] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [stopFired, setStopFired] = useState(false);

  // Miebo drops — 4x/day, every ~4 hrs, resets at midnight
  const [miebo, setMiebo] = useState(()=>{
    const d = load();
    return (d.mieboDate === todayKey()) ? (d.mieboTimes || []) : [];
  });
  const [eyeNow, setEyeNow] = useState(Date.now());

  // Weight
  const [weightInput, setWeightInput] = useState("");
  const [weightLog, setWeightLog] = useState(()=>load().weightLog||[]);

  // Hydration
  const [hydChecked, setHydChecked] = useState({});
  const [dryMouth, setDryMouth] = useState(0);
  const [icFlare, setIcFlare] = useState(false);
  const [cafCount, setCafCount] = useState(0);
  const [hydLog, setHydLog] = useState(()=>load().hydrationLog||[]);
  const [nudgeIdx, setNudgeIdx] = useState(Math.floor(Math.random()*HYDRATION_NUDGES.length));

  // Shopping
  const [shopItems, setShopItems] = useState(()=>load().shopItems||[]);
  const [shopInput, setShopInput] = useState("");
  const [shopCat, setShopCat] = useState("produce");
  const [shopFilter, setShopFilter] = useState("all");

  // XP / streaks
  const [toasts, setToasts] = useState([]);
  const [paralysisStep, setParalysisStep] = useState(PARALYSIS[0]);
  const [showParalysis, setShowParalysis] = useState(false);
  const [newUnlock, setNewUnlock] = useState(null);
  const [shownUnlocks, setShownUnlocks] = useState(()=>load().shownUnlocks||[]);

  const [manifestPrompt] = useState(MANIFEST_PROMPTS[Math.floor(Math.random()*MANIFEST_PROMPTS.length)]);
  const [gratPrompt] = useState(GRATITUDE_PROMPTS[Math.floor(Math.random()*GRATITUDE_PROMPTS.length)]);

  const today = todayKey();
  const totalXP = db.totalXP||0;
  const streak = db.streak||0;
  const startDate = db.startDate||today;
  const lastComplete = db.lastComplete||null;
  const totalCheckIns = db.totalCheckIns||0;

  // ── ROADMAP UNLOCK LOGIC ──────────────────────────────────────
  function isUnlocked(habit) {
    const days = daysSince(startDate);
    return days >= habit.dayFloor && totalCheckIns >= habit.checksNeeded;
  }
  function unlockProgress(habit) {
    const days = daysSince(startDate);
    const dayPct = Math.min(1, days / Math.max(1, habit.dayFloor));
    const checkPct = Math.min(1, totalCheckIns / Math.max(1, habit.checksNeeded));
    return Math.min(dayPct, checkPct);
  }

  // Check for newly unlocked habits
  useEffect(() => {
    const allHabits = [...HABIT_JOURNEY, ...EVENING_JOURNEY];
    for (const h of allHabits) {
      if (isUnlocked(h) && !shownUnlocks.includes(h.id) && h.dayFloor > 0) {
        setNewUnlock(h);
        const updated = [...shownUnlocks, h.id];
        setShownUnlocks(updated);
        setDb(prev => { const u={...prev, shownUnlocks:updated}; save(u); return u; });
        break;
      }
    }
  }, [totalCheckIns, db.startDate]);

  // Init start date
  useEffect(() => {
    if (!db.startDate) {
      setDb(prev => { const u={...prev, startDate:today}; save(u); return u; });
    }
  }, []);

  useEffect(()=>{ if(inputRef.current)inputRef.current.focus(); },[uStep]);
  useEffect(()=>{ const t=setInterval(()=>setEyeNow(Date.now()),60000); return()=>clearInterval(t); },[]);
  useEffect(()=>{ const t=setInterval(()=>setNudgeIdx(i=>(i+1)%HYDRATION_NUDGES.length),90*60*1000); return()=>clearInterval(t); },[]);
  useEffect(()=>{
    const check=()=>{ const h=new Date().getHours(),m=new Date().getMinutes(); if(h===23&&m===0&&!stopFired)setStopFired(true); };
    const t=setInterval(check,30000); return()=>clearInterval(t);
  },[stopFired]);

  function awardXP(amount) {
    const id=Date.now()+Math.random();
    setToasts(t=>[...t,{id,amount}]);
    setDb(prev=>{ const u={...prev,totalXP:(prev.totalXP||0)+amount}; save(u); return u; });
  }

  function checkHabit(habits, checked, setChecked, id) {
    if(checked[id]) return;
    const h=habits.find(x=>x.id===id);
    if(!h||!isUnlocked(h)) return;
    setChecked(prev=>({...prev,[id]:true}));
    awardXP(h.xp);
  }

  // Day completion
  const availMorning = HABIT_JOURNEY.filter(h=>isUnlocked(h));
  const availEvening = EVENING_JOURNEY.filter(h=>isUnlocked(h));
  const morningDone = availMorning.every(h=>mChecked[h.id]) && (availMorning.some(h=>h.id==="journal") ? manifestXp : true);
  const eveningDone = availEvening.every(h=>eChecked[h.id]) && (availEvening.some(h=>h.id==="gratitude") ? gratXp : true);

  useEffect(()=>{
    if(eveningDone && availEvening.length > 0 && !puzzleUnlocked){ setPuzzleUnlocked(true); setShowPuzzle(true); setTimeout(()=>setShowPuzzle(false),3500); }
  },[eveningDone]);

  useEffect(()=>{
    if(morningDone && availMorning.length>0 && lastComplete!==today){
      const diff=lastComplete?(new Date(today)-new Date(lastComplete))/86400000:null;
      const newStreak=diff===1?streak+1:diff===0?streak:1;
      const bonus=newStreak>=3?newStreak*5:0;
      const newCheckIns=totalCheckIns+1;
      setDb(prev=>{ const u={...prev,streak:newStreak,lastComplete:today,totalCheckIns:newCheckIns}; save(u); return u; });
      if(bonus>0) awardXP(bonus);
    }
  },[morningDone,eveningDone]);

  function handleUnlock() {
    const steps=[
      {minLength:10,label:"SET YOUR INTENTION",prompt:"What is one thing that matters today?",placeholder:"Type it out..."},
      {minLength:15,label:"MORNING CHECK-IN",prompt:"How are you actually feeling right now?",placeholder:"No filter. Just type..."},
    ];
    const step=steps[uStep];
    if(uInput.trim().length<step.minLength){setShake(true);setTimeout(()=>setShake(false),500);return;}
    const updated=[...uAnswers]; updated[uStep]=uInput.trim();
    setUAnswers(updated); setUInput("");
    if(uStep<steps.length-1) setUStep(s=>s+1);
    else { if(!db.startDate){setDb(prev=>{const u={...prev,startDate:today};save(u);return u;});} setPhase("main"); }
  }

  function logWeight() {
    const val=parseFloat(weightInput); if(!val||val<=0)return;
    const entry={date:today,value:val};
    setWeightLog(prev=>{
      const updated=[...prev.filter(e=>e.date!==today),entry].sort((a,b)=>a.date.localeCompare(b.date));
      setDb(s=>{const u={...s,weightLog:updated};save(u);return u;});
      return updated;
    });
    setWeightInput(""); awardXP(5);
  }

  function addCustomEvening() {
    if (!newCustom.trim()) return;
    const item = { id: "custom_"+Date.now(), label: newCustom.trim() };
    const updated = [...customEvening, item];
    setCustomEvening(updated);
    setDb(s=>{const u={...s, customEvening:updated}; save(u); return u;});
    setNewCustom("");
  }

  function toggleCustomEvening(id) {
    setCustomChecked(prev=>{
      const wasChecked = prev[id];
      if (!wasChecked) awardXP(10);
      return {...prev, [id]: !wasChecked};
    });
  }

  function logMiebo() {
    if (miebo.length >= 4) return;
    const now = Date.now();
    const updated = [...miebo, now];
    setMiebo(updated);
    setDb(s=>{const u={...s, mieboTimes:updated, mieboDate:todayKey()}; save(u); return u;});
    awardXP(8);
  }

  function nextMieboGap() {
    if (miebo.length === 0) return null;
    if (miebo.length >= 4) return "done";
    const last = miebo[miebo.length - 1];
    const rem = 4*3600000 - (eyeNow - last);
    return rem <= 0 ? 0 : rem;
  }

  function toggleHyd(id) {
    setHydChecked(prev=>{
      const u={...prev,[id]:!prev[id]};
      if(!prev[id])awardXP(3);
      saveHydMeta(u);
      return u;
    });
  }

  function saveHydMeta(items=hydChecked) {
    const snap={date:today,items,dryMouth,icFlare,cafCount};
    setHydLog(prev=>{
      const u=[...prev.filter(e=>e.date!==today),snap];
      setDb(s=>{const x={...s,hydrationLog:u};save(x);return x;});
      return u;
    });
  }

  function addShopItem() {
    if(!shopInput.trim())return;
    const item={id:Date.now(),text:shopInput.trim(),cat:shopCat,done:false};
    setShopItems(prev=>{
      const u=[...prev,item];
      setDb(s=>{const x={...s,shopItems:u};save(x);return x;});
      return u;
    });
    setShopInput("");
  }

  function toggleShopItem(id) {
    setShopItems(prev=>{
      const u=prev.map(x=>x.id===id?{...x,done:!x.done}:x);
      setDb(s=>{const x={...s,shopItems:u};save(x);return x;});
      return u;
    });
  }

  function deleteShopItem(id) {
    setShopItems(prev=>{
      const u=prev.filter(x=>x.id!==id);
      setDb(s=>{const x={...s,shopItems:u};save(x);return x;});
      return u;
    });
  }

  function clearDoneShop() {
    setShopItems(prev=>{
      const u=prev.filter(x=>!x.done);
      setDb(s=>{const x={...s,shopItems:u};save(x);return x;});
      return u;
    });
  }

  const todayDisplay=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const daysIn=daysSince(startDate);

  // ── UNLOCK SCREEN ──────────────────────────────────────────────
  const UNLOCK_STEPS=[
    {minLength:10,label:"SET YOUR INTENTION",prompt:"What is one thing that matters today?",placeholder:"Type it out..."},
    {minLength:15,label:"MORNING CHECK-IN",prompt:"How are you actually feeling right now?",placeholder:"No filter. Just type..."},
  ];
  if(phase==="unlock"){
    const step=UNLOCK_STEPS[uStep];
    const ready=uInput.trim().length>=step.minLength;
    return (
      <div style={{minHeight:"100vh",background:"#FDFBFF",fontFamily:"'DM Mono',monospace"}}>
        <style>{CSS}</style>
        <TopBar totalXP={totalXP} streak={streak} active="morning" onSwitch={()=>{}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 110px)",padding:24}}>
          <div style={{width:"100%",maxWidth:480,animation:"fadeUp 0.5s ease forwards"}}>
            <div style={{display:"flex",gap:6,marginBottom:36}}>
              {UNLOCK_STEPS.map((_,i)=><div key={i} style={{height:3,flex:1,borderRadius:2,background:i<=uStep?"#C084FC":"rgba(120,80,160,0.08)",transition:"background 0.3s"}}/>)}
            </div>
            <div style={{color:"#C084FC",fontSize:10,letterSpacing:3,marginBottom:10}}>{step.label} · {uStep+1}/{UNLOCK_STEPS.length}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:"#2D1B4E",lineHeight:1.1,marginBottom:26}}>{step.prompt}</div>
            <textarea ref={inputRef} value={uInput} onChange={e=>setUInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleUnlock();}}}
              placeholder={step.placeholder} rows={4}
              style={{width:"100%",background:"rgba(120,80,160,0.04)",border:`1px solid ${shake?"#F87171":"rgba(120,80,160,0.09)"}`,borderRadius:8,padding:16,color:"#2D1B4E",fontSize:14,fontFamily:"'DM Mono',monospace",lineHeight:1.7,animation:shake?"shake 0.4s ease":"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
              <span style={{fontSize:11,color:"rgba(100,60,140,0.2)"}}>{!ready?`${step.minLength-uInput.length} more chars`:"↵ enter or tap continue"}</span>
              <button onClick={handleUnlock} style={{background:ready?"#C084FC":"rgba(120,80,160,0.05)",color:ready?"#FDFBFF":"rgba(100,60,140,0.2)",border:"none",borderRadius:6,padding:"10px 20px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:500,letterSpacing:1,cursor:"pointer",transition:"all 0.2s"}}>
                {uStep<UNLOCK_STEPS.length-1?"NEXT →":"START MORNING →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────────
  const W={maxWidth:520,margin:"0 auto",padding:"22px 18px"};
  const SL={fontSize:10,color:"rgba(100,60,140,0.25)",letterSpacing:3,marginBottom:14};
  const CARD={background:"rgba(120,80,160,0.04)",border:"1px solid rgba(120,80,160,0.07)",borderRadius:10,padding:16,marginBottom:20};

  return (
    <div style={{minHeight:"100vh",background:"#FDFBFF",fontFamily:"'DM Mono',monospace",paddingBottom:100}}>
      <style>{CSS}</style>

      {toasts.map(t=><Toast key={t.id} amount={t.amount} onDone={()=>setToasts(p=>p.filter(x=>x.id!==t.id))}/>)}
      {newUnlock&&<UnlockBanner habit={newUnlock} onDone={()=>setNewUnlock(null)}/>}

      {showPuzzle&&(
        <div onClick={()=>setShowPuzzle(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(80,50,120,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center",animation:"unlockPop 0.5s ease"}}>
            <div style={{fontSize:56,marginBottom:10}}>🧩</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,color:"#7C3AED"}}>PUZZLES UNLOCKED</div>
            <div style={{fontSize:13,color:"rgba(80,50,120,0.5)",marginTop:8}}>Evening routine complete. You earned it.</div>
          </div>
        </div>
      )}

      {stopFired&&(
        <div style={{position:"fixed",bottom:90,left:16,right:16,zIndex:150,background:"#FCA5A5",color:"#2D1B4E",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"'DM Mono',monospace"}}>
          <span style={{fontSize:13}}>🛑 11:00 PM — PUT THE PUZZLE DOWN.</span>
          <button onClick={()=>setStopFired(false)} style={{background:"rgba(100,60,140,0.2)",border:"none",color:"#2D1B4E",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>ok</button>
        </div>
      )}

      {showParalysis&&(
        <div onClick={()=>setShowParalysis(false)} style={{position:"fixed",inset:0,zIndex:250,background:"rgba(80,50,120,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#F5F0FF",border:"1px solid rgba(120,80,160,0.1)",borderRadius:14,padding:28,maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:10}}>🆘</div>
            <div style={{fontSize:10,color:"#C084FC",letterSpacing:3,marginBottom:12}}>YOU'RE STUCK. THAT'S OK.</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#2D1B4E",lineHeight:1.3,marginBottom:16}}>{paralysisStep}</div>
            <div style={{fontSize:12,color:"rgba(80,50,120,0.45)",marginBottom:20,lineHeight:1.6}}>Don't think about the whole task. Just do this one thing.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setParalysisStep(PARALYSIS[Math.floor(Math.random()*PARALYSIS.length)]);}} style={{flex:1,background:"rgba(120,80,160,0.06)",color:"rgba(80,50,120,0.7)",border:"1px solid rgba(120,80,160,0.1)",borderRadius:8,padding:"10px 0",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>ANOTHER ONE</button>
              <button onClick={()=>setShowParalysis(false)} style={{flex:1,background:"#C084FC",color:"#FDFBFF",border:"none",borderRadius:8,padding:"10px 0",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,cursor:"pointer"}}>OK, GOING</button>
            </div>
          </div>
        </div>
      )}

      <TopBar totalXP={totalXP} streak={streak} active={active} onSwitch={setActive}/>

      <div style={W}>

        {/* ── MORNING ── */}
        {active==="morning"&&(
          <div style={{animation:"fadeUp 0.4s ease forwards"}}>
            <div style={{marginBottom:20}}>
              <div style={{color:"#C084FC",fontSize:10,letterSpacing:3,marginBottom:4}}>{todayDisplay.toUpperCase()}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#2D1B4E",lineHeight:1}}>GOOD MORNING</div>
              <div style={{color:"rgba(100,60,140,0.25)",fontSize:12,marginTop:6}}>Day {daysIn+1} · {availMorning.filter(h=>mChecked[h.id]).length}/{availMorning.length} done</div>
            </div>

            <div style={{background:"rgba(192,132,252,0.08)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:8,padding:14,marginBottom:24}}>
              <div style={{fontSize:9,color:"#C084FC",letterSpacing:2,marginBottom:5}}>TODAY'S INTENTION</div>
              <div style={{color:"#2D1B4E",fontSize:13,lineHeight:1.5}}>"{uAnswers[0]}"</div>
            </div>

            {/* Manifestation journal */}
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={SL}>✨ MANIFESTATION JOURNAL</div>
                <span style={{fontSize:10,color:manifestXp?"#34D399":"#C084FC"}}>{manifestXp?`✓ +40 XP`:"+40 XP"}</span>
              </div>
              <div style={{fontSize:12,color:"rgba(80,50,120,0.5)",marginBottom:8,fontStyle:"italic"}}>{manifestPrompt}</div>
              <textarea value={manifestText} onChange={e=>setManifestText(e.target.value)}
                onBlur={()=>{if(!manifestXp&&manifestText.trim().length>40){setManifestXp(true);awardXP(40);}}}
                placeholder="I am... I have... I feel... Write it like it's already real." rows={5}
                style={{width:"100%",...CARD,padding:14,color:"#2D1B4E",fontSize:13,fontFamily:"'DM Mono',monospace",lineHeight:1.7,border:`1px solid ${manifestXp?"rgba(52,211,153,0.25)":"rgba(120,80,160,0.07)"}`,marginBottom:0}}/>
            </div>

            {/* Habit checklist */}
            <div style={{marginBottom:24}}>
              <div style={SL}>MORNING HABITS</div>
              {HABIT_JOURNEY.map(h=>{
                const unlocked=isUnlocked(h);
                const done=!!mChecked[h.id];
                if(!unlocked) return null;
                return (
                  <div key={h.id} style={{borderBottom:"1px solid rgba(120,80,160,0.04)",padding:"8px 4px 12px",opacity:done?0.38:1,transition:"opacity 0.3s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <button className="habit-check" onClick={()=>checkHabit(HABIT_JOURNEY,mChecked,setMChecked,h.id)} style={{width:26,height:26,borderRadius:6,flexShrink:0,border:done?"none":"1.5px solid rgba(100,60,140,0.15)",background:done?"#34D399":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",animation:done?"pop 0.3s ease":"none"}}>
                        {done?"✓":""}
                      </button>
                      <span style={{fontSize:15}}>{h.emoji}</span>
                      <span style={{color:"#2D1B4E",fontSize:13,flex:1,textDecoration:done?"line-through":"none"}}>{h.label}</span>
                      <span style={{fontSize:10,color:"#C084FC"}}>+{h.xp}</span>
                    </div>
                    {h.duration>0&&!done&&<div style={{paddingLeft:38}}><TimerBlock habit={h} onComplete={()=>checkHabit(HABIT_JOURNEY,mChecked,setMChecked,h.id)}/></div>}
                  </div>
                );
              })}
            </div>

            {/* Miebo drops — 4x/day tracker */}
            <div style={{...CARD, marginBottom:24}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                <div style={{fontSize:9,color:"rgba(100,60,140,0.4)",letterSpacing:2}}>👁️ MIEBO DROPS · 4X DAILY</div>
                <span style={{fontSize:10,color:"#2DD4BF"}}>{miebo.length}/4 today</span>
              </div>

              <div style={{display:"flex", gap:8, marginBottom:12}}>
                {[0,1,2,3].map(i=>{
                  const taken = i < miebo.length;
                  return (
                    <div key={i} style={{
                      flex:1, height:8, borderRadius:4,
                      background: taken ? "#2DD4BF" : "rgba(45,212,191,0.15)",
                      transition:"background 0.3s",
                    }}/>
                  );
                })}
              </div>

              {miebo.length === 0 && (
                <div style={{color:"rgba(100,60,140,0.4)", fontSize:12, marginBottom:12}}>No doses logged yet today. Tap below for your first.</div>
              )}
              {miebo.length > 0 && miebo.length < 4 && nextMieboGap() !== null && (
                nextMieboGap() === 0 ? (
                  <div style={{color:"#D97706", fontSize:13, marginBottom:12}}>⏰ Time for your next dose</div>
                ) : (
                  <div style={{color:"#2D1B4E", fontSize:16, fontFamily:"monospace", marginBottom:12}}>
                    Next dose in {Math.floor(nextMieboGap()/3600000)}h {Math.floor((nextMieboGap()%3600000)/60000)}m
                  </div>
                )
              )}
              {miebo.length >= 4 && (
                <div style={{color:"#34D399", fontSize:13, marginBottom:12}}>✓ All 4 doses done for today</div>
              )}

              <button onClick={logMiebo} disabled={miebo.length>=4} style={{
                width:"100%", background: miebo.length>=4 ? "rgba(45,212,191,0.15)" : "#2DD4BF",
                color: miebo.length>=4 ? "rgba(100,60,140,0.4)" : "#fff",
                border:"none", borderRadius:8, padding:"11px 0",
                fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700,
                cursor: miebo.length>=4 ? "default" : "pointer",
              }}>
                {miebo.length>=4 ? "DONE FOR TODAY" : `👁️ LOG DOSE ${miebo.length+1} OF 4`}
              </button>

              {miebo.length > 0 && (
                <div style={{display:"flex", gap:10, marginTop:10, flexWrap:"wrap"}}>
                  {miebo.map((t,i)=>(
                    <span key={i} style={{fontSize:10, color:"rgba(100,60,140,0.4)"}}>
                      {i+1}: {new Date(t).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weight */}
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={SL}>WEIGHT (OPTIONAL)</div>
                <span style={{fontSize:10,color:"rgba(100,60,140,0.2)"}}>+5 XP · no pressure</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={weightInput} onChange={e=>setWeightInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")logWeight();}} type="number" placeholder="lbs"
                  style={{flex:1,background:"rgba(120,80,160,0.04)",border:"1px solid rgba(120,80,160,0.07)",borderRadius:8,padding:"10px 14px",color:"#2D1B4E",fontSize:13,fontFamily:"'DM Mono',monospace"}}/>
                <button onClick={logWeight} style={{background:"rgba(192,132,252,0.18)",color:"#C084FC",border:"1px solid rgba(192,132,252,0.35)",borderRadius:8,padding:"10px 18px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,cursor:"pointer"}}>LOG</button>
              </div>
              {weightLog.length>1&&(
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",gap:5,alignItems:"flex-end",height:48}}>
                    {weightLog.slice(-14).map((e,i,arr)=>{
                      const vals=arr.map(x=>x.value),mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
                      const h=8+((e.value-mn)/rng)*38;
                      return <div key={e.date} style={{flex:1,height:h,background:i===arr.length-1?"#C084FC":"rgba(192,132,252,0.35)",borderRadius:2}}/>;
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(100,60,140,0.25)",marginTop:4}}>
                    <span>{weightLog[Math.max(0,weightLog.length-14)].value} lbs</span>
                    <span>{weightLog[weightLog.length-1].value} lbs latest</span>
                  </div>
                </div>
              )}
            </div>

            {morningDone&&(
              <div style={{background:"rgba(192,132,252,0.09)",border:"1px solid rgba(192,132,252,0.3)",borderRadius:8,padding:16,textAlign:"center",marginBottom:16}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#7C3AED"}}>MORNING COMPLETE ☀️</div>
                <div style={{fontSize:12,color:"rgba(80,50,120,0.45)",marginTop:6}}>See you tonight.</div>
              </div>
            )}
          </div>
        )}

        {/* ── ROADMAP ── */}
        {active==="roadmap"&&(
          <div style={{animation:"fadeUp 0.4s ease forwards"}}>
            <div style={{marginBottom:22}}>
              <div style={{color:"#C084FC",fontSize:10,letterSpacing:3,marginBottom:4}}>YOUR JOURNEY</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#2D1B4E",lineHeight:1}}>HABIT ROADMAP</div>
              <div style={{color:"rgba(100,60,140,0.25)",fontSize:12,marginTop:6}}>Day {daysIn+1} · {totalCheckIns} check-ins completed</div>
            </div>

            {/* Calendar strip — last 14 days */}
            <div style={{marginBottom:28}}>
              <div style={SL}>YOUR LAST 14 DAYS</div>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:14},(_,i)=>{
                  const d=new Date(); d.setDate(d.getDate()-(13-i));
                  const key=d.toISOString().slice(0,10);
                  const isToday=key===today;
                  const done=db.lastComplete===key || (isToday&&morningDone);
                  const past=key<today;
                  return (
                    <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",aspectRatio:"1",borderRadius:4,background:done?"#C084FC":past?"rgba(120,80,160,0.04)":"rgba(120,80,160,0.08)",border:isToday?"1px solid #C084FC":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:done?"#FDFBFF":"rgba(100,60,140,0.2)"}}>
                        {done?"✓":""}
                      </div>
                      <div style={{fontSize:7,color:"rgba(100,60,140,0.2)"}}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game map — morning habits */}
            <div style={{marginBottom:28}}>
              <div style={SL}>☀️ MORNING PATH</div>
              <div style={{position:"relative",paddingLeft:24}}>
                <div style={{position:"absolute",left:11,top:16,bottom:16,width:2,background:"rgba(120,80,160,0.06)",borderRadius:1}}/>
                {HABIT_JOURNEY.map((h,i)=>{
                  const unlocked=isUnlocked(h);
                  const done=!!mChecked[h.id];
                  const pct=unlockProgress(h)*100;
                  const isFirst=h.dayFloor===0;
                  return (
                    <div key={h.id} style={{display:"flex",gap:14,marginBottom:16,alignItems:"flex-start"}}>
                      <div style={{position:"relative",flexShrink:0,width:22,height:22,borderRadius:"50%",background:done?"#34D399":unlocked?"#C084FC":isFirst?"#C084FC":"rgba(120,80,160,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:done||unlocked?"#FDFBFF":"rgba(100,60,140,0.2)",border:!unlocked&&!isFirst?"1px dashed rgba(120,80,160,0.1)":"none",zIndex:1}}>
                        {done?"✓":unlocked?h.emoji.slice(0,1):"🔒"}
                      </div>
                      <div style={{flex:1,paddingTop:2}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{color:unlocked?"#fff":"rgba(100,60,140,0.3)",fontSize:13}}>{h.emoji} {h.label}</span>
                          <span style={{fontSize:10,color:"#C084FC",marginLeft:"auto"}}>+{h.xp} XP</span>
                        </div>
                        {!unlocked&&(
                          <>
                            <div style={{height:3,background:"rgba(120,80,160,0.06)",borderRadius:2,overflow:"hidden",marginBottom:3}}>
                              <div style={{height:"100%",width:`${pct}%`,background:"rgba(192,132,252,0.55)",borderRadius:2,transition:"width 0.5s ease"}}/>
                            </div>
                            <div style={{fontSize:10,color:"rgba(100,60,140,0.25)"}}>
                              Day {h.dayFloor} · {h.checksNeeded} check-ins needed · {Math.round(pct)}% there
                            </div>
                          </>
                        )}
                        {unlocked&&!done&&<div style={{fontSize:10,color:"#34D399"}}>✓ Unlocked · complete in morning tab</div>}
                        {done&&<div style={{fontSize:10,color:"rgba(100,60,140,0.3)"}}>Done today</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evening path */}
            <div style={{marginBottom:28}}>
              <div style={SL}>🌙 EVENING PATH</div>
              <div style={{position:"relative",paddingLeft:24}}>
                <div style={{position:"absolute",left:11,top:16,bottom:16,width:2,background:"rgba(120,80,160,0.06)",borderRadius:1}}/>
                {EVENING_JOURNEY.map(h=>{
                  const unlocked=isUnlocked(h);
                  const done=!!eChecked[h.id];
                  const pct=unlockProgress(h)*100;
                  return (
                    <div key={h.id} style={{display:"flex",gap:14,marginBottom:16,alignItems:"flex-start"}}>
                      <div style={{position:"relative",flexShrink:0,width:22,height:22,borderRadius:"50%",background:done?"#34D399":unlocked?"#A78BFA":"rgba(120,80,160,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:done||unlocked?"#FDFBFF":"rgba(100,60,140,0.2)",border:!unlocked?"1px dashed rgba(120,80,160,0.1)":"none",zIndex:1}}>
                        {done?"✓":unlocked?h.emoji.slice(0,1):"🔒"}
                      </div>
                      <div style={{flex:1,paddingTop:2}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{color:unlocked?"#fff":"rgba(100,60,140,0.3)",fontSize:13}}>{h.emoji} {h.label}</span>
                          <span style={{fontSize:10,color:"#A78BFA",marginLeft:"auto"}}>+{h.xp} XP</span>
                        </div>
                        {!unlocked&&(
                          <>
                            <div style={{height:3,background:"rgba(120,80,160,0.06)",borderRadius:2,overflow:"hidden",marginBottom:3}}>
                              <div style={{height:"100%",width:`${pct}%`,background:"rgba(167,139,250,0.6)",borderRadius:2}}/>
                            </div>
                            <div style={{fontSize:10,color:"rgba(100,60,140,0.25)"}}>Day {h.dayFloor} · {h.checksNeeded} check-ins · {Math.round(pct)}% there</div>
                          </>
                        )}
                        {unlocked&&!done&&<div style={{fontSize:10,color:"#34D399"}}>✓ Unlocked · complete in evening tab</div>}
                        {done&&<div style={{fontSize:10,color:"rgba(100,60,140,0.3)"}}>Done tonight</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak + milestone */}
            {streak>=3&&(
              <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:16,textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:26,marginBottom:4}}>🔥</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#D97706"}}>{streak} DAY STREAK</div>
                <div style={{fontSize:11,color:"rgba(100,60,140,0.3)",marginTop:4}}>Streak bonus: +{streak*5} XP on completion</div>
              </div>
            )}
          </div>
        )}

        {/* ── HYDRATION ── */}
        {active==="hydration"&&(
          <div style={{animation:"fadeUp 0.4s ease forwards"}}>
            <div style={{marginBottom:20}}>
              <div style={{color:"#2DD4BF",fontSize:10,letterSpacing:3,marginBottom:4}}>HYDRATION</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#2D1B4E",lineHeight:1}}>STAY HYDRATED</div>
              <div style={{color:"rgba(100,60,140,0.25)",fontSize:12,marginTop:6}}>{Object.values(hydChecked).filter(Boolean).length} of {HYDRATION_ITEMS.length} sources today</div>
            </div>

            <div style={{background:"rgba(45,212,191,0.08)",border:"1px solid rgba(45,212,191,0.25)",borderRadius:10,padding:16,marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:22}}>💧</div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:"#2DD4BF",letterSpacing:2,marginBottom:4}}>GENTLE REMINDER</div>
                <div style={{color:"#2D1B4E",fontSize:13,lineHeight:1.4}}>{HYDRATION_NUDGES[nudgeIdx]}</div>
              </div>
              <button onClick={()=>setNudgeIdx(i=>(i+1)%HYDRATION_NUDGES.length)} style={{background:"rgba(45,212,191,0.12)",color:"#2DD4BF",border:"1px solid rgba(45,212,191,0.25)",borderRadius:6,padding:"6px 10px",fontSize:10,fontFamily:"'DM Mono',monospace",cursor:"pointer",whiteSpace:"nowrap"}}>next tip</button>
            </div>

            <div style={{marginBottom:24}}>
              <div style={SL}>HYDRATION HELPERS · +3 XP EACH</div>
              {HYDRATION_ITEMS.map(item=>(
                <div key={item.id} onClick={()=>toggleHyd(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 4px",borderBottom:"1px solid rgba(120,80,160,0.04)",cursor:"pointer",opacity:hydChecked[item.id]?0.42:1,transition:"opacity 0.2s"}}>
                  <div style={{width:22,height:22,borderRadius:5,flexShrink:0,border:hydChecked[item.id]?"none":"1.5px solid rgba(100,60,140,0.15)",background:hydChecked[item.id]?"#2DD4BF":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",transition:"all 0.2s"}}>{hydChecked[item.id]?"✓":""}</div>
                  <span style={{fontSize:15}}>{item.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{color:"#2D1B4E",fontSize:13,textDecoration:hydChecked[item.id]?"line-through":"none"}}>{item.label}</div>
                    <div style={{color:"rgba(100,60,140,0.3)",fontSize:10,marginTop:1}}>{item.note}</div>
                  </div>
                  <span style={{fontSize:10,color:"#2DD4BF"}}>+3</span>
                </div>
              ))}
            </div>

            <div style={{marginBottom:22}}>
              <div style={SL}>DRY MOUTH LEVEL (1–10)</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} onClick={()=>{setDryMouth(n);saveHydMeta();}} style={{width:38,height:38,borderRadius:7,border:"none",cursor:"pointer",background:dryMouth===n?(n<=3?"#34D399":n<=6?"#F59E0B":"#F87171"):"rgba(120,80,160,0.06)",color:dryMouth===n?"#FDFBFF":"rgba(80,50,120,0.5)",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,transition:"all 0.2s"}}>{n}</button>
                ))}
              </div>
              {dryMouth>=7&&<div style={{marginTop:10,padding:"10px 14px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.22)",borderRadius:8,fontSize:12,color:"#F59E0B"}}>Try aloe vera juice or a few sips of water.</div>}
            </div>

            <div style={{marginBottom:22}}>
              <div style={SL}>CAFFEINE / SWEET DRINKS</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>{setCafCount(c=>Math.max(0,c-1));saveHydMeta();}} style={{width:36,height:36,borderRadius:8,background:"rgba(120,80,160,0.06)",border:"none",color:"#2D1B4E",fontSize:18,cursor:"pointer"}}>−</button>
                <div style={{textAlign:"center",minWidth:56}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:cafCount>=3?"#F59E0B":"#fff"}}>{cafCount}</div>
                  <div style={{fontSize:10,color:"rgba(100,60,140,0.3)"}}>drinks</div>
                </div>
                <button onClick={()=>{setCafCount(c=>c+1);saveHydMeta();}} style={{width:36,height:36,borderRadius:8,background:"rgba(120,80,160,0.06)",border:"none",color:"#2D1B4E",fontSize:18,cursor:"pointer"}}>+</button>
                {cafCount>=2&&<div style={{flex:1,fontSize:11,color:"rgba(80,50,120,0.45)",lineHeight:1.5}}>Before the next one, try a few sips of water first.</div>}
              </div>
            </div>

            <div style={{marginBottom:24}}>
              <div style={SL}>IC SYMPTOMS TODAY</div>
              <button onClick={()=>{setIcFlare(!icFlare);saveHydMeta();}} style={{display:"flex",alignItems:"center",gap:10,background:icFlare?"rgba(248,113,113,0.12)":"rgba(120,80,160,0.04)",border:`1px solid ${icFlare?"rgba(248,113,113,0.35)":"rgba(120,80,160,0.08)"}`,borderRadius:8,padding:"12px 14px",cursor:"pointer",width:"100%",textAlign:"left"}}>
                <div style={{width:18,height:18,borderRadius:4,background:icFlare?"#F87171":"transparent",border:icFlare?"none":"1.5px solid rgba(100,60,140,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#2D1B4E"}}>{icFlare?"✓":""}</div>
                <div>
                  <div style={{color:"#2D1B4E",fontSize:13}}>Experiencing a flare today</div>
                  <div style={{color:"rgba(100,60,140,0.3)",fontSize:10,marginTop:2}}>Logged for pattern tracking · no pressure today</div>
                </div>
              </button>
              {icFlare&&<div style={{marginTop:10,padding:"10px 14px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:8,fontSize:12,color:"rgba(80,50,120,0.6)",lineHeight:1.6}}>Be gentle today. Small sips only. Aloe vera juice may help.</div>}
            </div>

            {hydLog.length>1&&(
              <div style={{marginBottom:16}}>
                <div style={SL}>DRY MOUTH TREND · 7 DAYS</div>
                <div style={{display:"flex",gap:5,alignItems:"flex-end",height:48}}>
                  {hydLog.slice(-7).map(e=>{
                    const h=e.dryMouth?(e.dryMouth/10)*44+4:4;
                    const col=e.dryMouth<=3?"#34D399":e.dryMouth<=6?"#F59E0B":"#F87171";
                    return <div key={e.date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",height:h,background:e.dryMouth?col:"rgba(120,80,160,0.06)",borderRadius:2}}/>
                      <div style={{fontSize:7,color:"rgba(100,60,140,0.2)"}}>{e.date.slice(5)}</div>
                    </div>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EVENING ── */}
        {active==="evening"&&(
          <div style={{animation:"fadeUp 0.4s ease forwards"}}>
            <div style={{marginBottom:20}}>
              <div style={{color:"#A78BFA",fontSize:10,letterSpacing:3,marginBottom:4}}>WIND DOWN · 10:00 PM</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#2D1B4E",lineHeight:1}}>GOOD EVENING</div>
              <div style={{color:"rgba(100,60,140,0.25)",fontSize:12,marginTop:6}}>{puzzleUnlocked?"🧩 puzzles unlocked":"complete routine to unlock puzzles"}</div>
            </div>

            <div style={{marginBottom:24}}>
              <div style={SL}>EVENING ROUTINE</div>
              {EVENING_JOURNEY.map(h=>{
                if(!isUnlocked(h)) return null;
                const done=!!eChecked[h.id];
                return (
                  <div key={h.id} style={{borderBottom:"1px solid rgba(120,80,160,0.04)",padding:"8px 4px 12px",opacity:done?0.38:1,transition:"opacity 0.3s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <button className="habit-check" onClick={()=>checkHabit(EVENING_JOURNEY,eChecked,setEChecked,h.id)} style={{width:26,height:26,borderRadius:6,flexShrink:0,border:done?"none":"1.5px solid rgba(100,60,140,0.15)",background:done?"#34D399":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#FDFBFF"}}>
                        {done?"✓":""}
                      </button>
                      <span style={{fontSize:15}}>{h.emoji}</span>
                      <span style={{color:"#2D1B4E",fontSize:13,flex:1,textDecoration:done?"line-through":"none"}}>{h.label}</span>
                      <span style={{fontSize:10,color:"#A78BFA"}}>+{h.xp}</span>
                    </div>
                    {h.duration>0&&!done&&<div style={{paddingLeft:38}}><TimerBlock habit={h} onComplete={()=>checkHabit(EVENING_JOURNEY,eChecked,setEChecked,h.id)}/></div>}
                  </div>
                );
              })}

              {customEvening.map(item=>{
                const done = !!customChecked[item.id];
                return (
                  <div key={item.id} style={{borderBottom:"1px solid rgba(120,80,160,0.04)",padding:"8px 4px 12px",opacity:done?0.38:1,transition:"opacity 0.3s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <button className="habit-check" onClick={()=>toggleCustomEvening(item.id)} style={{width:26,height:26,borderRadius:6,flexShrink:0,border:done?"none":"1.5px solid rgba(100,60,140,0.15)",background:done?"#34D399":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#FDFBFF"}}>
                        {done?"✓":""}
                      </button>
                      <span style={{fontSize:15}}>✨</span>
                      <span style={{color:"#2D1B4E",fontSize:13,flex:1,textDecoration:done?"line-through":"none"}}>{item.label}</span>
                      <span style={{fontSize:10,color:"#A78BFA"}}>+10</span>
                    </div>
                  </div>
                );
              })}

              <div style={{display:"flex",gap:8,marginTop:10}}>
                <input value={newCustom} onChange={e=>setNewCustom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCustomEvening();}}
                  placeholder="Remembered something else? Add it..."
                  style={{flex:1,background:"rgba(120,80,160,0.04)",border:"1px solid rgba(120,80,160,0.08)",borderRadius:8,padding:"9px 12px",color:"#2D1B4E",fontSize:12,fontFamily:"'DM Mono',monospace"}}/>
                <button onClick={addCustomEvening} style={{background:"#A78BFA",color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:16,cursor:"pointer",fontWeight:700,lineHeight:1}}>+</button>
              </div>
            </div>

            {availEvening.some(h=>h.id==="gratitude")&&(
              <div style={{marginBottom:22}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={SL}>GRATITUDE JOURNAL</div>
                  <span style={{fontSize:10,color:gratXp?"#34D399":"#A78BFA"}}>{gratXp?"✓ +30 XP":"+30 XP"}</span>
                </div>
                <div style={{fontSize:12,color:"rgba(80,50,120,0.5)",marginBottom:8,fontStyle:"italic"}}>{gratPrompt}</div>
                <textarea value={gratText} onChange={e=>setGratText(e.target.value)}
                  onBlur={()=>{if(!gratXp&&gratText.trim().length>20){setGratXp(true);awardXP(30);}}}
                  placeholder={"1. \n2. \n3."} rows={4}
                  style={{width:"100%",background:"rgba(120,80,160,0.04)",border:`1px solid ${gratXp?"rgba(52,211,153,0.25)":"rgba(120,80,160,0.07)"}`,borderRadius:8,padding:14,color:"#2D1B4E",fontSize:13,fontFamily:"'DM Mono',monospace",lineHeight:1.7}}/>
              </div>
            )}

            {availEvening.some(h=>h.id==="todo")&&(
              <div style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <div style={SL}>TOMORROW'S TO-DO</div>
                  <span style={{fontSize:10,color:todoXp?"#34D399":"#A78BFA"}}>{todoXp?"✓ +15 XP":"+15 XP"}</span>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(!newTodo.trim())return;setTodos(t=>[...t,{id:Date.now(),text:newTodo.trim(),done:false}]);setNewTodo("");if(!todoXp){setTodoXp(true);awardXP(15);}}}} placeholder="Add a task for tomorrow..."
                    style={{flex:1,background:"rgba(120,80,160,0.04)",border:"1px solid rgba(120,80,160,0.07)",borderRadius:8,padding:"10px 14px",color:"#2D1B4E",fontSize:13,fontFamily:"'DM Mono',monospace"}}/>
                  <button onClick={()=>{if(!newTodo.trim())return;setTodos(t=>[...t,{id:Date.now(),text:newTodo.trim(),done:false}]);setNewTodo("");if(!todoXp){setTodoXp(true);awardXP(15);}}} style={{background:"#A78BFA",color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",fontSize:18,cursor:"pointer",fontWeight:700,lineHeight:1}}>+</button>
                </div>
                {todos.map(todo=>(
                  <div key={todo.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 4px",borderBottom:"1px solid rgba(120,80,160,0.04)",opacity:todo.done?0.38:1}}>
                    <div onClick={()=>setTodos(t=>t.map(x=>x.id===todo.id?{...x,done:!x.done}:x))} style={{width:18,height:18,borderRadius:4,flexShrink:0,border:todo.done?"none":"1.5px solid rgba(100,60,140,0.15)",background:todo.done?"#34D399":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",cursor:"pointer"}}>{todo.done?"✓":""}</div>
                    <span style={{color:"#2D1B4E",fontSize:13,flex:1,textDecoration:todo.done?"line-through":"none",cursor:"pointer"}} onClick={()=>setTodos(t=>t.map(x=>x.id===todo.id?{...x,done:!x.done}:x))}>{todo.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Puzzle section */}
            <div style={{marginBottom:24}}>
              <div style={SL}>🧩 PUZZLE TIME</div>
              {!puzzleUnlocked?(
                <div style={{background:"rgba(120,80,160,0.03)",border:"1px dashed rgba(120,80,160,0.1)",borderRadius:10,padding:24,textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:8,filter:"grayscale(1)",opacity:0.3}}>🧩</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"rgba(100,60,140,0.35)"}}>LOCKED</div>
                  <div style={{fontSize:12,color:"rgba(100,60,140,0.2)",marginTop:6}}>Complete your evening routine to unlock.</div>
                </div>
              ):(
                <div style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:10,padding:18}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#7C3AED",marginBottom:12}}>YOU EARNED THIS 🧩</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      {name:"NYT Mini Crossword",emoji:"📰",url:"https://www.nytimes.com/crosswords/game/mini"},
                      {name:"Wordle",emoji:"🟩",url:"https://www.nytimes.com/games/wordle/index.html"},
                      {name:"Connections",emoji:"🔗",url:"https://www.nytimes.com/games/connections"},
                      {name:"Spelling Bee",emoji:"🐝",url:"https://www.nytimes.com/puzzles/spelling-bee"},
                    ].map(p=>(
                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(167,139,250,0.1)",borderRadius:8,textDecoration:"none"}}>
                        <span style={{fontSize:16}}>{p.emoji}</span>
                        <span style={{color:"#2D1B4E",fontSize:13,fontFamily:"'DM Mono',monospace"}}>{p.name}</span>
                        <span style={{marginLeft:"auto",color:"rgba(100,60,140,0.3)",fontSize:11}}>→</span>
                      </a>
                    ))}
                  </div>
                  <div style={{marginTop:12,padding:"10px 12px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:8,fontSize:11,color:"rgba(80,50,120,0.5)",textAlign:"center"}}>
                    🛑 Hard stop: 11:00 PM
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SHOPPING ── */}
        {active==="shop"&&(
          <div style={{animation:"fadeUp 0.4s ease forwards"}}>
            <div style={{marginBottom:20}}>
              <div style={{color:"#34D399",fontSize:10,letterSpacing:3,marginBottom:4}}>SHOPPING LIST</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:"#2D1B4E",lineHeight:1}}>WHAT DO YOU NEED?</div>
              <div style={{color:"rgba(100,60,140,0.25)",fontSize:12,marginTop:6}}>
                {shopItems.filter(x=>!x.done).length} items left · {shopItems.filter(x=>x.done).length} done
              </div>
            </div>

            {/* Add item */}
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={shopInput} onChange={e=>setShopInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addShopItem();}} placeholder="Add anything..."
                  style={{flex:1,background:"rgba(120,80,160,0.04)",border:"1px solid rgba(120,80,160,0.09)",borderRadius:8,padding:"11px 14px",color:"#2D1B4E",fontSize:13,fontFamily:"'DM Mono',monospace"}}/>
                <button onClick={addShopItem} style={{background:"#34D399",color:"#fff",border:"none",borderRadius:8,padding:"11px 16px",fontSize:20,cursor:"pointer",fontWeight:700,lineHeight:1}}>+</button>
              </div>
              {/* Category picker */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {SHOP_CATS.map(c=>(
                  <button key={c.id} onClick={()=>setShopCat(c.id)} style={{padding:"4px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'DM Mono',monospace",background:shopCat===c.id?"#34D399":"rgba(120,80,160,0.06)",color:shopCat===c.id?"#FDFBFF":"rgba(80,50,120,0.5)",transition:"all 0.15s"}}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter */}
            <div style={{display:"flex",gap:5,marginBottom:18}}>
              {["all","todo","done"].map(f=>(
                <button key={f} onClick={()=>setShopFilter(f)} style={{flex:1,padding:"6px 0",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'DM Mono',monospace",background:shopFilter===f?"rgba(74,222,128,0.15)":"rgba(120,80,160,0.04)",color:shopFilter===f?"#34D399":"rgba(100,60,140,0.3)",transition:"all 0.15s"}}>
                  {f==="all"?"ALL":f==="todo"?"TO GET":"DONE"}
                </button>
              ))}
            </div>

            {/* Items by category */}
            {SHOP_CATS.map(cat=>{
              const items=shopItems.filter(x=>x.cat===cat.id&&(shopFilter==="all"||(shopFilter==="todo"&&!x.done)||(shopFilter==="done"&&x.done)));
              if(!items.length)return null;
              return (
                <div key={cat.id} style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"rgba(100,60,140,0.3)",letterSpacing:2,marginBottom:10}}>{cat.label}</div>
                  {items.map(item=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 4px",borderBottom:"1px solid rgba(120,80,160,0.04)",opacity:item.done?0.38:1,transition:"opacity 0.2s"}}>
                      <div onClick={()=>toggleShopItem(item.id)} style={{width:22,height:22,borderRadius:5,flexShrink:0,border:item.done?"none":"1.5px solid rgba(100,60,140,0.15)",background:item.done?"#34D399":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#FDFBFF",cursor:"pointer",transition:"all 0.2s"}}>{item.done?"✓":""}</div>
                      <span onClick={()=>toggleShopItem(item.id)} style={{color:"#2D1B4E",fontSize:13,flex:1,textDecoration:item.done?"line-through":"none",cursor:"pointer"}}>{item.text}</span>
                      <button onClick={()=>deleteShopItem(item.id)} style={{background:"none",border:"none",color:"rgba(100,60,140,0.2)",fontSize:16,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>
                    </div>
                  ))}
                </div>
              );
            })}

            {shopItems.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"rgba(100,60,140,0.15)",fontSize:13}}>
                Nothing on the list yet.<br/>Add something above.
              </div>
            )}

            {shopItems.some(x=>x.done)&&(
              <button onClick={clearDoneShop} style={{width:"100%",padding:"12px 0",background:"rgba(120,80,160,0.04)",border:"1px solid rgba(120,80,160,0.08)",borderRadius:8,color:"rgba(100,60,140,0.3)",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer",marginTop:8}}>
                Clear done items
              </button>
            )}
          </div>
        )}

        <div style={{textAlign:"center",fontSize:10,color:"rgba(120,80,160,0.08)",letterSpacing:3,marginTop:32}}>YOU SHOWED UP TODAY.</div>
      </div>

      {/* 🆘 Paralysis FAB */}
      <button onClick={()=>{setParalysisStep(PARALYSIS[Math.floor(Math.random()*PARALYSIS.length)]);setShowParalysis(true);}} style={{position:"fixed",bottom:24,right:20,zIndex:180,width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#C084FC,#A78BFA)",border:"none",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>🆘</button>
    </div>
  );
}
