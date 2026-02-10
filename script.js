document.addEventListener("DOMContentLoaded", () => {
  // Знаходимо всі потрібні шматки HTML
  const form = document.getElementById("ai-form");
  const overlay = document.getElementById("hero-overlay");
  const loader = document.querySelector(".loader");
  const input = document.querySelector(".input-field");
  const btn = document.querySelector(".generate-btn");
  const siteContainer = document.getElementById("site-container");

  // Запускаємо базові стилі для майбутнього сайту
  injectGlobalStyles();
  initScrollObserver();

  // Коли натискають "Згенерувати"
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Щоб сторінка не перезавантажувалась
    const promptText = input.value.trim();

    // Якщо пусто - нічого не робимо
    if (!promptText) return;

    // Блокуємо кнопку, щоб не тикали сто разів, поки воно думає
    input.disabled = true;
    btn.disabled = true;
    const originalBtnText = btn.innerHTML;

    // Малюємо крутилку на кнопці
    btn.innerHTML = `
      <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" stroke-opacity="0.3"></circle>
        <path d="M4 12a8 8 0 018-8v8H4z" fill="white"></path>
      </svg>
      <span>Працюю...</span>
    `;

    // Показуємо термінальний лоадер (типу хакери)
    loader.classList.remove("hidden");

    try {
      // Стукаємо до Штучного Інтелекту через наш Google Proxy
      const siteData = await generateSiteContent(promptText);

      // Одразу фарбуємо сайт, щоб юзер кайфонув від кольорів
      applyTheme(siteData.theme);

      // Збираємо HTML з того, що нам відповів AI
      const generatedHTML = renderHTML(siteData);
      siteContainer.innerHTML = generatedHTML;

      // Вмикаємо акордеони (це для FAQ)
      activateAccordion();

      // Успіх! Ховаємо шторку і показуємо сайт
      setTimeout(() => {
        overlay.classList.add("hero-overlay--hidden");
        document.body.style.overflow = "auto"; // Дозволяємо скролити

        // Запускаємо анімації появи блоків
        setTimeout(() => checkScrollAnimation(), 100);

        // Повертаємо все як було, якщо захочуть ще раз
        btn.innerHTML = originalBtnText;
        input.disabled = false;
        btn.disabled = false;
        loader.classList.add("hidden");
      }, 500);
    } catch (error) {
      console.error("Блін, помилка:", error);
      alert(`Щось пішло не так: ${error.message}`);

      // Відкатуємо все назад
      input.disabled = false;
      btn.disabled = false;
      loader.classList.add("hidden");
      btn.innerHTML = originalBtnText;
    }
  });
});

