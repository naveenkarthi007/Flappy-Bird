document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');

    const goBack = () => {
        // Prefer history back when the user navigated here from the game.
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        window.location.href = 'index.html';
    };

    if (backBtn) {
        backBtn.addEventListener('click', goBack);

        backBtn.addEventListener(
            'pointerdown',
            (e) => {
                e.preventDefault();
                goBack();
            },
            { passive: false },
        );

        backBtn.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                goBack();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' || e.code === 'Backspace') {
            e.preventDefault();
            goBack();
        }
    });
});