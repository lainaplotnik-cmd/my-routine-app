const {
  useState,
  useEffect,
  useRef
} = React;
function Gate() {
  return React.createElement(App);
}
function App() {
  const [db, setDb] = useState(load);
  const [active, setActive] = useState("morning");

  // Unlock gate
  const [phase, setPhase] = useState("unlock");
  const [uStep, setUStep] = useState(0);
  const [uAnswers, setUAnswers] = useState(["", ""]);
  const [uInput, setUInput] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Morning
  const [mChecked, setMChecked] = useState({});
  const [manifestText, setManifestText] = useState("");
  const [manifestXp, setManifestXp] = useState(false);
  const [showManifestScan, setShowManifestScan] = useState(false);
  const [lastManifestText, setLastManifestText] = useState(() => load().lastManifestText || "");

  // Big Intention — set once, persists
  const [bigIntention, setBigIntention] = useState(() => load().bigIntention || "");
  const [editingBigIntention, setEditingBigIntention] = useState(false);
  const [bigIntentionDraft, setBigIntentionDraft] = useState("");

  // Evening
  const [eChecked, setEChecked] = useState({});
  const [customEvening, setCustomEvening] = useState(() => load().customEvening || []);
  const [newCustom, setNewCustom] = useState("");
  const [customChecked, setCustomChecked] = useState({});
  const [gratText, setGratText] = useState("");
  const [gratXp, setGratXp] = useState(false);
  const [showGratScan, setShowGratScan] = useState(false);
  const [lastGratText, setLastGratText] = useState(() => load().lastGratText || "");
  const [todoXp, setTodoXp] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [puzzleUnlocked, setPuzzleUnlocked] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [stopFired, setStopFired] = useState(false);

  // Miebo drops — 4x/day, every ~4 hrs, resets at midnight
  const [miebo, setMiebo] = useState(() => {
    const d = load();
    return d.mieboDate === todayKey() ? d.mieboTimes || [] : [];
  });
  const [eyeNow, setEyeNow] = useState(Date.now());

  // Weight
  const [weightInput, setWeightInput] = useState("");
  const [weightLog, setWeightLog] = useState(() => load().weightLog || []);

  // Hydration
  const [hydChecked, setHydChecked] = useState({});
  const [dryMouth, setDryMouth] = useState(0);
  const [icFlare, setIcFlare] = useState(false);
  const [cafCount, setCafCount] = useState(0);
  const [hydLog, setHydLog] = useState(() => load().hydrationLog || []);
  const [nudgeIdx, setNudgeIdx] = useState(Math.floor(Math.random() * HYDRATION_NUDGES.length));

  // Shopping
  const [shopItems, setShopItems] = useState(() => load().shopItems || []);
  const [shopInput, setShopInput] = useState("");
  const [shopCat, setShopCat] = useState("produce");
  const [shopFilter, setShopFilter] = useState("all");

  // XP / streaks
  const [toasts, setToasts] = useState([]);
  const [paralysisStep, setParalysisStep] = useState(PARALYSIS[0]);
  const [showParalysis, setShowParalysis] = useState(false);
  const [newUnlock, setNewUnlock] = useState(null);
  const [shownUnlocks, setShownUnlocks] = useState(() => load().shownUnlocks || []);
  const [manifestPrompt] = useState(MANIFEST_PROMPTS[Math.floor(Math.random() * MANIFEST_PROMPTS.length)]);
  const [gratPrompt] = useState(GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]);
  const today = todayKey();
  const totalXP = db.totalXP || 0;
  const streak = db.streak || 0;
  const startDate = db.startDate || today;
  const lastComplete = db.lastComplete || null;
  const totalCheckIns = db.totalCheckIns || 0;

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
        setDb(prev => {
          const u = {
            ...prev,
            shownUnlocks: updated
          };
          save(u);
          return u;
        });
        break;
      }
    }
  }, [totalCheckIns, db.startDate]);

  // Init start date
  useEffect(() => {
    if (!db.startDate) {
      setDb(prev => {
        const u = {
          ...prev,
          startDate: today
        };
        save(u);
        return u;
      });
    }
  }, []);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [uStep]);
  useEffect(() => {
    const t = setInterval(() => setEyeNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNudgeIdx(i => (i + 1) % HYDRATION_NUDGES.length), 90 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours(),
        m = new Date().getMinutes();
      if (h === 23 && m === 0 && !stopFired) setStopFired(true);
    };
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [stopFired]);
  function awardXP(amount) {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, {
      id,
      amount
    }]);
    setDb(prev => {
      const u = {
        ...prev,
        totalXP: (prev.totalXP || 0) + amount
      };
      save(u);
      return u;
    });
  }
  function checkHabit(habits, checked, setChecked, id) {
    if (checked[id]) return;
    const h = habits.find(x => x.id === id);
    if (!h || !isUnlocked(h)) return;
    setChecked(prev => ({
      ...prev,
      [id]: true
    }));
    awardXP(h.xp);
  }

  // Day completion
  const availMorning = HABIT_JOURNEY.filter(h => isUnlocked(h));
  const availEvening = EVENING_JOURNEY.filter(h => isUnlocked(h));
  const morningDone = availMorning.every(h => mChecked[h.id]) && (availMorning.some(h => h.id === "journal") ? manifestXp : true);
  const eveningDone = availEvening.every(h => eChecked[h.id]) && (availEvening.some(h => h.id === "gratitude") ? gratXp : true);
  useEffect(() => {
    if (eveningDone && availEvening.length > 0 && !puzzleUnlocked) {
      setPuzzleUnlocked(true);
      setShowPuzzle(true);
      setTimeout(() => setShowPuzzle(false), 3500);
    }
  }, [eveningDone]);
  useEffect(() => {
    if (morningDone && availMorning.length > 0 && lastComplete !== today) {
      const diff = lastComplete ? (new Date(today) - new Date(lastComplete)) / 86400000 : null;
      const newStreak = diff === 1 ? streak + 1 : diff === 0 ? streak : 1;
      const bonus = newStreak >= 3 ? newStreak * 5 : 0;
      const newCheckIns = totalCheckIns + 1;
      setDb(prev => {
        const u = {
          ...prev,
          streak: newStreak,
          lastComplete: today,
          totalCheckIns: newCheckIns
        };
        save(u);
        return u;
      });
      if (bonus > 0) awardXP(bonus);
    }
  }, [morningDone, eveningDone]);
  function handleUnlock() {
    const steps = [{
      minLength: 10,
      label: "SET YOUR INTENTION",
      prompt: "What is one thing that matters today?",
      placeholder: "Type it out..."
    }, {
      minLength: 15,
      label: "MORNING CHECK-IN",
      prompt: "How are you actually feeling right now?",
      placeholder: "No filter. Just type..."
    }];
    const step = steps[uStep];
    if (uInput.trim().length < step.minLength) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const updated = [...uAnswers];
    updated[uStep] = uInput.trim();
    setUAnswers(updated);
    setUInput("");
    if (uStep < steps.length - 1) setUStep(s => s + 1);else {
      if (!db.startDate) {
        setDb(prev => {
          const u = {
            ...prev,
            startDate: today
          };
          save(u);
          return u;
        });
      }
      setPhase("main");
    }
  }
  function logWeight() {
    const val = parseFloat(weightInput);
    if (!val || val <= 0) return;
    const entry = {
      date: today,
      value: val
    };
    setWeightLog(prev => {
      const updated = [...prev.filter(e => e.date !== today), entry].sort((a, b) => a.date.localeCompare(b.date));
      setDb(s => {
        const u = {
          ...s,
          weightLog: updated
        };
        save(u);
        return u;
      });
      return updated;
    });
    setWeightInput("");
    awardXP(5);
  }
  function addCustomEvening() {
    if (!newCustom.trim()) return;
    const item = {
      id: "custom_" + Date.now(),
      label: newCustom.trim()
    };
    const updated = [...customEvening, item];
    setCustomEvening(updated);
    setDb(s => {
      const u = {
        ...s,
        customEvening: updated
      };
      save(u);
      return u;
    });
    setNewCustom("");
  }
  function toggleCustomEvening(id) {
    setCustomChecked(prev => {
      const wasChecked = prev[id];
      if (!wasChecked) awardXP(10);
      return {
        ...prev,
        [id]: !wasChecked
      };
    });
  }
  function logMiebo() {
    if (miebo.length >= 4) return;
    const now = Date.now();
    const updated = [...miebo, now];
    setMiebo(updated);
    setDb(s => {
      const u = {
        ...s,
        mieboTimes: updated,
        mieboDate: todayKey()
      };
      save(u);
      return u;
    });
    awardXP(8);
  }
  function nextMieboGap() {
    if (miebo.length === 0) return null;
    if (miebo.length >= 4) return "done";
    const last = miebo[miebo.length - 1];
    const rem = 4 * 3600000 - (eyeNow - last);
    return rem <= 0 ? 0 : rem;
  }
  function toggleHyd(id) {
    setHydChecked(prev => {
      const u = {
        ...prev,
        [id]: !prev[id]
      };
      if (!prev[id]) awardXP(3);
      saveHydMeta(u);
      return u;
    });
  }
  function saveHydMeta(items = hydChecked) {
    const snap = {
      date: today,
      items,
      dryMouth,
      icFlare,
      cafCount
    };
    setHydLog(prev => {
      const u = [...prev.filter(e => e.date !== today), snap];
      setDb(s => {
        const x = {
          ...s,
          hydrationLog: u
        };
        save(x);
        return x;
      });
      return u;
    });
  }
  function addShopItem() {
    if (!shopInput.trim()) return;
    const item = {
      id: Date.now(),
      text: shopInput.trim(),
      cat: shopCat,
      done: false
    };
    setShopItems(prev => {
      const u = [...prev, item];
      setDb(s => {
        const x = {
          ...s,
          shopItems: u
        };
        save(x);
        return x;
      });
      return u;
    });
    setShopInput("");
  }
  function toggleShopItem(id) {
    setShopItems(prev => {
      const u = prev.map(x => x.id === id ? {
        ...x,
        done: !x.done
      } : x);
      setDb(s => {
        const x = {
          ...s,
          shopItems: u
        };
        save(x);
        return x;
      });
      return u;
    });
  }
  function deleteShopItem(id) {
    setShopItems(prev => {
      const u = prev.filter(x => x.id !== id);
      setDb(s => {
        const x = {
          ...s,
          shopItems: u
        };
        save(x);
        return x;
      });
      return u;
    });
  }
  function clearDoneShop() {
    setShopItems(prev => {
      const u = prev.filter(x => !x.done);
      setDb(s => {
        const x = {
          ...s,
          shopItems: u
        };
        save(x);
        return x;
      });
      return u;
    });
  }
  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  const daysIn = daysSince(startDate);

  // ── UNLOCK SCREEN ──────────────────────────────────────────────
  const UNLOCK_STEPS = [{
    minLength: 10,
    label: "SET YOUR INTENTION",
    prompt: "What is one thing that matters today?",
    placeholder: "Type it out..."
  }, {
    minLength: 15,
    label: "MORNING CHECK-IN",
    prompt: "How are you actually feeling right now?",
    placeholder: "No filter. Just type..."
  }];
  if (phase === "unlock") {
    const step = UNLOCK_STEPS[uStep];
    const ready = uInput.trim().length >= step.minLength;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        background: "#FDFBFF",
        fontFamily: "'DM Mono',monospace"
      }
    }, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement(TopBar, {
      totalXP: totalXP,
      streak: streak,
      active: "morning",
      onSwitch: () => {}
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 110px)",
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        maxWidth: 480,
        animation: "fadeUp 0.5s ease forwards"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginBottom: 36
      }
    }, UNLOCK_STEPS.map((_, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        height: 3,
        flex: 1,
        borderRadius: 2,
        background: i <= uStep ? "#C084FC" : "rgba(120,80,160,0.08)",
        transition: "background 0.3s"
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#C084FC",
        fontSize: 10,
        letterSpacing: 3,
        marginBottom: 10
      }
    }, step.label, " · ", uStep + 1, "/", UNLOCK_STEPS.length), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: 34,
        color: "#2D1B4E",
        lineHeight: 1.1,
        marginBottom: 26
      }
    }, step.prompt), /*#__PURE__*/React.createElement("textarea", {
      ref: inputRef,
      value: uInput,
      onChange: e => setUInput(e.target.value),
      onKeyDown: e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleUnlock();
        }
      },
      placeholder: step.placeholder,
      rows: 4,
      style: {
        width: "100%",
        background: "rgba(120,80,160,0.04)",
        border: `1px solid ${shake ? "#F87171" : "rgba(120,80,160,0.09)"}`,
        borderRadius: 8,
        padding: 16,
        color: "#2D1B4E",
        fontSize: 14,
        fontFamily: "'DM Mono',monospace",
        lineHeight: 1.7,
        animation: shake ? "shake 0.4s ease" : "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "rgba(100,60,140,0.2)"
      }
    }, !ready ? `${step.minLength - uInput.length} more chars` : "↵ enter or tap continue"), /*#__PURE__*/React.createElement("button", {
      onClick: handleUnlock,
      style: {
        background: ready ? "#C084FC" : "rgba(120,80,160,0.05)",
        color: ready ? "#FDFBFF" : "rgba(100,60,140,0.2)",
        border: "none",
        borderRadius: 6,
        padding: "10px 20px",
        fontFamily: "'DM Mono',monospace",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 1,
        cursor: "pointer",
        transition: "all 0.2s"
      }
    }, uStep < UNLOCK_STEPS.length - 1 ? "NEXT →" : "START MORNING →")))));
  }

  // ── MAIN ──────────────────────────────────────────────────────
  const W = {
    maxWidth: 520,
    margin: "0 auto",
    padding: "22px 18px"
  };
  const SL = {
    fontSize: 10,
    color: "rgba(100,60,140,0.25)",
    letterSpacing: 3,
    marginBottom: 14
  };
  const CARD = {
    background: "rgba(120,80,160,0.04)",
    border: "1px solid rgba(120,80,160,0.07)",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#FDFBFF",
      fontFamily: "'DM Mono',monospace",
      paddingBottom: 100
    }
  }, /*#__PURE__*/React.createElement("style", null, CSS), toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
    key: t.id,
    amount: t.amount,
    onDone: () => setToasts(p => p.filter(x => x.id !== t.id))
  })), newUnlock && /*#__PURE__*/React.createElement(UnlockBanner, {
    habit: newUnlock,
    onDone: () => setNewUnlock(null)
  }), showPuzzle && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowPuzzle(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(80,50,120,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      animation: "unlockPop 0.5s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 56,
      marginBottom: 10
    }
  }, "🧩"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 38,
      color: "#7C3AED"
    }
  }, "PUZZLES UNLOCKED"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(80,50,120,0.5)",
      marginTop: 8
    }
  }, "Evening routine complete. You earned it."))), stopFired && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 90,
      left: 16,
      right: 16,
      zIndex: 150,
      background: "#FCA5A5",
      color: "#2D1B4E",
      borderRadius: 10,
      padding: "12px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "'DM Mono',monospace"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "🛑 11:00 PM — PUT THE PUZZLE DOWN."), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStopFired(false),
    style: {
      background: "rgba(100,60,140,0.2)",
      border: "none",
      color: "#2D1B4E",
      borderRadius: 6,
      padding: "4px 10px",
      cursor: "pointer",
      fontSize: 12
    }
  }, "ok")), showParalysis && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowParalysis(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 250,
      background: "rgba(80,50,120,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "#F5F0FF",
      border: "1px solid rgba(120,80,160,0.1)",
      borderRadius: 14,
      padding: 28,
      maxWidth: 360,
      width: "100%",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      marginBottom: 10
    }
  }, "🆘"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#C084FC",
      letterSpacing: 3,
      marginBottom: 12
    }
  }, "YOU'RE STUCK. THAT'S OK."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 24,
      color: "#2D1B4E",
      lineHeight: 1.3,
      marginBottom: 16
    }
  }, paralysisStep), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(80,50,120,0.45)",
      marginBottom: 20,
      lineHeight: 1.6
    }
  }, "Don't think about the whole task. Just do this one thing."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setParalysisStep(PARALYSIS[Math.floor(Math.random() * PARALYSIS.length)]);
    },
    style: {
      flex: 1,
      background: "rgba(120,80,160,0.06)",
      color: "rgba(80,50,120,0.7)",
      border: "1px solid rgba(120,80,160,0.1)",
      borderRadius: 8,
      padding: "10px 0",
      fontFamily: "'DM Mono',monospace",
      fontSize: 12,
      cursor: "pointer"
    }
  }, "ANOTHER ONE"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowParalysis(false),
    style: {
      flex: 1,
      background: "#C084FC",
      color: "#FDFBFF",
      border: "none",
      borderRadius: 8,
      padding: "10px 0",
      fontFamily: "'DM Mono',monospace",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "OK, GOING")))), /*#__PURE__*/React.createElement(TopBar, {
    totalXP: totalXP,
    streak: streak,
    active: active,
    onSwitch: setActive
  }), /*#__PURE__*/React.createElement("div", {
    style: W
  }, active === "morning" && /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeUp 0.4s ease forwards"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#C084FC",
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 4
    }
  }, todayDisplay.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 40,
      color: "#2D1B4E",
      lineHeight: 1
    }
  }, "GOOD MORNING"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.25)",
      fontSize: 12,
      marginTop: 6
    }
  }, "Day ", daysIn + 1, " · ", availMorning.filter(h => mChecked[h.id]).length, "/", availMorning.length, " done")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(192,132,252,0.1),rgba(167,139,250,0.06))",
      border: "1px solid rgba(192,132,252,0.22)",
      borderRadius: 10,
      padding: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#C084FC",
      letterSpacing: 2
    }
  }, "🌟 BIG INTENTION"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setBigIntentionDraft(bigIntention);
      setEditingBigIntention(true);
    },
    style: {
      background: "none",
      border: "none",
      color: "rgba(192,132,252,0.5)",
      fontSize: 10,
      cursor: "pointer",
      textDecoration: "underline",
      padding: 0
    }
  }, bigIntention ? "edit" : "set it")), editingBigIntention ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("textarea", {
    value: bigIntentionDraft,
    onChange: e => setBigIntentionDraft(e.target.value),
    placeholder: "I am landing my dream job. Write it like it's already true.",
    rows: 2,
    style: {
      width: "100%",
      background: "rgba(255,255,255,0.5)",
      border: "1px solid rgba(192,132,252,0.25)",
      borderRadius: 8,
      padding: 10,
      color: "#2D1B4E",
      fontSize: 13,
      fontFamily: "'DM Mono',monospace",
      lineHeight: 1.6,
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingBigIntention(false),
    style: {
      flex: 1,
      background: "rgba(120,80,160,0.06)",
      border: "none",
      borderRadius: 7,
      padding: "8px 0",
      color: "rgba(100,60,140,0.5)",
      fontSize: 12,
      cursor: "pointer"
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const u = {
        ...load(),
        bigIntention: bigIntentionDraft
      };
      save(u);
      setBigIntention(bigIntentionDraft);
      setEditingBigIntention(false);
    },
    style: {
      flex: 2,
      background: "#C084FC",
      border: "none",
      borderRadius: 7,
      padding: "8px 0",
      color: "#fff",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "Save"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2D1B4E",
      fontSize: 14,
      lineHeight: 1.5,
      fontStyle: bigIntention ? "normal" : "italic",
      color: bigIntention ? "#2D1B4E" : "rgba(100,60,140,0.3)"
    }
  }, bigIntention || "Tap 'set it' to add your north star...")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(192,132,252,0.08)",
      border: "1px solid rgba(192,132,252,0.2)",
      borderRadius: 8,
      padding: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#C084FC",
      letterSpacing: 2,
      marginBottom: 5
    }
  }, "TODAY'S INTENTION"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2D1B4E",
      fontSize: 13,
      lineHeight: 1.5
    }
  }, "\"", uAnswers[0], "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "✨ MANIFESTATION JOURNAL"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: manifestXp ? "#34D399" : "#C084FC"
    }
  }, manifestXp ? `✓ +40 XP` : "+40 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(80,50,120,0.5)",
      marginBottom: 12,
      fontStyle: "italic"
    }
  }, manifestPrompt), manifestText ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(192,132,252,0.05)",
      border: "1px solid rgba(52,211,153,0.25)",
      borderRadius: 10,
      padding: 14,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#2D1B4E",
      lineHeight: 1.7,
      whiteSpace: "pre-wrap"
    }
  }, manifestText), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManifestScan(true),
    style: {
      marginTop: 10,
      background: "none",
      border: "none",
      color: "#C084FC",
      fontSize: 11,
      cursor: "pointer",
      textDecoration: "underline",
      padding: 0
    }
  }, "Rescan")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManifestScan(true),
    style: {
      width: "100%",
      background: "rgba(192,132,252,0.07)",
      border: "1px dashed rgba(192,132,252,0.35)",
      borderRadius: 10,
      padding: "18px 0",
      color: "#C084FC",
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "'DM Mono',monospace",
      marginBottom: 8
    }
  }, "📷 Scan my journal"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 11,
      color: "rgba(100,60,140,0.35)"
    }
  }, "Wrote it but don't have time to scan? ", /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setManifestText("scan later");
    },
    style: {
      background: "none",
      border: "none",
      color: "rgba(192,132,252,0.5)",
      fontSize: 11,
      cursor: "pointer",
      textDecoration: "underline",
      padding: 0
    }
  }, "Mark as scan later"))), manifestText === "scan later" && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(251,191,36,0.07)",
      border: "1px solid rgba(251,191,36,0.2)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#92400E"
    }
  }, "📷 Scan it when you're ready"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManifestScan(true),
    style: {
      background: "#FBBF24",
      border: "none",
      borderRadius: 6,
      padding: "5px 12px",
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "SCAN NOW")), showManifestScan && /*#__PURE__*/React.createElement(HandwritingScan, {
    previousText: lastManifestText,
    xpLabel: "(+40 XP)",
    onComplete: text => {
      setManifestText(text);
      if (!manifestXp) {
        setManifestXp(true);
        awardXP(40);
      }
      const u = {
        ...load(),
        lastManifestText: text
      };
      save(u);
      setLastManifestText(text);
    },
    onClose: () => setShowManifestScan(false)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "MORNING HABITS"), HABIT_JOURNEY.map(h => {
    const unlocked = isUnlocked(h);
    const done = !!mChecked[h.id];
    if (!unlocked) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: {
        borderBottom: "1px solid rgba(120,80,160,0.04)",
        padding: "8px 4px 12px",
        opacity: done ? 0.38 : 1,
        transition: "opacity 0.3s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "habit-check",
      onClick: () => checkHabit(HABIT_JOURNEY, mChecked, setMChecked, h.id),
      style: {
        width: 26,
        height: 26,
        borderRadius: 6,
        flexShrink: 0,
        border: done ? "none" : "1.5px solid rgba(100,60,140,0.15)",
        background: done ? "#34D399" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: "#fff",
        animation: done ? "pop 0.3s ease" : "none"
      }
    }, done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, h.emoji), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#2D1B4E",
        fontSize: 13,
        flex: 1,
        textDecoration: done ? "line-through" : "none"
      }
    }, h.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#C084FC"
      }
    }, "+", h.xp)), h.duration > 0 && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        paddingLeft: 38
      }
    }, /*#__PURE__*/React.createElement(TimerBlock, {
      habit: h,
      onComplete: () => checkHabit(HABIT_JOURNEY, mChecked, setMChecked, h.id)
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...CARD,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "rgba(100,60,140,0.4)",
      letterSpacing: 2
    }
  }, "👁️ MIEBO DROPS · 4X DAILY"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#2DD4BF"
    }
  }, miebo.length, "/4 today")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, [0, 1, 2, 3].map(i => {
    const taken = i < miebo.length;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        background: taken ? "#2DD4BF" : "rgba(45,212,191,0.15)",
        transition: "background 0.3s"
      }
    });
  })), miebo.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.4)",
      fontSize: 12,
      marginBottom: 12
    }
  }, "No doses logged yet today. Tap below for your first."), miebo.length > 0 && miebo.length < 4 && nextMieboGap() !== null && (nextMieboGap() === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#D97706",
      fontSize: 13,
      marginBottom: 12
    }
  }, "⏰ Time for your next dose") : /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2D1B4E",
      fontSize: 16,
      fontFamily: "monospace",
      marginBottom: 12
    }
  }, "Next dose in ", Math.floor(nextMieboGap() / 3600000), "h ", Math.floor(nextMieboGap() % 3600000 / 60000), "m")), miebo.length >= 4 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#34D399",
      fontSize: 13,
      marginBottom: 12
    }
  }, "✓ All 4 doses done for today"), /*#__PURE__*/React.createElement("button", {
    onClick: logMiebo,
    disabled: miebo.length >= 4,
    style: {
      width: "100%",
      background: miebo.length >= 4 ? "rgba(45,212,191,0.15)" : "#2DD4BF",
      color: miebo.length >= 4 ? "rgba(100,60,140,0.4)" : "#fff",
      border: "none",
      borderRadius: 8,
      padding: "11px 0",
      fontFamily: "'DM Mono',monospace",
      fontSize: 12,
      fontWeight: 700,
      cursor: miebo.length >= 4 ? "default" : "pointer"
    }
  }, miebo.length >= 4 ? "DONE FOR TODAY" : `👁️ LOG DOSE ${miebo.length + 1} OF 4`), miebo.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, miebo.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 10,
      color: "rgba(100,60,140,0.4)"
    }
  }, i + 1, ": ", new Date(t).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "WEIGHT (OPTIONAL)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "rgba(100,60,140,0.2)"
    }
  }, "+5 XP · no pressure")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: weightInput,
    onChange: e => setWeightInput(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") logWeight();
    },
    type: "number",
    placeholder: "lbs",
    style: {
      flex: 1,
      background: "rgba(120,80,160,0.04)",
      border: "1px solid rgba(120,80,160,0.07)",
      borderRadius: 8,
      padding: "10px 14px",
      color: "#2D1B4E",
      fontSize: 13,
      fontFamily: "'DM Mono',monospace"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: logWeight,
    style: {
      background: "rgba(192,132,252,0.18)",
      color: "#C084FC",
      border: "1px solid rgba(192,132,252,0.35)",
      borderRadius: 8,
      padding: "10px 18px",
      fontFamily: "'DM Mono',monospace",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "LOG")), weightLog.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "flex-end",
      height: 48
    }
  }, weightLog.slice(-14).map((e, i, arr) => {
    const vals = arr.map(x => x.value),
      mn = Math.min(...vals),
      mx = Math.max(...vals),
      rng = mx - mn || 1;
    const h = 8 + (e.value - mn) / rng * 38;
    return /*#__PURE__*/React.createElement("div", {
      key: e.date,
      style: {
        flex: 1,
        height: h,
        background: i === arr.length - 1 ? "#C084FC" : "rgba(192,132,252,0.35)",
        borderRadius: 2
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 10,
      color: "rgba(100,60,140,0.25)",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, weightLog[Math.max(0, weightLog.length - 14)].value, " lbs"), /*#__PURE__*/React.createElement("span", null, weightLog[weightLog.length - 1].value, " lbs latest")))), morningDone && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(192,132,252,0.09)",
      border: "1px solid rgba(192,132,252,0.3)",
      borderRadius: 8,
      padding: 16,
      textAlign: "center",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 28,
      color: "#7C3AED"
    }
  }, "MORNING COMPLETE ☀️"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(80,50,120,0.45)",
      marginTop: 6
    }
  }, "See you tonight."))), active === "roadmap" && /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeUp 0.4s ease forwards"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#C084FC",
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 4
    }
  }, "YOUR JOURNEY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 40,
      color: "#2D1B4E",
      lineHeight: 1
    }
  }, "HABIT ROADMAP"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.25)",
      fontSize: 12,
      marginTop: 6
    }
  }, "Day ", daysIn + 1, " · ", totalCheckIns, " check-ins completed")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "YOUR LAST 14 DAYS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, Array.from({
    length: 14
  }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const isToday = key === today;
    const done = db.lastComplete === key || isToday && morningDone;
    const past = key < today;
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        aspectRatio: "1",
        borderRadius: 4,
        background: done ? "#C084FC" : past ? "rgba(120,80,160,0.04)" : "rgba(120,80,160,0.08)",
        border: isToday ? "1px solid #C084FC" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        color: done ? "#FDFBFF" : "rgba(100,60,140,0.2)"
      }
    }, done ? "✓" : ""), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 7,
        color: "rgba(100,60,140,0.2)"
      }
    }, d.getDate()));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "☀️ MORNING PATH"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      paddingLeft: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 11,
      top: 16,
      bottom: 16,
      width: 2,
      background: "rgba(120,80,160,0.06)",
      borderRadius: 1
    }
  }), HABIT_JOURNEY.map((h, i) => {
    const unlocked = isUnlocked(h);
    const done = !!mChecked[h.id];
    const pct = unlockProgress(h) * 100;
    const isFirst = h.dayFloor === 0;
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: {
        display: "flex",
        gap: 14,
        marginBottom: 16,
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        flexShrink: 0,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: done ? "#34D399" : unlocked ? "#C084FC" : isFirst ? "#C084FC" : "rgba(120,80,160,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        color: done || unlocked ? "#FDFBFF" : "rgba(100,60,140,0.2)",
        border: !unlocked && !isFirst ? "1px dashed rgba(120,80,160,0.1)" : "none",
        zIndex: 1
      }
    }, done ? "✓" : unlocked ? h.emoji.slice(0, 1) : "🔒"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        paddingTop: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: unlocked ? "#fff" : "rgba(100,60,140,0.3)",
        fontSize: 13
      }
    }, h.emoji, " ", h.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#C084FC",
        marginLeft: "auto"
      }
    }, "+", h.xp, " XP")), !unlocked && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 3,
        background: "rgba(120,80,160,0.06)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: "rgba(192,132,252,0.55)",
        borderRadius: 2,
        transition: "width 0.5s ease"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(100,60,140,0.25)"
      }
    }, "Day ", h.dayFloor, " · ", h.checksNeeded, " check-ins needed · ", Math.round(pct), "% there")), unlocked && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#34D399"
      }
    }, "✓ Unlocked · complete in morning tab"), done && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(100,60,140,0.3)"
      }
    }, "Done today")));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "🌙 EVENING PATH"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      paddingLeft: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 11,
      top: 16,
      bottom: 16,
      width: 2,
      background: "rgba(120,80,160,0.06)",
      borderRadius: 1
    }
  }), EVENING_JOURNEY.map(h => {
    const unlocked = isUnlocked(h);
    const done = !!eChecked[h.id];
    const pct = unlockProgress(h) * 100;
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: {
        display: "flex",
        gap: 14,
        marginBottom: 16,
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        flexShrink: 0,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: done ? "#34D399" : unlocked ? "#A78BFA" : "rgba(120,80,160,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        color: done || unlocked ? "#FDFBFF" : "rgba(100,60,140,0.2)",
        border: !unlocked ? "1px dashed rgba(120,80,160,0.1)" : "none",
        zIndex: 1
      }
    }, done ? "✓" : unlocked ? h.emoji.slice(0, 1) : "🔒"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        paddingTop: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: unlocked ? "#fff" : "rgba(100,60,140,0.3)",
        fontSize: 13
      }
    }, h.emoji, " ", h.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#A78BFA",
        marginLeft: "auto"
      }
    }, "+", h.xp, " XP")), !unlocked && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 3,
        background: "rgba(120,80,160,0.06)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: "rgba(167,139,250,0.6)",
        borderRadius: 2
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(100,60,140,0.25)"
      }
    }, "Day ", h.dayFloor, " · ", h.checksNeeded, " check-ins · ", Math.round(pct), "% there")), unlocked && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#34D399"
      }
    }, "✓ Unlocked · complete in evening tab"), done && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(100,60,140,0.3)"
      }
    }, "Done tonight")));
  }))), streak >= 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(245,158,11,0.08)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: 8,
      padding: 16,
      textAlign: "center",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      marginBottom: 4
    }
  }, "🔥"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 24,
      color: "#D97706"
    }
  }, streak, " DAY STREAK"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "rgba(100,60,140,0.3)",
      marginTop: 4
    }
  }, "Streak bonus: +", streak * 5, " XP on completion"))), active === "hydration" && /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeUp 0.4s ease forwards"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2DD4BF",
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 4
    }
  }, "HYDRATION"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 40,
      color: "#2D1B4E",
      lineHeight: 1
    }
  }, "STAY HYDRATED"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.25)",
      fontSize: 12,
      marginTop: 6
    }
  }, Object.values(hydChecked).filter(Boolean).length, " of ", HYDRATION_ITEMS.length, " sources today")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(45,212,191,0.08)",
      border: "1px solid rgba(45,212,191,0.25)",
      borderRadius: 10,
      padding: 16,
      marginBottom: 22,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22
    }
  }, "💧"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#2DD4BF",
      letterSpacing: 2,
      marginBottom: 4
    }
  }, "GENTLE REMINDER"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2D1B4E",
      fontSize: 13,
      lineHeight: 1.4
    }
  }, HYDRATION_NUDGES[nudgeIdx])), /*#__PURE__*/React.createElement("button", {
    onClick: () => setNudgeIdx(i => (i + 1) % HYDRATION_NUDGES.length),
    style: {
      background: "rgba(45,212,191,0.12)",
      color: "#2DD4BF",
      border: "1px solid rgba(45,212,191,0.25)",
      borderRadius: 6,
      padding: "6px 10px",
      fontSize: 10,
      fontFamily: "'DM Mono',monospace",
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, "next tip")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "HYDRATION HELPERS · +3 XP EACH"), HYDRATION_ITEMS.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    onClick: () => toggleHyd(item.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 4px",
      borderBottom: "1px solid rgba(120,80,160,0.04)",
      cursor: "pointer",
      opacity: hydChecked[item.id] ? 0.42 : 1,
      transition: "opacity 0.2s"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 5,
      flexShrink: 0,
      border: hydChecked[item.id] ? "none" : "1.5px solid rgba(100,60,140,0.15)",
      background: hydChecked[item.id] ? "#2DD4BF" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      color: "#fff",
      transition: "all 0.2s"
    }
  }, hydChecked[item.id] ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, item.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2D1B4E",
      fontSize: 13,
      textDecoration: hydChecked[item.id] ? "line-through" : "none"
    }
  }, item.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.3)",
      fontSize: 10,
      marginTop: 1
    }
  }, item.note)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#2DD4BF"
    }
  }, "+3")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "DRY MOUTH LEVEL (1–10)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => {
      setDryMouth(n);
      saveHydMeta();
    },
    style: {
      width: 38,
      height: 38,
      borderRadius: 7,
      border: "none",
      cursor: "pointer",
      background: dryMouth === n ? n <= 3 ? "#34D399" : n <= 6 ? "#F59E0B" : "#F87171" : "rgba(120,80,160,0.06)",
      color: dryMouth === n ? "#FDFBFF" : "rgba(80,50,120,0.5)",
      fontFamily: "'DM Mono',monospace",
      fontSize: 13,
      fontWeight: 700,
      transition: "all 0.2s"
    }
  }, n))), dryMouth >= 7 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 14px",
      background: "rgba(245,158,11,0.1)",
      border: "1px solid rgba(245,158,11,0.22)",
      borderRadius: 8,
      fontSize: 12,
      color: "#F59E0B"
    }
  }, "Try aloe vera juice or a few sips of water.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "CAFFEINE / SWEET DRINKS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCafCount(c => Math.max(0, c - 1));
      saveHydMeta();
    },
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "rgba(120,80,160,0.06)",
      border: "none",
      color: "#2D1B4E",
      fontSize: 18,
      cursor: "pointer"
    }
  }, "−"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      minWidth: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 32,
      color: cafCount >= 3 ? "#F59E0B" : "#fff"
    }
  }, cafCount), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "rgba(100,60,140,0.3)"
    }
  }, "drinks")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCafCount(c => c + 1);
      saveHydMeta();
    },
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "rgba(120,80,160,0.06)",
      border: "none",
      color: "#2D1B4E",
      fontSize: 18,
      cursor: "pointer"
    }
  }, "+"), cafCount >= 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 11,
      color: "rgba(80,50,120,0.45)",
      lineHeight: 1.5
    }
  }, "Before the next one, try a few sips of water first."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "IC SYMPTOMS TODAY"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setIcFlare(!icFlare);
      saveHydMeta();
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: icFlare ? "rgba(248,113,113,0.12)" : "rgba(120,80,160,0.04)",
      border: `1px solid ${icFlare ? "rgba(248,113,113,0.35)" : "rgba(120,80,160,0.08)"}`,
      borderRadius: 8,
      padding: "12px 14px",
      cursor: "pointer",
      width: "100%",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 4,
      background: icFlare ? "#F87171" : "transparent",
      border: icFlare ? "none" : "1.5px solid rgba(100,60,140,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      color: "#2D1B4E"
    }
  }, icFlare ? "✓" : ""), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#2D1B4E",
      fontSize: 13
    }
  }, "Experiencing a flare today"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.3)",
      fontSize: 10,
      marginTop: 2
    }
  }, "Logged for pattern tracking · no pressure today"))), icFlare && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 14px",
      background: "rgba(248,113,113,0.08)",
      border: "1px solid rgba(248,113,113,0.18)",
      borderRadius: 8,
      fontSize: 12,
      color: "rgba(80,50,120,0.6)",
      lineHeight: 1.6
    }
  }, "Be gentle today. Small sips only. Aloe vera juice may help.")), hydLog.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "DRY MOUTH TREND · 7 DAYS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "flex-end",
      height: 48
    }
  }, hydLog.slice(-7).map(e => {
    const h = e.dryMouth ? e.dryMouth / 10 * 44 + 4 : 4;
    const col = e.dryMouth <= 3 ? "#34D399" : e.dryMouth <= 6 ? "#F59E0B" : "#F87171";
    return /*#__PURE__*/React.createElement("div", {
      key: e.date,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: h,
        background: e.dryMouth ? col : "rgba(120,80,160,0.06)",
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 7,
        color: "rgba(100,60,140,0.2)"
      }
    }, e.date.slice(5)));
  })))), active === "evening" && /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeUp 0.4s ease forwards"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#A78BFA",
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 4
    }
  }, "WIND DOWN · 10:00 PM"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 40,
      color: "#2D1B4E",
      lineHeight: 1
    }
  }, "GOOD EVENING"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.25)",
      fontSize: 12,
      marginTop: 6
    }
  }, puzzleUnlocked ? "🧩 puzzles unlocked" : "complete routine to unlock puzzles")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "EVENING ROUTINE"), EVENING_JOURNEY.map(h => {
    if (!isUnlocked(h)) return null;
    const done = !!eChecked[h.id];
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: {
        borderBottom: "1px solid rgba(120,80,160,0.04)",
        padding: "8px 4px 12px",
        opacity: done ? 0.38 : 1,
        transition: "opacity 0.3s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "habit-check",
      onClick: () => checkHabit(EVENING_JOURNEY, eChecked, setEChecked, h.id),
      style: {
        width: 26,
        height: 26,
        borderRadius: 6,
        flexShrink: 0,
        border: done ? "none" : "1.5px solid rgba(100,60,140,0.15)",
        background: done ? "#34D399" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: "#FDFBFF"
      }
    }, done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, h.emoji), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#2D1B4E",
        fontSize: 13,
        flex: 1,
        textDecoration: done ? "line-through" : "none"
      }
    }, h.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#A78BFA"
      }
    }, "+", h.xp)), h.duration > 0 && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        paddingLeft: 38
      }
    }, /*#__PURE__*/React.createElement(TimerBlock, {
      habit: h,
      onComplete: () => checkHabit(EVENING_JOURNEY, eChecked, setEChecked, h.id)
    })));
  }), customEvening.map(item => {
    const done = !!customChecked[item.id];
    return /*#__PURE__*/React.createElement("div", {
      key: item.id,
      style: {
        borderBottom: "1px solid rgba(120,80,160,0.04)",
        padding: "8px 4px 12px",
        opacity: done ? 0.38 : 1,
        transition: "opacity 0.3s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "habit-check",
      onClick: () => toggleCustomEvening(item.id),
      style: {
        width: 26,
        height: 26,
        borderRadius: 6,
        flexShrink: 0,
        border: done ? "none" : "1.5px solid rgba(100,60,140,0.15)",
        background: done ? "#34D399" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: "#FDFBFF"
      }
    }, done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, "✨"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#2D1B4E",
        fontSize: 13,
        flex: 1,
        textDecoration: done ? "line-through" : "none"
      }
    }, item.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: "#A78BFA"
      }
    }, "+10")));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: newCustom,
    onChange: e => setNewCustom(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") addCustomEvening();
    },
    placeholder: "Remembered something else? Add it...",
    style: {
      flex: 1,
      background: "rgba(120,80,160,0.04)",
      border: "1px solid rgba(120,80,160,0.08)",
      borderRadius: 8,
      padding: "9px 12px",
      color: "#2D1B4E",
      fontSize: 12,
      fontFamily: "'DM Mono',monospace"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addCustomEvening,
    style: {
      background: "#A78BFA",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px 14px",
      fontSize: 16,
      cursor: "pointer",
      fontWeight: 700,
      lineHeight: 1
    }
  }, "+"))), availEvening.some(h => h.id === "gratitude") && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "GRATITUDE JOURNAL"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: gratXp ? "#34D399" : "#A78BFA"
    }
  }, gratXp ? "✓ +30 XP" : "+30 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(80,50,120,0.5)",
      marginBottom: 10,
      fontStyle: "italic"
    }
  }, gratPrompt), /*#__PURE__*/React.createElement("textarea", {
    value: gratText,
    onChange: e => setGratText(e.target.value),
    onBlur: () => {
      if (!gratXp && gratText.trim().length > 20) {
        setGratXp(true);
        awardXP(30);
      }
    },
    placeholder: "1. \n2. \n3.",
    rows: 4,
    style: {
      width: "100%",
      background: "rgba(120,80,160,0.04)",
      border: `1px solid ${gratXp ? "rgba(52,211,153,0.25)" : "rgba(120,80,160,0.07)"}`,
      borderRadius: 8,
      padding: 14,
      color: "#2D1B4E",
      fontSize: 13,
      fontFamily: "'DM Mono',monospace",
      lineHeight: 1.7,
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowGratScan(true),
    style: {
      background: "none",
      border: "none",
      color: "rgba(167,139,250,0.6)",
      fontSize: 11,
      cursor: "pointer",
      textDecoration: "underline",
      padding: "4px 0",
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, "📷 Also scan my physical journal"), showGratScan && /*#__PURE__*/React.createElement(HandwritingScan, {
    previousText: lastGratText,
    xpLabel: "(+30 XP)",
    onComplete: text => {
      setGratText(prev => prev ? prev + "\n\n" + text : text);
      if (!gratXp) {
        setGratXp(true);
        awardXP(30);
      }
      const u = {
        ...load(),
        lastGratText: text
      };
      save(u);
      setLastGratText(text);
    },
    onClose: () => setShowGratScan(false)
  })), availEvening.some(h => h.id === "todo") && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "TOMORROW'S TO-DO"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: todoXp ? "#34D399" : "#A78BFA"
    }
  }, todoXp ? "✓ +15 XP" : "+15 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: newTodo,
    onChange: e => setNewTodo(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        if (!newTodo.trim()) return;
        setTodos(t => [...t, {
          id: Date.now(),
          text: newTodo.trim(),
          done: false
        }]);
        setNewTodo("");
        if (!todoXp) {
          setTodoXp(true);
          awardXP(15);
        }
      }
    },
    placeholder: "Add a task for tomorrow...",
    style: {
      flex: 1,
      background: "rgba(120,80,160,0.04)",
      border: "1px solid rgba(120,80,160,0.07)",
      borderRadius: 8,
      padding: "10px 14px",
      color: "#2D1B4E",
      fontSize: 13,
      fontFamily: "'DM Mono',monospace"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!newTodo.trim()) return;
      setTodos(t => [...t, {
        id: Date.now(),
        text: newTodo.trim(),
        done: false
      }]);
      setNewTodo("");
      if (!todoXp) {
        setTodoXp(true);
        awardXP(15);
      }
    },
    style: {
      background: "#A78BFA",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "10px 16px",
      fontSize: 18,
      cursor: "pointer",
      fontWeight: 700,
      lineHeight: 1
    }
  }, "+")), todos.map(todo => /*#__PURE__*/React.createElement("div", {
    key: todo.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 4px",
      borderBottom: "1px solid rgba(120,80,160,0.04)",
      opacity: todo.done ? 0.38 : 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setTodos(t => t.map(x => x.id === todo.id ? {
      ...x,
      done: !x.done
    } : x)),
    style: {
      width: 18,
      height: 18,
      borderRadius: 4,
      flexShrink: 0,
      border: todo.done ? "none" : "1.5px solid rgba(100,60,140,0.15)",
      background: todo.done ? "#34D399" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      color: "#fff",
      cursor: "pointer"
    }
  }, todo.done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#2D1B4E",
      fontSize: 13,
      flex: 1,
      textDecoration: todo.done ? "line-through" : "none",
      cursor: "pointer"
    },
    onClick: () => setTodos(t => t.map(x => x.id === todo.id ? {
      ...x,
      done: !x.done
    } : x))
  }, todo.text)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SL
  }, "🧩 PUZZLE TIME"), !puzzleUnlocked ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(120,80,160,0.03)",
      border: "1px dashed rgba(120,80,160,0.1)",
      borderRadius: 10,
      padding: 24,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      marginBottom: 8,
      filter: "grayscale(1)",
      opacity: 0.3
    }
  }, "🧩"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 20,
      color: "rgba(100,60,140,0.35)"
    }
  }, "LOCKED"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(100,60,140,0.2)",
      marginTop: 6
    }
  }, "Complete your evening routine to unlock.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(167,139,250,0.08)",
      border: "1px solid rgba(167,139,250,0.3)",
      borderRadius: 10,
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 20,
      color: "#7C3AED",
      marginBottom: 12
    }
  }, "YOU EARNED THIS 🧩"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, [{
    name: "NYT Mini Crossword",
    emoji: "📰",
    url: "https://www.nytimes.com/crosswords/game/mini"
  }, {
    name: "Wordle",
    emoji: "🟩",
    url: "https://www.nytimes.com/games/wordle/index.html"
  }, {
    name: "Connections",
    emoji: "🔗",
    url: "https://www.nytimes.com/games/connections"
  }, {
    name: "Spelling Bee",
    emoji: "🐝",
    url: "https://www.nytimes.com/puzzles/spelling-bee"
  }].map(p => /*#__PURE__*/React.createElement("a", {
    key: p.name,
    href: p.url,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      background: "rgba(167,139,250,0.1)",
      borderRadius: 8,
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, p.emoji), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#2D1B4E",
      fontSize: 13,
      fontFamily: "'DM Mono',monospace"
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      color: "rgba(100,60,140,0.3)",
      fontSize: 11
    }
  }, "→")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "10px 12px",
      background: "rgba(248,113,113,0.08)",
      border: "1px solid rgba(248,113,113,0.18)",
      borderRadius: 8,
      fontSize: 11,
      color: "rgba(80,50,120,0.5)",
      textAlign: "center"
    }
  }, "🛑 Hard stop: 11:00 PM")))), active === "shop" && /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeUp 0.4s ease forwards"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#34D399",
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 4
    }
  }, "SHOPPING LIST"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 40,
      color: "#2D1B4E",
      lineHeight: 1
    }
  }, "WHAT DO YOU NEED?"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(100,60,140,0.25)",
      fontSize: 12,
      marginTop: 6
    }
  }, shopItems.filter(x => !x.done).length, " items left · ", shopItems.filter(x => x.done).length, " done")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: shopInput,
    onChange: e => setShopInput(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") addShopItem();
    },
    placeholder: "Add anything...",
    style: {
      flex: 1,
      background: "rgba(120,80,160,0.04)",
      border: "1px solid rgba(120,80,160,0.09)",
      borderRadius: 8,
      padding: "11px 14px",
      color: "#2D1B4E",
      fontSize: 13,
      fontFamily: "'DM Mono',monospace"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addShopItem,
    style: {
      background: "#34D399",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "11px 16px",
      fontSize: 20,
      cursor: "pointer",
      fontWeight: 700,
      lineHeight: 1
    }
  }, "+")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap"
    }
  }, SHOP_CATS.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => setShopCat(c.id),
    style: {
      padding: "4px 10px",
      borderRadius: 20,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontFamily: "'DM Mono',monospace",
      background: shopCat === c.id ? "#34D399" : "rgba(120,80,160,0.06)",
      color: shopCat === c.id ? "#FDFBFF" : "rgba(80,50,120,0.5)",
      transition: "all 0.15s"
    }
  }, c.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      marginBottom: 18
    }
  }, ["all", "todo", "done"].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setShopFilter(f),
    style: {
      flex: 1,
      padding: "6px 0",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontFamily: "'DM Mono',monospace",
      background: shopFilter === f ? "rgba(74,222,128,0.15)" : "rgba(120,80,160,0.04)",
      color: shopFilter === f ? "#34D399" : "rgba(100,60,140,0.3)",
      transition: "all 0.15s"
    }
  }, f === "all" ? "ALL" : f === "todo" ? "TO GET" : "DONE"))), SHOP_CATS.map(cat => {
    const items = shopItems.filter(x => x.cat === cat.id && (shopFilter === "all" || shopFilter === "todo" && !x.done || shopFilter === "done" && x.done));
    if (!items.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: cat.id,
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "rgba(100,60,140,0.3)",
        letterSpacing: 2,
        marginBottom: 10
      }
    }, cat.label), items.map(item => /*#__PURE__*/React.createElement("div", {
      key: item.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 4px",
        borderBottom: "1px solid rgba(120,80,160,0.04)",
        opacity: item.done ? 0.38 : 1,
        transition: "opacity 0.2s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => toggleShopItem(item.id),
      style: {
        width: 22,
        height: 22,
        borderRadius: 5,
        flexShrink: 0,
        border: item.done ? "none" : "1.5px solid rgba(100,60,140,0.15)",
        background: item.done ? "#34D399" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        color: "#FDFBFF",
        cursor: "pointer",
        transition: "all 0.2s"
      }
    }, item.done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
      onClick: () => toggleShopItem(item.id),
      style: {
        color: "#2D1B4E",
        fontSize: 13,
        flex: 1,
        textDecoration: item.done ? "line-through" : "none",
        cursor: "pointer"
      }
    }, item.text), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteShopItem(item.id),
      style: {
        background: "none",
        border: "none",
        color: "rgba(100,60,140,0.2)",
        fontSize: 16,
        cursor: "pointer",
        padding: "0 4px",
        lineHeight: 1
      }
    }, "×"))));
  }), shopItems.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 0",
      color: "rgba(100,60,140,0.15)",
      fontSize: 13
    }
  }, "Nothing on the list yet.", /*#__PURE__*/React.createElement("br", null), "Add something above."), shopItems.some(x => x.done) && /*#__PURE__*/React.createElement("button", {
    onClick: clearDoneShop,
    style: {
      width: "100%",
      padding: "12px 0",
      background: "rgba(120,80,160,0.04)",
      border: "1px solid rgba(120,80,160,0.08)",
      borderRadius: 8,
      color: "rgba(100,60,140,0.3)",
      fontFamily: "'DM Mono',monospace",
      fontSize: 12,
      cursor: "pointer",
      marginTop: 8
    }
  }, "Clear done items")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 10,
      color: "rgba(120,80,160,0.08)",
      letterSpacing: 3,
      marginTop: 32
    }
  }, "YOU SHOWED UP TODAY.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setParalysisStep(PARALYSIS[Math.floor(Math.random() * PARALYSIS.length)]);
      setShowParalysis(true);
    },
    style: {
      position: "fixed",
      bottom: 24,
      right: 20,
      zIndex: 180,
      width: 54,
      height: 54,
      borderRadius: "50%",
      background: "linear-gradient(135deg,#C084FC,#A78BFA)",
      border: "none",
      cursor: "pointer",
      fontSize: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
    }
  }, "🆘"));
}
