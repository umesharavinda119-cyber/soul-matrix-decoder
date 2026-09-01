document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('horoscope-panel');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

    // Open Panel
    if (openBtn && panel) {
        openBtn.addEventListener('click', () => {
            panel.classList.add('active');
            openBtn.style.opacity = '0';
            openBtn.style.pointerEvents = 'none';
        });
    }

    // Close Panel
    if (closeBtn && panel && openBtn) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
            openBtn.style.opacity = '1';
            openBtn.style.pointerEvents = 'all';
        });
    }

    // Form Submit (Triggers Processing & 3D Wheel Modal)
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            form.style.display = 'none';
            if (loadingDiv) loadingDiv.style.display = 'block';

            const userData = {
                name: document.getElementById('h-name') ? document.getElementById('h-name').value : '',
                date: document.getElementById('h-date') ? document.getElementById('h-date').value : '',
                time: document.getElementById('h-time') ? document.getElementById('h-time').value : '',
                place: document.getElementById('h-place') ? document.getElementById('h-place').value : ''
            };
            console.log("SENDING TO PYTHON ENGINE:", userData);

            setTimeout(() => {
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<i class="fa-solid fa-check-circle" style="color: #22c55e; font-size: 3rem; margin-bottom:10px;"></i><p style="color: #22c55e;">MATRIX GENERATED SUCCESSFULLY!</p>';
                }
                
                setTimeout(() => {
                    if (panel) panel.classList.remove('active');
                    if (openBtn) {
                        openBtn.style.opacity = '1';
                        openBtn.style.pointerEvents = 'all';
                    }
                    
                    // Reset form and loading state
                    form.style.display = 'block';
                    if (loadingDiv) {
                        loadingDiv.style.display = 'none';
                        loadingDiv.innerHTML = '<div class="spinner"></div><p>කේන්දර සටහන ගණනය කරමින් පවතී...</p>';
                    }
                    form.reset();

                    // Open 3D Horoscope Modal (Lagna & Navamsha Wheels)
                    if (typeof window.open3DHoroscopeRings === 'function') {
                        window.open3DHoroscopeRings();
                    }
                }, 1200);

            }, 2500);
        });
    }
});
