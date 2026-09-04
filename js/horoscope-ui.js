document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('horoscope-panel');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

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
            if (timerEl) timerEl.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        updateTimer();
        setInterval(updateTimer, 1000);
    }
    start4DayTimer();

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

    function renderPlanetsToGrid(containerId, planetMap) {
        for (let i = 1; i <= 12; i++) {
            const box = document.querySelector(`#${containerId} .h${i}`);
            if (box) box.innerHTML = '';
        }
        if (planetMap) {
            Object.keys(planetMap).forEach(houseNum => {
                const box = document.querySelector(`#${containerId} .h${houseNum}`);
                if (box && Array.isArray(planetMap[houseNum]) && planetMap[houseNum].length > 0) {
                    box.innerHTML = planetMap[houseNum].map(p => `<span class="p-symbol">${p}</span>`).join('');
                }
            });
        }
    }

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
                lat: window.selectedLat || 6.9271,
                lon: window.selectedLon || 79.8612
            };

            let isSuccess = false;
            let errorMsg = "";

            try {
                const res = await fetch('/api/index', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const text = await res.text(); 
                try {
                    const result = JSON.parse(text);
                    if (res.ok && result.status === "success") {
                        if (result.lagna) document.getElementById('lagna-name-display').innerHTML = result.lagna;
                        if (result.navamsha) document.getElementById('navamsha-name-display').innerHTML = result.navamsha;
                        if (result.lagna_planets) renderPlanetsToGrid('lagna-houses', result.lagna_planets);
                        if (result.navamsha_planets) renderPlanetsToGrid('navamsha-houses', result.navamsha_planets);
                        if (result.v12_report) renderV12ReportData(result.v12_report);
                        isSuccess = true;
                    } else {
                        errorMsg = result.message || "Python Server Error";
                    }
                } catch (e) {
                    errorMsg = "Server Returned HTML instead of JSON (Vercel Build Error)";
                }
            } catch (err) {
                errorMsg = "Network Fetch Error: " + err.message;
            }

            // PYTHON එකේ මොන අවුල ගියත් 100% කේන්දර සටහන Open කිරීම
            if (!isSuccess) {
                document.getElementById('lagna-name-display').innerHTML = "සිංහ<br>ලග්නය";
                document.getElementById('navamsha-name-display').innerHTML = "ධනු<br>නවාංශකය";
                renderPlanetsToGrid('lagna-houses', { 1: ['☉', '☿'], 4: ['☽'], 5: ['♃'], 7: ['♂'], 9: ['♄'], 11: ['♀'] });
                renderPlanetsToGrid('navamsha-houses', { 2: ['☉'], 4: ['☽', '♂'], 10: ['♃', '♄'] });
                renderV12ReportData({
                    ayanamsha: "24.15° (Demo)", nakshatra: "මා / 2", nakshatra_lord: "කේතු",
                    tithi: "ශුක්ල පක්ෂ අෂ්ටමි", yoni: "මූෂික", gana: "රාක්ෂ", nadi: "අන්ත්‍ය",
                    current_dasha: { maha_dasha: "ගුරු", antar_dasha: "සෙනසුරු", pratyantar_dasha: "බුධ" },
                    golden_window: "2027 - 2030", wealth_potential: "85%",
                    special_lagnas: { indu_lagna: "මකර", arudha_lagna: "මේෂ" },
                    yogas: ["ගජ කේශරී", "රුචක"], marriage_window: "2026 මැද", soulmate_match: "92%",
                    spouse_info: { seventh_lord: "ශනි", direction: "බස්නාහිර", first_letter: "ක/ග" },
                    karmic_level: "මධ්‍යම", doshas: { kuja_dosha: "නැත", sade_sati: "පවතිනවා", tara_bala: "සුබයි" },
                    sav_total: "32", lucky_freq: "432Hz", power_gem: "Yellow Sapphire"
                });
                
                alert("⚠️ Python Error: " + errorMsg + "\n\n(හැබැයි අපි UI එක වැඩද බලන්න Demo දත්ත දාලා කේන්දර සටහන පෙන්වනවා!)");
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

                const horoscopeModal = document.getElementById('horoscope-modal');
                if (horoscopeModal) {
                    horoscopeModal.style.display = 'flex';
                    try {
                        if (typeof window.initSingleRing === 'function') {
                            window.initSingleRing('lagna-3d-canvas');
                            window.initSingleRing('navamsha-3d-canvas');
                        } else if (typeof initSingleRing === 'function') {
                            initSingleRing('lagna-3d-canvas');
                            initSingleRing('navamsha-3d-canvas');
                        }
                    } catch(e) { console.warn("Rings Init Error:", e); }
                }
            }, 800);
        });
    }
});
