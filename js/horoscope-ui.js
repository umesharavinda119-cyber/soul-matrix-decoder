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

    // Dynamic Render V12 Detailed Report Below Charts
    function renderV12ReportData(report) {
        if (!report) return;

        if (document.getElementById('rpt-nakshatra')) {
            document.getElementById('rpt-nakshatra').innerText = `${report.nakshatra} (Lord: ${report.nakshatra_lord})`;
        }
        if (document.getElementById('rpt-tithi')) {
            document.getElementById('rpt-tithi').innerText = report.tithi;
        }
        if (document.getElementById('rpt-yoni-gana')) {
            document.getElementById('rpt-yoni-gana').innerText = `${report.yoni} / ${report.gana} / ${report.nadi}`;
        }
        if (document.getElementById('rpt-maha-dasha')) {
            document.getElementById('rpt-maha-dasha').innerText = report.current_dasha.maha_dasha;
        }
        if (document.getElementById('rpt-antar-dasha')) {
            document.getElementById('rpt-antar-dasha').innerText = report.current_dasha.antar_dasha;
        }
        if (document.getElementById('rpt-indu-lagna')) {
            document.getElementById('rpt-indu-lagna').innerText = report.special_lagnas.indu_lagna;
        }
        if (document.getElementById('rpt-arudha-lagna')) {
            document.getElementById('rpt-arudha-lagna').innerText = report.special_lagnas.arudha_lagna;
        }
        if (document.getElementById('rpt-yogas')) {
            document.getElementById('rpt-yogas').innerText = report.yogas.join(', ');
        }
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

                    // Render V12 Report Details
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
