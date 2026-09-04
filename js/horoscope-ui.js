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

            try {
                const res = await fetch('/api/index', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (res.ok && result.status === "success") {
                    if (result.lagna) document.getElementById('lagna-name-display').innerHTML = result.lagna;
                    if (result.navamsha) document.getElementById('navamsha-name-display').innerHTML = result.navamsha;
                    if (result.lagna_planets) renderPlanetsToGrid('lagna-houses', result.lagna_planets);
                    if (result.navamsha_planets) renderPlanetsToGrid('navamsha-houses', result.navamsha_planets);
                    if (result.v12_report) renderV12ReportData(result.v12_report);

                    // SHOW MODAL ONLY IF SUCCESS
                    setTimeout(() => {
                        if (panel) panel.classList.remove('active');
                        form.style.display = 'block';
                        if (loadingDiv) loadingDiv.style.display = 'none';
                        form.reset();

                        const horoscopeModal = document.getElementById('horoscope-modal');
                        if (horoscopeModal) horoscopeModal.style.display = 'flex';
                    }, 500);

                } else {
                    // PYTHON BACKEND ERROR අල්ලා ගැනීම
                    alert("Python Error: " + (result.message || "Unknown Server Error"));
                    form.style.display = 'block';
                    if (loadingDiv) loadingDiv.style.display = 'none';
                }
            } catch (err) {
                // NETWORK / 404 / 500 ERRORS අල්ලා ගැනීම
                alert("Network/Vercel Error: " + err.message);
                form.style.display = 'block';
                if (loadingDiv) loadingDiv.style.display = 'none';
            }
        });
    }
