document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-horoscope-btn');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('horoscope-panel');
    const form = document.getElementById('horoscope-form');
    const loadingDiv = document.getElementById('loading-matrix');

    // Open Panel
    openBtn.addEventListener('click', () => {
        panel.classList.add('active');
        openBtn.style.opacity = '0'; // Hide button when panel is open
        openBtn.style.pointerEvents = 'none';
    });

    // Close Panel
    closeBtn.addEventListener('click', () => {
        panel.classList.remove('active');
        openBtn.style.opacity = '1';
        openBtn.style.pointerEvents = 'all';
    });

    // Form Submit (Future Python Backend Connection here)
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload
        
        // Form ටික hide කරලා Loading එක පෙන්නනවා
        form.style.display = 'none';
        loadingDiv.style.display = 'block';

        // දත්ත ටික අරගන්න විදිහ (පස්සේ Python එකට යවන්න පුළුවන්)
        const userData = {
            name: document.getElementById('h-name').value,
            date: document.getElementById('h-date').value,
            time: document.getElementById('h-time').value,
            place: document.getElementById('h-place').value
        };
        console.log("SENDING TO BACKEND:", userData);

        // තත්පර 3කින් පස්සේ හරියට කේන්දරේ හැදුණා වගේ පෙන්නන්න Dummy Timer එකක්
        setTimeout(() => {
            loadingDiv.innerHTML = '<i class="fa-solid fa-check-circle" style="color: #22c55e; font-size: 3rem; margin-bottom:10px;"></i><p style="color: #22c55e;">MATRIX GENERATED SUCCESSFULLY!</p>';
            
            // මේක තමයි උඹට පස්සේ අර ලොකු කේන්දර සටහන් දෙක පෙන්නන්න Trigger කරන තැන.
            // දැනට අපි Panel එක close කරමු.
            setTimeout(() => {
                panel.classList.remove('active');
                openBtn.style.opacity = '1';
                openBtn.style.pointerEvents = 'all';
                // Reset form
                setTimeout(() => {
                    form.style.display = 'block';
                    loadingDiv.style.display = 'none';
                    loadingDiv.innerHTML = '<div class="spinner"></div><p>කේන්දර සටහන ගණනය කරමින් පවතී...</p>';
                    form.reset();
                }, 500);
            }, 2000);

        }, 3000);
    });
});