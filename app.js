(() => {
  "use strict";

  // Where Kata should ping you with a custom time
  const NOTIFY = {
    instagramUrl: "https://www.instagram.com/umarbekerkinboev/",
    instagramHandle: "@umarbekerkinboev",
  };

  const scenes = {
    boot: document.getElementById("scene-boot"),
    briefing: document.getElementById("scene-briefing"),
    schedule: document.getElementById("scene-schedule"),
    reveal: document.getElementById("scene-reveal"),
    custom: document.getElementById("scene-custom"),
    rsvp: document.getElementById("scene-rsvp"),
  };

  const progressBar = document.getElementById("progress-bar");
  const toast = document.getElementById("toast");
  const slotsRoot = document.getElementById("slots");
  const scheduleEyebrow = document.getElementById("schedule-eyebrow");
  const scheduleTitle = document.getElementById("schedule-title");
  const scheduleLede = document.getElementById("schedule-lede");
  const rsvpEyebrow = document.getElementById("rsvp-eyebrow");
  const rsvpTitle = document.getElementById("rsvp-title");
  const rsvpLede = document.getElementById("rsvp-lede");
  const rsvpWhen = document.getElementById("rsvp-when");
  const customDay = document.getElementById("custom-day");
  const customTime = document.getElementById("custom-time");
  const customNote = document.getElementById("custom-note");
  const btnNotify = document.getElementById("btn-notify");
  const notifyHint = document.getElementById("notify-hint");
  const smilePop = document.getElementById("smile-pop");
  let smileTimer = 0;
  let unlockTimer = 0;

  const blocked = { aug12: false, aug13: false };
  let transitioning = false;
  let current = "boot";
  let lastPingMessage = "";

  const progressMap = {
    boot: "10%",
    briefing: "28%",
    schedule: "52%",
    reveal: "78%",
    custom: "78%",
    rsvp: "100%",
  };

  const copy = {
    aug12: {
      blocked:
        "💥 Shift detected. Aug 12 ~5 PM just got webbed into the ‘nope’ pile.",
      status: "Shift 💀",
    },
    aug13: {
      blocked:
        "Also cursed. Aug 13 ~6 PM vs your job — job wins. Decrypting the real slot…",
      status: "Shift 💀",
    },
  };

  function vibrate(pattern = 10) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (_) {
      /* ignore */
    }
  }

  function showToast(message, ok = false) {
    toast.hidden = false;
    toast.textContent = message;
    toast.classList.toggle("toast--ok", ok);
    toast.style.animation = "none";
    void toast.offsetWidth;
    toast.style.animation = "";
  }

  function hideSmile() {
    window.clearTimeout(smileTimer);
    smilePop.classList.remove("smile-pop--show");
    smilePop.hidden = true;
  }

  function hideNotify() {
    btnNotify.hidden = true;
    notifyHint.hidden = true;
    btnNotify.removeAttribute("href");
    btnNotify.onclick = null;
  }

  function buildPingMessage(whenText, note) {
    const noteBit = note ? ` Note: ${note}` : "";
    return `Hey Umar! For Spider-Man BND at Corvin Mozi, how about: ${whenText}?${noteBit}`;
  }

  function copyPingMessage() {
    if (!lastPingMessage || !navigator.clipboard) {
      return Promise.resolve(false);
    }
    return navigator.clipboard
      .writeText(lastPingMessage)
      .then(() => true)
      .catch(() => false);
  }

  function setupNotify(whenText, note, kind = "custom") {
    lastPingMessage =
      kind === "aug14"
        ? `Aug 14, 5 PM is good.`
        : buildPingMessage(whenText, note);

    btnNotify.hidden = false;
    notifyHint.hidden = false;
    notifyHint.textContent =
      kind === "aug14"
        ? `Opens ${NOTIFY.instagramHandle} — tap so I actually know you said yes.`
        : `Opens ${NOTIFY.instagramHandle} — your suggested time gets copied so you can paste it in DMs.`;
    btnNotify.textContent =
      kind === "aug14" ? "Tell Umar I’m in" : "Text Umar on Instagram";
    btnNotify.href = NOTIFY.instagramUrl;
    btnNotify.onclick = () => {
      copyPingMessage().then((ok) => {
        notifyHint.textContent = ok
          ? "Message copied ✓ — paste it in my Instagram DMs."
          : `Paste this in DMs: ${lastPingMessage}`;
      });
    };
  }

  function goTo(name) {
    if (transitioning || name === current || !scenes[name]) return;
    transitioning = true;
    const from = scenes[current];
    const to = scenes[name];

    if (current === "schedule") {
      hideSmile();
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    from.classList.add("scene--exit");
    from.classList.remove("scene--active");

    window.setTimeout(() => {
      from.hidden = true;
      from.classList.remove("scene--exit");

      to.hidden = false;
      requestAnimationFrame(() => {
        to.classList.add("scene--active");
        current = name;
        progressBar.style.width = progressMap[name] || "0%";
        transitioning = false;
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }, 280);
  }

  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      vibrate(8);
      goTo(btn.getAttribute("data-next"));
    });
  });

  function bothBlocked() {
    return blocked.aug12 && blocked.aug13;
  }

  function unlockFinalSlot() {
    const finalSlot = slotsRoot.querySelector('[data-slot="aug14"]');
    if (!finalSlot || !finalSlot.disabled) return;

    finalSlot.disabled = false;
    finalSlot.classList.remove("slot--locked");
    finalSlot.classList.add("slot--ready");
    finalSlot.querySelector(".slot__status").textContent = "Survivor";

    scheduleEyebrow.textContent = "DECRYPT COMPLETE";
    scheduleTitle.innerHTML = 'One slot<br /><span class="red">survived.</span>';
    scheduleLede.textContent =
      "Friday Aug 14 around 5 PM. Tap it — or you’ll get to suggest your own time next.";

    showToast("Classified slot unlocked. The survivor awaits.", true);
    vibrate([12, 40, 18]);
  }

  slotsRoot.addEventListener("click", (e) => {
    const slot = e.target.closest(".slot");
    if (!slot || slot.disabled) return;

    const key = slot.dataset.slot;
    vibrate(10);

    if (key === "aug12" || key === "aug13") {
      if (blocked[key]) {
        showToast(copy[key].blocked);
        return;
      }

      blocked[key] = true;
      slot.classList.add("slot--blocked");
      slot.querySelector(".slot__status").textContent = copy[key].status;
      showToast(copy[key].blocked);

      if (bothBlocked()) {
        window.clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(unlockFinalSlot, 700);
      }
      return;
    }

    if (key === "compliment") {
      slot.classList.add("slot--compliment-hit");
      smilePop.hidden = false;
      smilePop.classList.remove("smile-pop--show");
      void smilePop.offsetWidth;
      smilePop.classList.add("smile-pop--show");
      window.clearTimeout(smileTimer);
      smileTimer = window.setTimeout(() => {
        smilePop.classList.remove("smile-pop--show");
        smilePop.hidden = true;
      }, 2600);
      return;
    }

    if (key === "aug14") {
      goTo("reveal");
    }
  });

  function finishAccept(whenText) {
    rsvpEyebrow.textContent = "MISSION ACCEPTED";
    rsvpTitle.textContent = "See you at Corvin, Kata.";
    rsvpLede.textContent =
      "Almost locked — one last tap so Umar gets the memo on Instagram.";
    rsvpWhen.textContent = whenText;
    setupNotify(whenText, "", "aug14");
    lastPingMessage = "Aug 14, 5 PM is good.";
    copyPingMessage();
    window.open(NOTIFY.instagramUrl, "_blank", "noopener,noreferrer");
    notifyHint.textContent =
      "If Instagram didn’t open, tap below. A ready-made “I’m in” message should be copied.";
    goTo("rsvp");
  }

  document.getElementById("btn-accept-14").addEventListener("click", () => {
    vibrate(8);
    finishAccept("Friday, August 14 · around 5:00 PM");
  });

  function formatCustomWhen(dayValue, timeValue) {
    const time = timeValue && timeValue.length >= 4 ? timeValue : "17:00";
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayValue);
    const clock = /^(\d{2}):(\d{2})/.exec(time);
    if (!parts || !clock) return null;

    const date = new Date(
      Number(parts[1]),
      Number(parts[2]) - 1,
      Number(parts[3]),
      Number(clock[1]),
      Number(clock[2]),
      0,
      0
    );
    if (Number.isNaN(date.getTime())) return null;

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const prettyTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dayName}, ${monthDay} · around ${prettyTime}`;
  }

  document.getElementById("btn-submit-custom").addEventListener("click", () => {
    const dayValue = customDay.value;
    const timeValue = customTime.value;
    const note = (customNote.value || "").trim();

    customDay.classList.toggle("field__input--error", !dayValue);
    if (!dayValue) {
      vibrate([20, 30, 20]);
      customDay.focus();
      return;
    }

    const whenText = formatCustomWhen(dayValue, timeValue);
    if (!whenText) {
      customDay.classList.add("field__input--error");
      return;
    }

    vibrate(8);
    lastPingMessage = buildPingMessage(whenText, note);
    // Open Instagram in the same user gesture (before any await)
    copyPingMessage();
    window.open(NOTIFY.instagramUrl, "_blank", "noopener,noreferrer");

    rsvpEyebrow.textContent = "SCHEDULE OVERRIDE";
    rsvpTitle.textContent = "Your time, Kata.";
    rsvpLede.textContent =
      "Got it — Instagram should be open. Paste the copied time in my DMs so I can lock tickets.";
    rsvpWhen.textContent = note ? `${whenText} · “${note}”` : whenText;
    setupNotify(whenText, note, "custom");
    notifyHint.textContent =
      "If Instagram didn’t open, tap below. Your time should already be copied.";
    goTo("rsvp");
  });

  document.getElementById("btn-replay").addEventListener("click", () => {
    window.clearTimeout(unlockTimer);
    blocked.aug12 = false;
    blocked.aug13 = false;
    toast.hidden = true;
    hideSmile();
    hideNotify();
    customDay.value = "2026-08-15";
    customTime.value = "17:00";
    customNote.value = "";
    customDay.classList.remove("field__input--error");

    slotsRoot.querySelectorAll(".slot").forEach((slot) => {
      const key = slot.dataset.slot;
      slot.classList.remove("slot--blocked", "slot--ready", "slot--compliment-hit");
      if (key === "aug14") {
        slot.disabled = true;
        slot.classList.add("slot--locked");
        slot.querySelector(".slot__status").textContent = "Classified";
      } else if (key === "compliment") {
        slot.disabled = false;
        slot.querySelector(".slot__status").textContent = "Tap me";
      } else {
        slot.disabled = false;
        slot.querySelector(".slot__status").textContent = "Looks free?";
      }
    });

    scheduleEyebrow.textContent = "HIGHLY SCIENTIFIC AVAILABILITY TEST";
    scheduleTitle.innerHTML =
      'Pick a time.<br /><span class="soft" style="font-size:.55em;color:var(--muted)">Or watch them fail.</span>';
    scheduleLede.textContent =
      "Two decoy slots first. The algorithm (me) already knows the plot twist.";

    goTo("boot");
  });

  customDay.value = "2026-08-15";

  const canvas = document.getElementById("web-canvas");
  const ctx = canvas && canvas.getContext("2d", { alpha: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let nodes = [];
  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    if (!ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = w < 480 ? 22 : 34;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
    }));
  }

  function frame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const maxDist = w < 480 ? 100 : 130;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.strokeStyle = `rgba(225, 40, 55, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(244, 246, 251, 0.3)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);
  }

  if (!reduceMotion && ctx) {
    resize();
    frame();
    window.addEventListener(
      "resize",
      () => {
        cancelAnimationFrame(raf);
        resize();
        frame();
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(frame);
      }
    });
  }
})();
