document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('horoscope-panel');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

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

        if (report.special_lagnas) {
            setVal('m-indu-lagna', report.special_lagnas.indu_lagna);
            setVal('m-arudha-lagna', report.special_lagnas.arudha_lagna);
            setVal('m-upapada-lagna', report.special_lagnas.upapada_lagna);
        }

        setVal('m-yogas', Array.isArray(report.yogas) ? report.yogas.join(', ') : report.yogas);

        if (report.spouse_info) {
            setVal('m-7th-lord', report.spouse_info.seventh_lord);
            setVal('m-spouse-dir', report.spouse_info.direction);
            setVal('m-spouse-letter', `'${report.spouse_info.first_letter}'`);
        }

        if (report.doshas) {
            setVal('m-kuja-dosha', report.doshas.kuja_dosha);
            setVal('m-sade-sati', report.doshas.sade_sati);
            setVal('m-tara-bala', report.doshas.tara_bala);
        }

        setVal('m-sav-total', `${report.sav_total} / 337`);
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
});
