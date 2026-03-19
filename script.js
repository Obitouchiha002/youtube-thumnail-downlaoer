document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const urlInput = document.getElementById('url-input');
    const getBtn = document.getElementById('get-btn');
    const errorMessage = document.getElementById('error-message');
    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('result-section');
    const homeBtn = document.getElementById('home-btn');
    const thumbnailPreview = document.getElementById('thumbnail-preview');
    const loadingOverlay = document.getElementById('loading-overlay');
    const openVideoBtn = document.getElementById('open-video-btn');
    const downloadBtns = document.querySelectorAll('.download-btn');
    const copyBtns = document.querySelectorAll('.copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const themeText = document.getElementById('theme-text');

    let currentVideoId = '';

    // Theme Toggle Logic
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        // Default to dark mode if no saved theme
        const isDark = savedTheme === 'dark' || !savedTheme;
        
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            if (themeText) themeText.textContent = 'Switch to Light Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            if (themeText) themeText.textContent = 'Switch to Dark Mode';
        }
    };

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            if (themeText) themeText.textContent = 'Switch to Light Mode';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            if (themeText) themeText.textContent = 'Switch to Dark Mode';
        }
    });

    initTheme();

    // Extract Video ID from YouTube URL
    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Get Thumbnail URL based on quality
    const getThumbnailUrl = (videoId, quality) => {
        return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    };

    // Handle Get Thumbnail Click
    const handleGetThumbnail = () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a YouTube URL.');
            return;
        }

        const videoId = extractVideoId(url);
        
        if (!videoId) {
            showError('Invalid YouTube URL. Please make sure it is a valid video link.');
            return;
        }

        currentVideoId = videoId;
        hideError();
        showResult(videoId);
    };

    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        resultSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        homeBtn.classList.add('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    const showResult = (videoId) => {
        inputSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        homeBtn.classList.remove('hidden');
        
        // Trigger animation
        resultSection.classList.remove('animate-in');
        void resultSection.offsetWidth; // trigger reflow
        resultSection.classList.add('animate-in');
        
        loadingOverlay.classList.remove('hidden');
        
        // Load maxresdefault for preview
        const previewUrl = getThumbnailUrl(videoId, 'maxresdefault');
        
        // Create a new image to test loading
        const img = new Image();
        img.onload = () => {
            // Sometimes maxresdefault doesn't exist, YouTube returns a 120x90 placeholder
            if (img.width === 120) {
                // Fallback to hqdefault
                thumbnailPreview.src = getThumbnailUrl(videoId, 'hqdefault');
            } else {
                thumbnailPreview.src = previewUrl;
            }
            loadingOverlay.classList.add('hidden');
        };
        img.onerror = () => {
            thumbnailPreview.src = getThumbnailUrl(videoId, 'hqdefault');
            loadingOverlay.classList.add('hidden');
        };
        img.src = previewUrl;
    };

    // Event Listeners
    homeBtn.addEventListener('click', () => {
        inputSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        homeBtn.classList.add('hidden');
        errorMessage.classList.add('hidden');
        urlInput.value = '';
        currentVideoId = '';
        
        // Trigger animation for input section
        inputSection.classList.remove('animate-in');
        void inputSection.offsetWidth;
        inputSection.classList.add('animate-in');
    });

    getBtn.addEventListener('click', handleGetThumbnail);
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGetThumbnail();
        }
    });

    openVideoBtn.addEventListener('click', () => {
        if (currentVideoId) {
            window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
        }
    });

    // Handle Downloads
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!currentVideoId) return;
            
            const quality = e.target.dataset.quality;
            const url = getThumbnailUrl(currentVideoId, quality);
            
            try {
                // Fetch the image and create a blob to trigger download
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `youtube-thumbnail-${quality}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                // Fallback if fetch fails (CORS)
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.download = `youtube-thumbnail-${quality}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    });

    // Handle Copy Links
    copyBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!currentVideoId) return;
            
            const quality = e.target.dataset.quality;
            const url = getThumbnailUrl(currentVideoId, quality);
            
            try {
                await navigator.clipboard.writeText(url);
                const originalText = e.target.textContent;
                e.target.textContent = '✅';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy link.');
            }
        });
    });
});