// ==========================================
// 1. ЛОГІКА ГЕНЕРАЦІЇ (Через Google Proxy)
// ==========================================
async function generateSiteContent(prompt) {
  // Перевіряємо, чи є посилання на проксі в config.js
  if (!CONFIG.API_URL || !CONFIG.API_URL.startsWith("http")) {
    throw new Error("Не налаштований API_URL у файлі config.js! Перевір файл.");
  }

  // Інструкція для нейронки.
  const systemPrompt = `
    You are an Award-Winning Senior UX Designer & Brand Strategist.
    Target: Create a high-converting landing page for: "${prompt}".
    Language: Ukrainian.
    
    🎨 COLOR PSYCHOLOGY RULES (CRITICAL):
    Analyze the prompt's mood and generate a CUSTOM color palette.
    - If "Coffee/Bakery" -> Use Warm Browns, Beige, Gold.
    - If "Tech/AI" -> Use Neon Blue, Purple, Cyan.
    - If "Eco/Nature" -> Use Deep Greens, Earth tones, Lime.
    - If "Luxury/Finance" -> Use Navy Blue, Gold, Silver.
    - If "Gym/Sport" -> Use Aggressive Red, Orange, Black.
    
    STRICT CONTENT RULES:
    1. Tone: Confident, Short, Apple-style (No fluff).
    2. Hero: Bold headline + clear benefit.
    3. Features: EXACTLY 4 cards.
    4. Pricing: EXACTLY 3 plans.
    
    JSON OUTPUT ONLY. Structure:
    {
        "theme": { 
            "bg": "#0a0a0a",  // Always keep it dark for this template
            "primary": "#HEX", // Main brand color (Buttons, Highlights)
            "secondary": "#HEX", // Complementary color (Gradients)
            "accent": "#HEX" // Pop color for badges/icons
        },
        "content": {
            "name": "BrandName", "emoji": "⚡", 
            "nav": ["Product", "Solutions", "Pricing", "FAQ"],
            "hero": { "title": "Headline", "subtitle": "Subtext", "btn": "Action" },
            "about": { 
                "title": "Mission", "story": "Text", 
                "stats": [ { "value": "10x", "label": "Growth" }, { "value": "100+", "label": "Clients" }, { "value": "24/7", "label": "Support" } ],
                "visualEmoji": "🚀" 
            },
            "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
            "features": [
                { "title": "F1", "desc": "Desc", "icon": "ICON" },
                { "title": "F2", "desc": "Desc", "icon": "ICON" },
                { "title": "F3", "desc": "Desc", "icon": "ICON" },
                { "title": "F4", "desc": "Desc", "icon": "ICON" }
            ],
            "pricing": [
                { "plan": "S", "price": "$10", "desc": "D" },
                { "plan": "M", "price": "$20", "desc": "D", "popular": true },
                { "plan": "L", "price": "$30", "desc": "D" }
            ],
            "testimonials": [
                { "name": "N", "role": "R", "text": "T" },
                { "name": "N", "role": "R", "text": "T" },
                { "name": "N", "role": "R", "text": "T" }
            ],
            "faq": [ 
                { "q": "Q", "a": "A" },
                { "q": "Q", "a": "A" },
                { "q": "Q", "a": "A" },
                { "q": "Q", "a": "A" }
            ],
            "footerText": "© 2026"
        }
    }
  `;

  // 🔥 ГОЛОВНА ЗМІНА: Шлемо запит на Google Apps Script
  // Ми не додаємо сюди заголовок Authorization, бо ключ вже схований в Google Script
  const response = await fetch(CONFIG.API_URL, {
    method: "POST",
    // Використовуємо text/plain, щоб уникнути проблем з CORS на стороні Google (лайфхак)
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate landing page for: ${prompt}` },
      ],
      model: CONFIG.MODEL || "llama-3.3-70b-versatile",
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Proxy Error: ${errText}`);
  }

  const data = await response.json();

  // Якщо Google повернув помилку всередині JSON
  if (data.error) {
    throw new Error(`Proxy Script Error: ${data.error}`);
  }

  // Google віддає нам відповідь від Groq, парсимо контент
  return JSON.parse(data.choices[0].message.content);
}

// ==========================================
// 2. ДВИГУН ТЕМ (Фарбуємо сайт)
// ==========================================
function applyTheme(theme) {
  const root = document.documentElement;

  // Закидаємо кольори в CSS змінні
  root.style.setProperty("--bg-space-dark", theme.bg);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--accent", theme.accent);

  // Конвертуємо HEX в RGB, бо CSS прозорість не розуміє інакше
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  root.style.setProperty("--primary-rgb", hexToRgb(theme.primary));
  root.style.setProperty("--secondary-rgb", hexToRgb(theme.secondary));
}

