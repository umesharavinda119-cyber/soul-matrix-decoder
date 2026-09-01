document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('horoscope-panel');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

    // -------------------------------------------------------------------------
    // 1. 4-DAY ROLLING COSMIC TIMER LOGIC
    // -------------------------------------------------------------------------
    function start4DayTimer() {
        let endTime = localStorage.getItem('matrix_timer_end');
        if (!endTime || new Date().getTime() > parseInt(endTime)) {
            endTime = new Date().getTime() + (4 * 24 * 60 * 60 * 1000);
            localStorage.setItem('matrix_timer_end', endTime);
        }

        function updateTimer() {
            const now = new Date().getTime();
            const distance = parseInt(endTime) - now;
            
            if (distance < 0) {
                localStorage.removeItem('matrix_timer_end');
                start4DayTimer();
                return;
            }

            const days = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
            const hours = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
            const seconds = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');

            const timerEl = document.getElementById('celestial-timer');
            if (timerEl) {
                timerEl.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
        }
        updateTimer();
        setInterval(updateTimer, 1000);
    }
    start4DayTimer();

    // -------------------------------------------------------------------------
    // 2. UI PANEL TOGGLE
    // -------------------------------------------------------------------------
    if (openBtn && panel) {
        openBtn.addEventListener('click', () => {
            panel.classList.add('active');
            openBtn.style.opacity = '0';
            openBtn.style.pointerEvents = 'none';
        });
    }

    if (closeBtn && panel && openBtn) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
            openBtn.style.opacity = '1';
            openBtn.style.pointerEvents = 'all';
        });
    }

    // Dynamic Render Planets into 12 Chart Boxes Cleanly
    function renderPlanetsToGrid(containerId, planetMap) {
        for (let i = 1; i <= 12; i++) {
            const box = document.querySelector(`#${containerId} .h${i}`);
            if (box) box.innerHTML = '';
        }

        if (planetMap) {
            Object.keys(planetMap).forEach(houseNum => {
                const box = document.querySelector(`#${containerId} .h${houseNum}`);
                if (box && Array.isArray(planetMap[houseNum]) && planetMap[houseNum].length > 0) {
                    box.innerHTML = planetMap[houseNum]
                        .map(p => `<span class="p-symbol">${p}</span>`)
                        .join('');
                }
            });
        }
    }

    // Map Calculated V12 Numeric & Metric Values Directly to UI
    function renderV12ReportData(report) {
        if (!report) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val !== undefined && val !== null ? val : '-';
        };

        setVal('m-ayanamsha', report.ayanamsha);
        setVal('m-nakshatra', report.nakshatra);
        setVal('m-nak-lord', report.nakshatra_lord);
        setVal('m-tithi', report.tithi);
        setVal('m-yoni-gana-nadi', `${report.yoni} / ${report.gana} / ${report.nadi}`);

        if (report.current_dasha) {
            setVal('m-maha-dasha', report.current_dasha.maha_dasha);
            setVal('m-antar-dasha', report.current_dasha.antar_dasha);
            setVal('m-pratyantar-dasha', report.current_dasha.pratyantar_dasha);
        }

        setVal('m-golden-window', report.golden_window);
        setVal('m-wealth-score', report.wealth_potential);

        if (report.special_lagnas) {
            setVal('m-indu-lagna', report.special_lagnas.indu_lagna);
            setVal('m-arudha-lagna', report.special_lagnas.arudha_lagna);
        }

        setVal('m-yogas', Array.isArray(report.yogas) ? report.yogas.join(', ') : report.yogas);

        setVal('m-marriage-window', report.marriage_window);
        setVal('m-soulmate-match', report.soulmate_match);

        if (report.spouse_info) {
            setVal('m-spouse-dir', `${report.spouse_info.seventh_lord} (${report.spouse_info.direction})`);
            setVal('m-spouse-letter', `'${report.spouse_info.first_letter}'`);
        }

        setVal('m-karmic-level', report.karmic_level);

        if (report.doshas) {
            setVal('m-kuja-dosha', report.doshas.kuja_dosha);
            setVal('m-sade-sati', report.doshas.sade_sati);
            setVal('m-tara-bala', report.doshas.tara_bala);
        }

        setVal('m-sav-total', `${report.sav_total} / 337`);
        setVal('m-lucky-freq', report.lucky_freq);
        setVal('m-power-gem', report.power_gem);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            form.style.display = 'none';
            if (loadingDiv) loadingDiv.style.display = 'block';

            const dateVal = document.getElementById('h-date') ? document.getElementById('h-date').value : '';
            const timeVal = document.getElementById('h-time') ? document.getElementById('h-time').value : '00:00';
            
            const dateParts = dateVal.split('-');
            const timeParts = timeVal.split(':');

            const payload = {
                name: document.getElementById('h-name') ? document.getElementById('h-name').value : '',
                year: parseInt(dateParts[0]) || 1990,
                month: parseInt(dateParts[1]) || 1,
                day: parseInt(dateParts[2]) || 1,
                hour: parseInt(timeParts[0]) || 12,
                minute: parseInt(timeParts[1]) || 0,
                lat: 6.9271, // Colombo Latitude (Default)
                lon: 79.8612  // Colombo Longitude (Default)
            };

            try {
                // Call Real Python Swiss Ephemeris API
                const res = await fetch('/api/index', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const result = await res.json();
                    
                    if (result.lagna && document.getElementById('lagna-name-display')) {
                        document.getElementById('lagna-name-display').innerHTML = result.lagna;
                    }
                    if (result.navamsha && document.getElementById('navamsha-name-display')) {
                        document.getElementById('navamsha-name-display').innerHTML = result.navamsha;
                    }

                    // Render EXACT Live Python Calculations to 12 Houses
                    if (result.lagna_planets) {
                        renderPlanetsToGrid('lagna-houses', result.lagna_planets);
                    }
                    if (result.navamsha_planets) {
                        renderPlanetsToGrid('navamsha-houses', result.navamsha_planets);
                    }

                    // Render V12 Metric Values
                    if (result.v12_report) {
                        renderV12ReportData(result.v12_report);
                    }
                } else {
                    alert("කේන්දර ගණනය කිරීමේදී දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.");
                }
            } catch (err) {
                console.error("Python Calculation Error:", err);
                alert("Server එක සම්බන්ධ කර ගැනීමට නොහැකි විය. කරුණාකර Internet Connection පරීක්ෂා කරන්න.");
            }

            setTimeout(() => {
                if (panel) panel.classList.remove('active');
                if (openBtn) {
                    openBtn.style.opacity = '1';
                    openBtn.style.pointerEvents = 'all';
                }
                
                form.style.display = 'block';
                if (loadingDiv) loadingDiv.style.display = 'none';
                form.reset();

                if (typeof window.open3DHoroscopeRings === 'function') {
                    window.open3DHoroscopeRings();
                } else if (typeof open3DHoroscopeRings === 'function') {
                    open3DHoroscopeRings();
                }
            }, 800);
        });
    }

    // -------------------------------------------------------------------------
    // 3. DYNAMIC QUANTUM PARTICLE BACKGROUND FOR MODAL
    // -------------------------------------------------------------------------
    function initModalParticleBg() {
        const canvas = document.getElementById('modal-bg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let particles = [];
        const particleCount = 45;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.radius = Math.random() * 2 + 0.5;
                this.color = Math.random() > 0.5 ? '#f59e0b' : '#38bdf8';
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
                this.alpha = Math.random() * 0.7 + 0.2;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.restore();
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            const overlay = document.getElementById('horoscope-modal');
            if (overlay && overlay.style.display === 'flex') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.update();
                    p.draw();
                });
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

    // -------------------------------------------------------------------------
    // 4. INTERACTIVE 3D PARALLAX MOUSE & GYRO TILT FOR MODAL CARD
    // -------------------------------------------------------------------------
    function initModal3DTilt() {
        const overlay = document.getElementById('horoscope-modal');
        const card = document.getElementById('horoscope-3d-card');
        if (!overlay || !card) return;

        // Desktop Mouse Motion
        overlay.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            const rotX = ((clientY / innerHeight) - 0.5) * -16;
            const rotY = ((clientX / innerWidth) - 0.5) * 16;

            card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
        });

        overlay.addEventListener('mouseleave', () => {
            card.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
        });

        // Mobile Gyroscope Motion
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (overlay.style.display === 'flex') {
                    const tiltX = e.beta ? Math.min(Math.max(e.beta - 45, -15), 15) : 0;
                    const tiltY = e.gamma ? Math.min(Math.max(e.gamma, -15), 15) : 0;
                    card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
                }
            });
        }
    }

    initModalParticleBg();
    initModal3DTilt();
});
