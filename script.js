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
    const modal = document.getElementById('liked-gallery-modal');
    const closeBtn = document.querySelector('.close-btn');
    const likedCatsContainer = document.getElementById('liked-cats-container');
    const offlineIndicator = document.getElementById('offline-indicator');

    const apiKey = 'live_5DxUgA2nXwoVx7EfSZfXdJEcyJesFzLU6jaj8a8RvHKTTvbxGqsoVSGBoqZgkTER';
    const apiUrl = 'https://api.thecatapi.com/v1/images/search';

    let likedCats = JSON.parse(localStorage.getItem('likedCats')) || [];
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

        if (action === 'like' || action === 'superlike') {
            let currentLiked = JSON.parse(localStorage.getItem('likedCats')) || [];
            if (!currentLiked.some(cat => cat.id === currentCat.id)) {
                currentLiked.push(currentCat);
                localStorage.setItem('likedCats', JSON.stringify(currentLiked));
            }
        }

        setTimeout(() => {
            card.classList.remove('like-animation', 'dislike-animation', 'superlike-animation');
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
        modal.style.display = 'block';
    }

    function closeGallery() {
        modal.style.display = 'none';
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
    closeBtn.addEventListener('click', closeGallery);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeGallery();
        }
    });
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);


    // Initial setup
    updateOnlineStatus();
    fetchCat();
});
