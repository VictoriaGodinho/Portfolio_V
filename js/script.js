/* -----------------------------------
   MAIN INTERACTIONS & ANIMATIONS
----------------------------------- */

/* 1. Split kinetic headlines into spans for letter animations */
function splitToSpans(el) {
  const text = el.textContent;
  el.textContent = "";
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch;
    el.appendChild(span);
  }
}

document.querySelectorAll("[data-kinetic]").forEach(splitToSpans);

/* 2. Animate each letter when it scrolls into view */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const chars = entry.target.querySelectorAll(".char");
      chars.forEach((c, i) => {
        c.style.transition = `transform .8s var(--ease-std) ${i * 12}ms, opacity .8s var(--ease-std) ${i * 12}ms`;
        c.style.transform = "translateY(0) rotate(0)";
        c.style.opacity = 1;
      });
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll("[data-kinetic]").forEach((h) => io.observe(h));

/* 3. Hover shine follows cursor on project cards */
document.querySelectorAll(".card").forEach((card) => {
  const shine = card.querySelector(".shine");
  if (!shine) return;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100 + "%";
    const my = ((e.clientY - rect.top) / rect.height) * 100 + "%";
    shine.style.setProperty("--mx", mx);
    shine.style.setProperty("--my", my);
  });
});

/* 4. Subtle scroll-based opacity + position animation (about section) */
const scrubs = document.querySelectorAll("#about [data-scrub]");
window.addEventListener("scroll", () => {
  const vh = window.innerHeight;
  scrubs.forEach((el) => {
    const r = el.getBoundingClientRect();
    const p = 1 - Math.min(Math.max(r.top / (vh * 0.9), 0), 1); // 0..1
    el.style.transform = `translateY(${(1 - p) * 18}px)`;
    el.style.opacity = (0.6 + p * 0.4).toFixed(3);
  });
}, { passive: true });

/* 5. Simple parallax elements (image or background) */
const parallaxEls = document.querySelectorAll(".parallax");
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  parallaxEls.forEach((el) => {
    const d = parseFloat(el.dataset.depth || "0.1");
    el.style.transform = `translateY(${y * d}px)`;
  });
}, { passive: true });

/* 6. Works page – fullscreen modal system */
const modal = document.getElementById("projectModal");
if (modal) {
  const pmImg = document.getElementById("pmImg");
  const pmTitle = document.getElementById("pmTitle");
  const pmDesc = document.getElementById("pmDesc");

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const data = JSON.parse(card.dataset.project);
      pmImg.src = data.img;
      pmTitle.textContent = data.title;
      pmDesc.textContent = data.desc;
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });

  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close], .project-backdrop")) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  });
}

/* 7. Contact page – animated cursor trail using Canvas */
const canvas = document.getElementById("trail");
if (canvas) {
  const ctx = canvas.getContext("2d");

  function fit() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * window.devicePixelRatio;
    canvas.height = r.height * window.devicePixelRatio;
  }
  fit();
  window.addEventListener("resize", fit);

  const particles = [];
  let hue = 300;

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * window.devicePixelRatio;
    const y = (e.clientY - rect.top) * window.devicePixelRatio;
    for (let i = 0; i < 6; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        life: 1,
        r: 3 + Math.random() * 2,
      });
    }
  });

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hue += 0.2;
    if (hue > 360) hue = 0;

    // soft gradient background
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, `hsla(${hue % 360},70%,60%,.08)`);
    g.addColorStop(1, `hsla(${(hue + 60) % 360},70%,60%,.08)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      p.r *= 0.992;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${(hue + 180) % 360},90%,65%,${p.life})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* 8. Footer – dynamic year */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- Canvas Unlock Interaction ---
const trailCanvas = document.getElementById("trail");
let isDragging = false;
let dragDistance = 0;
let lastX = 0, lastY = 0;

if (trailCanvas) {
  trailCanvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  });

  trailCanvas.addEventListener("mouseup", () => {
    isDragging = false;
    if (dragDistance > 200) unlockGallery();
    dragDistance = 0;
  });

  trailCanvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const dx = e.offsetX - lastX;
      const dy = e.offsetY - lastY;
      dragDistance += Math.sqrt(dx * dx + dy * dy);
      lastX = e.offsetX;
      lastY = e.offsetY;
    }
  });
}

function unlockGallery() {
  const msg = document.createElement("div");
  msg.className = "unlock-msg";
  msg.innerHTML = `✨ You’ve unlocked the gallery.<br><a href="gallery.html">Enter Exhibition →</a>`;
  document.body.appendChild(msg);
  setTimeout(() => msg.classList.add("show"), 100);
}

