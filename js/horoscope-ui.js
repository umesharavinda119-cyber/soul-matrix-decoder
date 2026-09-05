document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const glassPanel = document.getElementById('horoscope-panel');
    const modalOverlay = document.getElementById('horoscope-modal');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

    if (openBtn && glassPanel) {
        openBtn.addEventListener('click', () => {
            glassPanel.classList.add('active');
        });
    }

    if (closePanelBtn && glassPanel) {
        closePanelBtn.addEventListener('click', () => {
            glassPanel.classList.remove('active');
        });
    }

    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('h-name').value.trim();
            const status = document.getElementById('h-status').value;
            const dateVal = document.getElementById('h-date').value;
            const timeVal = document.getElementById('h-time').value;
            const place = document.getElementById('h-place').value.trim();

            if (!name || !dateVal || !timeVal || !place) {
                alert('කරුණාකර සියලු විස්තර නිවැරදිව ඇතුළත් කරන්න.');
                return;
            }

            const [year, month, day] = dateVal.split('-').map(Number);
            const [hour, minute] = timeVal.split(':').map(Number);

            const payload = {
                name: name,
                status: status,
                year: year,
                month: month,
                day: day,
                hour: hour,
                minute: minute,
                lat: window.selectedLat || 6.9271,
                lon: window.selectedLon || 79.8612
            };

            if (loadingDiv) loadingDiv.style.display = 'block';

            try {
                const response = await fetch('/api/index', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.status === 'success') {
                    renderHoroscopeResults(data);
                    if (glassPanel) glassPanel.classList.remove('active');
                    if (modalOverlay) modalOverlay.style.display = 'flex';
                } else {
                    alert('ගණනය කිරීමේදී දෝෂයක් සිදු විය: ' + (data.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Fetch error:', err);
                alert('සර්වර් සම්බන්ධතාවයේ දෝෂයක් පවතී. නැවත උත්සාහ කරන්න.');
            } finally {
                if (loadingDiv) loadingDiv.style.display = 'none';
            }
        });
    }
});

function renderHoroscopeResults(data) {
    const lagnaTitle = document.getElementById('lagna-name-display');
    const navamshaTitle = document.getElementById('navamsha-name-display');

    if (lagnaTitle) lagnaTitle.innerHTML = data.lagna;
    if (navamshaTitle) navamshaTitle.innerHTML = data.navamsha;

    // Render D1 Houses
    for (let i = 1; i <= 12; i++) {
        const box = document.querySelector(`#lagna-houses .h${i}`);
        if (box) {
            const planets = data.lagna_planets[i] || [];
            box.innerHTML = planets.map(p => `<span class="p-symbol">${p}</span>`).join('');
        }
    }

    // Render D9 Houses
    for (let i = 1; i <= 12; i++) {
        const box = document.querySelector(`#navamsha-houses .h${i}`);
        if (box) {
            const planets = data.navamsha_planets[i] || [];
            box.innerHTML = planets.map(p => `<span class="p-symbol">${p}</span>`).join('');
        }
    }

    // Render Report Metrics
    const rep = data.v12_report;
    if (!rep) return;

    setTxt('m-ayanamsha', rep.ayanamsha);
    setTxt('m-nakshatra', rep.nakshatra);
    setTxt('m-nak-lord', rep.nakshatra_lord);
    setTxt('m-tithi', rep.tithi);
    setTxt('m-yoni-gana-nadi', `${rep.yoni} / ${rep.gana} / ${rep.nadi}`);

    setTxt('m-maha-dasha', rep.current_dasha.maha_dasha);
    setTxt('m-antar-dasha', rep.current_dasha.antar_dasha);
    setTxt('m-pratyantar-dasha', rep.current_dasha.pratyantar_dasha);
    setTxt('m-golden-window', rep.golden_window);

    setTxt('m-wealth-score', rep.wealth_potential);
    setTxt('m-indu-lagna', rep.special_lagnas.indu_lagna);
    setTxt('m-arudha-lagna', rep.special_lagnas.arudha_lagna);
    setTxt('m-yogas', Array.isArray(rep.yogas) ? rep.yogas.join(', ') : rep.yogas);

    // Dynamic Marriage Label and Window
    setTxt('lbl-marriage-window', rep.marriage_label || 'විවාහ වීමේ කාලසීමාව:');
    setTxt('m-marriage-window', rep.marriage_window);
    setTxt('m-soulmate-match', rep.soulmate_match);
    setTxt('m-spouse-dir', `${rep.spouse_info.seventh_lord} (${rep.spouse_info.direction})`);
    setTxt('m-spouse-letter', `'${rep.spouse_info.first_letter}'`);

    setTxt('m-karmic-level', rep.karmic_level);
    setTxt('m-kuja-dosha', rep.doshas.kuja_dosha);
    setTxt('m-sade-sati', rep.doshas.sade_sati);
    setTxt('m-sav-total', `${rep.sav_total} / 337`);

    setTxt('m-lucky-freq', rep.lucky_freq);
    setTxt('m-tara-bala', rep.doshas.tara_bala);
}

function setTxt(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '-';
}
