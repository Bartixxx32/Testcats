document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                .catch(error => console.error('Service Worker registration failed:', error));
        });
    }

    // --- Constants and Variables ---
    const catPhoto = document.getElementById('cat-photo');
    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    const superlikeBtn = document.getElementById('superlike-btn');
    const card = document.querySelector('.card');
    const loader = document.querySelector('.loader');
    const galleryBtn = document.getElementById('gallery-btn');
    const galleryModal = document.getElementById('liked-gallery-modal');
    const statsModal = document.getElementById('stats-modal');
    const historyModal = document.getElementById('history-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const likedCatsContainer = document.getElementById('liked-cats-container');
    const statsContainer = document.getElementById('stats-container');
    const historyContainer = document.getElementById('history-container');
    const statsBtn = document.getElementById('stats-btn');
    const historyBtn = document.getElementById('history-btn');
    const shareBtn = document.getElementById('share-btn');
    const offlineIndicator = document.getElementById('offline-indicator');

    const apiKey = 'live_5DxUgA2nXwoVx7EfSZfXdJEcyJesFzLU6jaj8a8RvHKTTvbxGqsoVSGBoqZgkTER';
    const apiUrl = 'https://api.thecatapi.com/v1/images/search';
    const PREFETCH_QUEUE_SIZE = 5;
    const MAX_HISTORY_SIZE = 10;

    let currentCat = null;
    let prefetchQueue = [];
    let viewHistory = JSON.parse(localStorage.getItem('catTinderHistory')) || [];
    let lastAction = null;

    // --- Core Functions ---

    async function fetchCatById(catId) {
        try {
            const response = await fetch(`https://api.thecatapi.com/v1/images/${catId}`, { headers: { 'x-api-key': apiKey } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const img = new Image();
            img.src = data.url;
            return data;
        } catch (error) {
            console.error("Failed to fetch cat by ID:", error);
            return { error: true, message: error.message };
        }
    }

    async function fetchNewCat() {
        try {
            const response = await fetch(apiUrl, { headers: { 'x-api-key': apiKey } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const img = new Image();
            img.src = data[0].url;
            return data[0];
        } catch (error) {
            console.error("Failed to fetch new cat:", error);
            return { error: true, message: error.message };
        }
    }

    async function maintainPrefetchQueue() {
        while (prefetchQueue.length < PREFETCH_QUEUE_SIZE) {
            const newCat = await fetchNewCat();
            if (newCat && !newCat.error) {
                prefetchQueue.push(newCat);
            } else {
                break;
            }
        }
    }

    function showNextCat() {
        if (currentCat && !currentCat.error) {
            viewHistory.unshift(currentCat);
            if (viewHistory.length > MAX_HISTORY_SIZE) viewHistory.pop();
            localStorage.setItem('catTinderHistory', JSON.stringify(viewHistory));
        }

        if (prefetchQueue.length > 0) {
            currentCat = prefetchQueue.shift();
            if (currentCat.error) {
                loader.innerHTML = `Error: ${currentCat.message}<br>Please check your API key or try again later.`;
                showLoader(true);
                return;
            }
            catPhoto.src = currentCat.url;

            // Apply dynamic slide-in animation
            if (lastAction === 'like' || lastAction === 'superlike') {
                card.classList.add('slide-in-right');
            } else if (lastAction === 'dislike') {
                card.classList.add('slide-in-left');
            }

            hideLoader();
            maintainPrefetchQueue();
        } else {
            loader.innerHTML = "Could not fetch cats. Check your API key or network.";
            showLoader(true);
        }
    }

    function handleAction(action) {
        if (!currentCat || currentCat.error) return;

        lastAction = action; // Track the last action
        card.classList.add(`${action}-animation`);
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
            card.style.transform = '';
            showLoader();
            showNextCat();
        }, 500);
    }

    // --- UI Functions ---
    function showLoader(isError = false) {
        loader.style.display = 'block';
        if (!isError) catPhoto.style.visibility = 'hidden';
        catPhoto.style.display = 'none';
    }
    function hideLoader() {
        loader.style.display = 'none';
        catPhoto.style.display = 'block';
        catPhoto.style.visibility = 'visible';
    }
    function openGallery() {
        const currentlyLikedCats = JSON.parse(localStorage.getItem('likedCats')) || [];
        likedCatsContainer.innerHTML = '';
        currentlyLikedCats.forEach(cat => {
            const img = document.createElement('img');
            img.src = cat.url; img.alt = 'A liked cat'; img.loading = 'lazy';
            likedCatsContainer.appendChild(img);
        });
        galleryModal.style.display = 'block';
    }
    function openStats() {
        const currentStats = JSON.parse(localStorage.getItem('catTinderStats')) || { likes: 0, dislikes: 0, superlikes: 0 };
        statsContainer.innerHTML = `<p>Cats Liked: ${currentStats.likes}</p><p>Cats Disliked: ${currentStats.dislikes}</p><p>Cats Super-Liked: ${currentStats.superlikes}</p>`;
        statsModal.style.display = 'block';
    }
    function openHistory() {
        historyContainer.innerHTML = '';
        viewHistory.forEach(cat => {
            const img = document.createElement('img');
            img.src = cat.url; img.alt = 'A previously viewed cat'; img.loading = 'lazy';
            historyContainer.appendChild(img);
        });
        historyModal.style.display = 'block';
    }
    function closeModal() { galleryModal.style.display = 'none'; statsModal.style.display = 'none'; historyModal.style.display = 'none'; }
    function updateOnlineStatus() { offlineIndicator.style.display = navigator.onLine ? 'none' : 'block'; }

    async function shareCat() {
        if (!currentCat || currentCat.error) return;
        const shareUrl = `${window.location.origin}${window.location.pathname}?cat_id=${currentCat.id}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this cute cat!',
                    text: 'I found this adorable cat on Catinder Hardcore!',
                    url: shareUrl,
                });
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'), () => alert('Failed to copy link.'));
            }
        } catch (err) {
            console.error('Share failed:', err.message);
            alert('Could not share cat.');
        }
    }

    // --- Initial Setup ---
    async function initializeApp() {
        showLoader();
        updateOnlineStatus();

        const urlParams = new URLSearchParams(window.location.search);
        const sharedCatId = urlParams.get('cat_id');

        if (sharedCatId) {
            const sharedCat = await fetchCatById(sharedCatId);
            if (sharedCat && !sharedCat.error) {
                prefetchQueue.unshift(sharedCat); // Put the shared cat at the front of the queue
            }
        }

        await maintainPrefetchQueue();
        showNextCat();
    }

    // --- Event Listeners and Gesture Handling ---
    card.addEventListener('animationend', () => {
        card.classList.remove('slide-in-left', 'slide-in-right');
    });
    likeBtn.addEventListener('click', () => handleAction('like'));
    dislikeBtn.addEventListener('click', () => handleAction('dislike'));
    superlikeBtn.addEventListener('click', () => handleAction('superlike'));
    galleryBtn.addEventListener('click', openGallery);
    statsBtn.addEventListener('click', openStats);
    historyBtn.addEventListener('click', openHistory);
    shareBtn.addEventListener('click', shareCat);

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (event) => {
        if (event.target == galleryModal || event.target == statsModal || event.target == historyModal) closeModal();
    });

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

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
        card.style.transform = '';
        if (ev.deltaX > swipeThreshold) handleAction('like');
        else if (ev.deltaX < -swipeThreshold) handleAction('dislike');
    });

    initializeApp();
});