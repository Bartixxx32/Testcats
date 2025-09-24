document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    // console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed: ', err);
                });
        });
    }

    const catPhoto = document.getElementById('cat-photo');
    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    const superlikeBtn = document.getElementById('superlike-btn');
    const card = document.querySelector('.card');
    const loader = document.querySelector('.loader');
    const galleryBtn = document.getElementById('gallery-btn');
    const galleryModal = document.getElementById('liked-gallery-modal');
    const statsModal = document.getElementById('stats-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const likedCatsContainer = document.getElementById('liked-cats-container');
    const statsContainer = document.getElementById('stats-container');
    const statsBtn = document.getElementById('stats-btn');
    const offlineIndicator = document.getElementById('offline-indicator');

    const apiKey = 'live_5DxUgA2nXwoVx7EfSZfXdJEcyJesFzLU6jaj8a8RvHKTTvbxGqsoVSGBoqZgkTER';
    const apiUrl = 'https://api.thecatapi.com/v1/images/search';

    let currentCat = null;

    async function fetchCat() {
        showLoader();
        try {
            const response = await fetch(apiUrl, {
                headers: { 'x-api-key': apiKey }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            currentCat = data[0];
            catPhoto.src = currentCat.url;
            catPhoto.style.display = 'block';
            hideLoader();
        } catch (error) {
            console.error("Failed to fetch cat:", error);
            hideLoader();
            // You could display a placeholder image or an error message here
        }
    }

    function showLoader() {
        loader.style.display = 'block';
        catPhoto.style.display = 'none';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function handleAction(action) {
        if (!currentCat) return;

        card.classList.add(`${action}-animation`);

        // Update stats
        let stats = JSON.parse(localStorage.getItem('catTinderStats')) || { likes: 0, dislikes: 0, superlikes: 0 };
        if (action === 'like') stats.likes++;
        else if (action === 'dislike') stats.dislikes++;
        else if (action === 'superlike') stats.superlikes++;
        localStorage.setItem('catTinderStats', JSON.stringify(stats));

        if (action === 'like' || action === 'superlike') {
            let currentLiked = JSON.parse(localStorage.getItem('likedCats')) || [];
            if (!currentLiked.some(cat => cat.id === currentCat.id)) {
                currentLiked.push(currentCat);
                localStorage.setItem('likedCats', JSON.stringify(currentLiked));
            }
        }

        setTimeout(() => {
            card.classList.remove('like-animation', 'dislike-animation', 'superlike-animation');
            // Reset card position after animation
            card.style.transform = '';
            fetchCat();
        }, 500); // Match animation duration
    }

    function openGallery() {
        const currentlyLikedCats = JSON.parse(localStorage.getItem('likedCats')) || [];
        likedCatsContainer.innerHTML = ''; // Clear previous content
        currentlyLikedCats.forEach(cat => {
            const img = document.createElement('img');
            img.src = cat.url;
            img.alt = 'A liked cat';
            likedCatsContainer.appendChild(img);
        });
        galleryModal.style.display = 'block';
    }

    function openStats() {
        const currentStats = JSON.parse(localStorage.getItem('catTinderStats')) || { likes: 0, dislikes: 0, superlikes: 0 };
        statsContainer.innerHTML = `
            <p>Cats Liked: ${currentStats.likes}</p>
            <p>Cats Disliked: ${currentStats.dislikes}</p>
            <p>Cats Super-Liked: ${currentStats.superlikes}</p>
        `;
        statsModal.style.display = 'block';
    }

    function closeModal() {
        galleryModal.style.display = 'none';
        statsModal.style.display = 'none';
    }

    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineIndicator.style.display = 'none';
        } else {
            offlineIndicator.style.display = 'block';
        }
    }


    // Event Listeners
    likeBtn.addEventListener('click', () => handleAction('like'));
    dislikeBtn.addEventListener('click', () => handleAction('dislike'));
    superlikeBtn.addEventListener('click', () => handleAction('superlike'));
    galleryBtn.addEventListener('click', openGallery);
    statsBtn.addEventListener('click', openStats);

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (event) => {
        if (event.target == galleryModal || event.target == statsModal) {
            closeModal();
        }
    });

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);


    // --- Gesture Handling ---
    const hammer = new Hammer(card);

    hammer.on('pan', (ev) => {
        if (ev.pointerType === 'touch' || ev.pointerType === 'mouse') {
            card.style.transition = 'none';
            card.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px) rotate(${ev.deltaX / 20}deg)`;
        }
    });

    hammer.on('panend', (ev) => {
        card.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        const swipeThreshold = 100;

        // Reset the transform so the exit animation works correctly
        card.style.transform = '';

        if (ev.deltaX > swipeThreshold) {
            handleAction('like');
        } else if (ev.deltaX < -swipeThreshold) {
            handleAction('dislike');
        }
    });


    // Initial setup
    updateOnlineStatus();
    fetchCat();
});