// ==========================================
// 3. HTML РЕНДЕР (Збираємо сайт з шматків)
// ==========================================
function renderHTML(data) {
  const c = data.content;
  const mainEmoji = c.emoji || "✨";

  // Рядок, що біжить (Marquee)
  const starIcon = `<span style="color:var(--primary)">✦</span>`;
  const repeatedTags = Array(6).fill(c.tags).flat();
  const marqueeItems = repeatedTags
    .map((t) => `<div class="marquee-item">${starIcon} ${t}</div>`)
    .join("");

  // Картки переваг
  const featuresHTML = (c.features || [])
    .map(
      (f, i) => `
      <div class="feature-card scroll-hidden" style="transition-delay: ${i * 50}ms">
          <div class="icon-box">${f.icon}</div>
          <h3>${f.title}</h3>
          <p>${f.desc}</p>
      </div>
  `,
    )
    .join("");

  // Статистика (циферки)
  const statsHTML = (c.about.stats || [])
    .map(
      (s) => `
      <div class="stat-card">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
      </div>
  `,
    )
    .join("");

  // Блок "Про нас"
  const aboutHTML = c.about
    ? `
    <section class="section-padding">
        <div class="container about-grid">
            <div class="about-content scroll-hidden">
                <div class="label-tag">Про нас</div>
                <h2 class="section-title" style="text-align:left; margin-bottom: 20px;">${c.about.title}</h2>
                <p class="about-text">${c.about.story}</p>
                <div class="stats-grid" style="margin-top: 30px;">${statsHTML}</div>
            </div>
            <div class="visual-card scroll-hidden" style="transition-delay: 200ms">
                <div class="floating-emoji">${c.about.visualEmoji}</div>
                <div class="visual-glow"></div>
            </div>
        </div>
    </section>
  `
    : "";

  // Ціни (Тарифи)
  const pricingHTML = c.pricing
    ? `
    <section class="section-padding bg-darker">
        <div class="container">
            <h2 class="section-title center scroll-hidden">Тарифи</h2>
            <div class="pricing-grid">
                ${c.pricing
                  .map(
                    (p, i) => `
                    <div class="pricing-card ${p.popular ? "popular" : ""} scroll-hidden" style="transition-delay: ${i * 100}ms">
                        ${p.popular ? `<div class="badge">BEST CHOICE</div>` : ""}
                        <div class="plan-name">${p.plan}</div>
                        <div class="price">${p.price}</div>
                        <p class="plan-desc">${p.desc}</p>
                        <button class="btn-block ${p.popular ? "btn-primary" : "btn-glass"}">Обрати</button>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
    </section>
  `
    : "";

  // Відгуки
  const testimonialsHTML = c.testimonials
    ? `
    <section class="section-padding">
        <div class="container">
            <h2 class="section-title center scroll-hidden">Відгуки</h2>
            <div class="testimonials-grid">
                ${c.testimonials
                  .map(
                    (t, i) => `
                    <div class="review-card scroll-hidden" style="transition-delay: ${i * 100}ms">
                        <div class="quote">“</div>
                        <p class="review-text">${t.text}</p>
                        <div class="author">
                            <div class="avatar">${t.name[0]}</div>
                            <div class="author-info">
                                <div class="name">${t.name}</div>
                                <div class="role">${t.role}</div>
                            </div>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
    </section>
  `
    : "";

  // FAQ (Питання-відповіді)
  const faqHTML = c.faq
    ? `
    <section class="section-padding" style="padding-bottom: 120px;">
        <div class="container" style="max-width: 800px;">
            <h2 class="section-title center scroll-hidden">FAQ</h2>
            <div class="faq-list">
                ${c.faq
                  .map(
                    (item, i) => `
                    <div class="faq-item scroll-hidden" style="transition-delay: ${i * 50}ms">
                        <div class="faq-question">
                            ${item.q}
                            <span class="plus">+</span>
                        </div>
                        <div class="faq-answer">${item.a}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
    </section>
  `
    : "";

  // Збираємо все докупи в один HTML
  return `
    <div class="site-wrapper">
        <div class="bg-noise"></div>
        
        <header class="glass-header">
            <div class="logo">
                <span class="logo-dot"></span>
                ${c.name}
            </div>
            <nav class="desktop-nav">
                ${(c.nav || []).map((l) => `<a href="#">${l}</a>`).join("")}
            </nav>
            <button class="btn-primary small mobile-hidden">Get Started</button>
        </header>

        <section class="hero-section">
            <div class="container hero-grid">
                <div class="hero-content scroll-hidden">
                    <div class="label-tag">AI GENERATED • 2026</div>
                    <h1 class="hero-title">${c.hero.title}</h1>
                    <p class="hero-sub">${c.hero.subtitle}</p>
                    <div class="hero-btns">
                        <button class="btn-primary big">${c.hero.btn}</button>
                        <button class="btn-glass big">Learn More</button>
                    </div>
                </div>
                <div class="hero-visual scroll-hidden" style="transition-delay: 200ms">
                    <div class="hero-orb"></div>
                    <div class="hero-emoji">${mainEmoji}</div>
                </div>
            </div>
        </section>

        <div class="marquee-wrapper">
            <div class="marquee-track">${marqueeItems}</div>
        </div>

        ${aboutHTML}

        <section class="section-padding bg-darker">
            <div class="container">
                <h2 class="section-title center scroll-hidden">Переваги</h2>
                <div class="features-grid-custom">
                    ${featuresHTML}
                </div>
            </div>
        </section>

        ${pricingHTML}
        ${testimonialsHTML}
        ${faqHTML}

        <footer class="main-footer">
            <div class="footer-logo">${c.name}</div>
            <p>${c.footerText}</p>
        </footer>
    </div>
  `;
}

// ==========================================
// 4. CSS INJECTION (Стилі для згенерованого сайту)
// ==========================================
function injectGlobalStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Outfit:wght@300;500;700&display=swap');

    :root { 
        /* Дефолтні кольори (AI їх перепише) */
        --primary: #3B82F6;
        --secondary: #8B5CF6;
        --accent: #F472B6;
        --text-main: #ffffff;
        --ease: cubic-bezier(0.23, 1, 0.32, 1);
        --border: rgba(255, 255, 255, 0.1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
        background: var(--bg-space-dark); 
        color: var(--text-main); 
        font-family: 'Inter', sans-serif; 
        overflow-x: hidden; 
        transition: background 0.5s ease;
    }
    
    .site-wrapper { position: relative; width: 100%; overflow: hidden; }
    .container { max-width: 1240px; margin: 0 auto; padding: 0 20px; position: relative; z-index: 2; }

    /* Шум на фоні (щоб не було скучно) */
    .bg-noise {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: 
            radial-gradient(circle at 10% 20%, rgba(var(--primary-rgb), 0.15), transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(var(--secondary-rgb), 0.15), transparent 40%),
            var(--bg-space-dark);
        z-index: 0; pointer-events: none;
    }

    /* HEADER */
    .glass-header {
        position: fixed; top: 0; width: 100%; padding: 15px 5%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(15px);
        border-bottom: 1px solid var(--border); z-index: 999;
        display: flex; justify-content: space-between; align-items: center;
    }
    .logo { font-weight: 800; font-size: 1.3rem; display: flex; align-items: center; gap: 10px; color: #fff; letter-spacing: -0.5px; }
    .logo-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); }
    
    .desktop-nav { display: flex; gap: 30px; }
    .desktop-nav a { color: #94A3B8; text-decoration: none; font-size: 0.85rem; transition: 0.3s; font-weight: 500; }
    .desktop-nav a:hover { color: var(--primary); }

    /* HERO */
    .hero-section { 
        min-height: 100vh; display: flex; align-items: center; padding-top: 80px; padding-bottom: 50px; position: relative; 
        background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
        mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
    }
    .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center; }
    
    /* 🔥 Градієнтний заголовок */
    .hero-title { 
        font-size: clamp(3rem, 6vw, 5rem); line-height: 1.1; font-weight: 800; margin: 25px 0; color: #fff; letter-spacing: -2px; 
        background: linear-gradient(135deg, #fff 30%, var(--primary) 70%, var(--secondary) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-sub { font-size: 1.2rem; color: #94A3B8; margin-bottom: 40px; line-height: 1.6; max-width: 550px; }
    
    .hero-visual { position: relative; height: 400px; display: flex; justify-content: center; align-items: center; }
    .hero-orb { 
        width: 300px; height: 300px; 
        background: radial-gradient(circle, var(--primary) 0%, var(--secondary) 100%); 
        border-radius: 50%; filter: blur(70px); opacity: 0.4; position: absolute; 
        animation: pulse 4s infinite ease-in-out;
    }
    .hero-emoji { font-size: 140px; animation: float 6s ease-in-out infinite; position: relative; z-index: 2; }

    /* MARQUEE (Рядок, що біжить) */
    .marquee-wrapper {
        width: 100%; overflow: hidden; padding: 25px 0; background: rgba(0,0,0,0.3);
        border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    }
    .marquee-track {
        display: flex; gap: 80px; width: max-content; animation: scroll 60s linear infinite;
    }
    .marquee-item {
        font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
        color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 15px;
    }
    @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

    /* ABOUT & UTILS */
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .about-text { font-size: 1.1rem; line-height: 1.7; color: #94A3B8; margin-bottom: 30px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .stat-card { border-left: 2px solid var(--primary); padding-left: 15px; }
    .stat-value { font-size: 2rem; font-weight: 800; color: #fff; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; }
    
    .visual-card { 
        height: 350px; background: rgba(255,255,255,0.02); border-radius: 24px; border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
    }
    .floating-emoji { font-size: 80px; animation: float 5s ease-in-out infinite reverse; z-index: 2; }
    .visual-glow { position: absolute; width: 150px; height: 150px; background: var(--secondary); filter: blur(80px); opacity: 0.2; }

    /* FEATURES */
    .features-grid-custom { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .feature-card { 
        background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 35px; border-radius: 20px; 
        transition: 0.4s; display: flex; flex-direction: column;
    }
    .feature-card:hover { transform: translateY(-8px); border-color: var(--primary); background: rgba(255,255,255,0.05); }
    .icon-box { font-size: 32px; margin-bottom: 15px; color: var(--primary); }
    .feature-card h3 { font-size: 1.3rem; margin-bottom: 10px; color: #fff; font-weight: 700; }
    .feature-card p { font-size: 0.95rem; color: #94A3B8; line-height: 1.5; }

    /* PRICING */
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
    .pricing-card { 
        background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 30px; border-radius: 20px; 
        display: flex; flex-direction: column; position: relative; transition: 0.3s;
    }
    .pricing-card.popular { 
        background: rgba(var(--primary-rgb), 0.1); border-color: var(--primary); transform: scale(1.05); z-index: 2; 
        box-shadow: 0 10px 40px rgba(var(--primary-rgb), 0.15); 
    }
    .badge { position: absolute; top: 0; right: 0; background: var(--primary); color: #fff; padding: 4px 12px; font-weight: 800; font-size: 0.7rem; border-bottom-left-radius: 12px; }
    .plan-name { font-size: 1.1rem; font-weight: 700; text-transform: uppercase; color: #fff; margin-bottom: 10px; }
    .price { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 15px; }
    .plan-desc { color: #94A3B8; margin-bottom: 25px; font-size: 0.9rem; flex-grow: 1; }

    /* TESTIMONIALS & FAQ */
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
    .review-card { 
        background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 30px; border-radius: 20px; 
        display: flex; flex-direction: column; font-family: 'Outfit', sans-serif; 
    }
    .quote { font-size: 50px; color: var(--secondary); opacity: 0.5; line-height: 0; margin-bottom: 20px; height: 20px; }
    .review-text { color: #e2e8f0; font-weight: 300; line-height: 1.6; margin-bottom: 20px; font-size: 1rem; }
    .author { display: flex; gap: 12px; margin-top: auto; align-items: center; }
    .avatar { width: 40px; height: 40px; background: var(--secondary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .name { font-weight: 700; color: #fff; font-size: 0.95rem; }
    .role { font-size: 0.8rem; color: var(--primary); }

    .faq-item { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
    .faq-question { padding: 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: #fff; font-weight: 600; font-size: 1rem; }
    .faq-answer { padding: 0 20px 20px; display: none; color: #94A3B8; line-height: 1.6; font-size: 0.95rem; }
    .faq-item.active .faq-answer { display: block; }
    .plus { font-size: 20px; color: #555; transition: 0.3s; }
    .faq-item.active .plus { transform: rotate(45deg); color: var(--primary); }

    /* BUTTONS */
    .btn-primary { 
        background: var(--primary); color: #fff; 
        padding: 12px 30px; border-radius: 50px; font-weight: 700; cursor: pointer; transition: 0.3s; border: none; font-size: 1rem; 
        box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.4);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(var(--primary-rgb), 0.6); filter: brightness(1.1); }
    
    .btn-glass { background: transparent; color: #fff; padding: 12px 30px; border-radius: 50px; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: 0.3s; font-size: 1rem; }
    .btn-glass:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
    .btn-block { width: 100%; padding: 14px; border-radius: 12px; margin-top: auto; }

    /* UTILS */
    .label-tag { text-transform: uppercase; letter-spacing: 2px; font-size: 0.7rem; color: var(--primary); font-weight: 800; margin-bottom: 15px; display: inline-block; background: rgba(var(--primary-rgb), 0.15); padding: 6px 14px; border-radius: 50px; border: 1px solid rgba(var(--primary-rgb), 0.3); }
    .section-padding { padding: 100px 0; }
    .bg-darker { background: rgba(0,0,0,0.2); }
    .section-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 40px; color: #fff; letter-spacing: -1px; }
    .center { text-align: center; }
    .main-footer { padding: 60px 0 30px; text-align: center; border-top: 1px solid var(--border); color: #64748b; font-size: 0.9rem; background: rgba(0,0,0,0.5); }
    .footer-logo { color: #fff; font-weight: 900; font-size: 1.2rem; margin-bottom: 15px; }

    @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-15px);} }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.1); opacity: 0.6; } }

    /* 🔥 Милиці для телефонів (MOBILE FIXES) */
    @media (max-width: 900px) {
        .container { padding: 0 20px; }
        .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 30px; }
        .hero-btns { justify-content: center; }
        .hero-visual { height: 300px; order: -1; margin-bottom: -20px; }
        .hero-orb { width: 200px; height: 200px; left: 50%; transform: translate(-50%, -50%); }
        .hero-title { font-size: 2.8rem; }
        .section-padding { padding: 60px 0; }
        .section-title { font-size: 2rem; margin-bottom: 30px; }
        
        .desktop-nav, .mobile-hidden { display: none; }
        .glass-header { padding: 15px 20px; justify-content: center; }

        .about-grid { grid-template-columns: 1fr; gap: 30px; }
        .visual-card { height: 250px; }
        .stats-grid { gap: 15px; }
        .stat-value { font-size: 1.8rem; }

        .features-grid-custom { grid-template-columns: 1fr 1fr; gap: 12px; }
        .feature-card { padding: 20px 15px; border-radius: 16px; }
        .icon-box { font-size: 24px; margin-bottom: 10px; }
        .feature-card h3 { font-size: 1rem; line-height: 1.2; }
        .feature-card p { font-size: 0.8rem; line-height: 1.4; }

        .pricing-grid, .testimonials-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
        .pricing-card:last-child, .review-card:last-child { grid-column: 1 / -1; }
        .pricing-card, .review-card { padding: 20px; }
        .price { font-size: 2rem; }
        .review-text { font-size: 0.9rem; }
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// 5. УТИЛІТИ (Всякі дрібниці)
// ==========================================
function initScrollObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-show");
        }
      });
    },
    { threshold: 0.1 },
  );

  window.checkScrollAnimation = () => {
    document
      .querySelectorAll(".scroll-hidden")
      .forEach((el) => observer.observe(el));
  };
}

function activateAccordion() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    item.querySelector(".faq-question").addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      items.forEach((i) => i.classList.remove("active"));
      if (!isActive) item.classList.add("active");
    });
  });
}
