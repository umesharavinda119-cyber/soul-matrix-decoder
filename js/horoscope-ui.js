document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('horoscope-panel');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

    // 1. 4-DAY ROLLING COSMIC TIMER LOGIC
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

    // 2. UI PANEL TOGGLE
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

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            form.style.display = 'none';
            if (loadingDiv) loadingDiv.style.display = 'block';

            const dateVal = document.getElementById('h-date') ? document.getElementById('h-date').value : '';
            const timeVal = document.getElementById('h-time') ? document.getElementById('h-time').value : '00:00';
            const dateParts = dateVal.split('-');
            const timeParts = timeVal.split(':');

            // Send Real Selected Lat/Lon to Backend
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

            console.log("Sending Payload:", payload);
            
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
                }
            }, 800);
        });
    }
});
