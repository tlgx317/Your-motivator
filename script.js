// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const menuButton = document.getElementById('menuButton');
    const closeDrawerButton = document.getElementById('closeDrawerButton');
    const drawerNav = document.getElementById('drawerNav');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const quoteTextElement = document.getElementById('quoteText');
    const quoteAuthorElement = document.getElementById('quoteAuthor');
    const nextQuoteButton = document.getElementById('nextQuoteButton');
    const fetchApiQuoteButton = document.getElementById('fetchApiQuoteButton');
    const favoriteButton = document.getElementById('favoriteButton');
    const favoritesListElement = document.getElementById('favoritesList');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorIndicator = document.getElementById('errorIndicator');

    // --- State Variables ---
    let currentQuote = null; // Holds the object { text: '...', author: '...' }
    let favorites = []; // Array to hold favorite quote objects

    // --- API Configuration ---
    const API_URL = 'https://api.quotable.io/random'; // Using quotable.io API

    // --- Functions ---

    // Drawer Toggle
    const toggleDrawer = () => {
        drawerNav.classList.toggle('open');
        overlay.classList.toggle('active');
    };

    // Navigate between pages
    const navigateToPage = (pageId) => {
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        // Update active link state
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            }
        });
        // Close drawer after navigation
        if (drawerNav.classList.contains('open')) {
            toggleDrawer();
        }
        // Special actions for specific pages
        if (pageId === 'favorites-page') {
            displayFavorites();
        }
    };

    // Show Loading Indicator
    const showLoading = (isApi = false) => {
        quoteTextElement.style.display = 'none';
        quoteAuthorElement.style.display = 'none';
        loadingIndicator.textContent = isApi ? 'Fetching from internet...' : 'Loading quote...';
        loadingIndicator.style.display = 'block';
        errorIndicator.style.display = 'none';
        favoriteButton.disabled = true; // Disable actions while loading
        nextQuoteButton.disabled = true;
        fetchApiQuoteButton.disabled = true;
    };

    // Hide Loading/Error Indicators
    const hideLoading = () => {
        quoteTextElement.style.display = 'block';
        quoteAuthorElement.style.display = 'block';
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'none';
         favoriteButton.disabled = false;
         nextQuoteButton.disabled = false;
         fetchApiQuoteButton.disabled = false;
    };

     // Show Error Indicator
     const showError = (message) => {
        loadingIndicator.style.display = 'none';
        quoteTextElement.style.display = 'none';
        quoteAuthorElement.style.display = 'none';
        errorIndicator.textContent = message || 'Could not load quote.';
        errorIndicator.style.display = 'block';
        favoriteButton.disabled = true; // Keep disabled on error
        // Re-enable next/fetch buttons so user can retry
        nextQuoteButton.disabled = false;
        fetchApiQuoteButton.disabled = false;
    };

    // Display Quote on the Homepage
    const displayQuote = (quote) => {
        hideLoading();
        if (quote && quote.text) {
            currentQuote = quote; // Store the current quote object
            quoteTextElement.textContent = quote.text;
            quoteAuthorElement.textContent = quote.author || 'Unknown';
            updateFavoriteButtonState(); // Update fav button based on the new quote
        } else {
            showError("Received invalid quote data.");
        }
    };

    // Get a random quote from the local list
    const getRandomLocalQuote = () => {
        showLoading();
        // Check if localQuotes is defined and has items
        if (typeof localQuotes !== 'undefined' && localQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * localQuotes.length);
            // Simulate slight delay for UX
            setTimeout(() => {
                displayQuote(localQuotes[randomIndex]);
            }, 200);
        } else {
            // Fallback if localQuotes is missing or empty
            setTimeout(() => {
                displayQuote({ text: "Define local quotes in quotes.js or fetch online.", author: "Developer" });
            }, 200);
        }
    };

    // Fetch a quote from the API
    const fetchQuoteFromAPI = async () => {
        showLoading(true); // Indicate API fetch
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            // API returns { content: '...', author: '...' }
            displayQuote({ text: data.content, author: data.author });
        } catch (error) {
            console.error('Error fetching quote:', error);
            showError('Could not fetch quote. Check internet connection.');
            // Optionally: try a local quote as fallback
            // getRandomLocalQuote();
        }
    };


    // --- Favorites Logic ---

    // Load Favorites from Local Storage
    const loadFavorites = () => {
        const storedFavorites = localStorage.getItem('motivatorFavorites');
        if (storedFavorites) {
            favorites = JSON.parse(storedFavorites);
        } else {
            favorites = [];
        }
    };

    // Save Favorites to Local Storage
    const saveFavorites = () => {
        localStorage.setItem('motivatorFavorites', JSON.stringify(favorites));
    };

    // Check if the current quote is already favorited
    const isCurrentQuoteFavorited = () => {
        if (!currentQuote) return false;
        return favorites.some(fav => fav.text === currentQuote.text && fav.author === currentQuote.author);
    };

    // Update Favorite Button Appearance
    const updateFavoriteButtonState = () => {
        const isFavorited = isCurrentQuoteFavorited();
        favoriteButton.classList.toggle('favorited', isFavorited);
        favoriteButton.querySelector('i').classList.toggle('fas', isFavorited); // Solid heart
        favoriteButton.querySelector('i').classList.toggle('far', !isFavorited); // Outline heart
        favoriteButton.setAttribute('aria-label', isFavorited ? 'Remove from Favorites' : 'Add to Favorites');
    };

    // Toggle Favorite Status
    const toggleFavorite = () => {
        if (!currentQuote) return;

        const existingIndex = favorites.findIndex(fav => fav.text === currentQuote.text && fav.author === currentQuote.author);

        if (existingIndex > -1) {
            // Remove from favorites
            favorites.splice(existingIndex, 1);
        } else {
            // Add to favorites
            favorites.push({ ...currentQuote }); // Add a copy
        }
        saveFavorites();
        updateFavoriteButtonState();
        // If on the favorites page, refresh the list
        if (document.getElementById('favorites-page').classList.contains('active')) {
             displayFavorites();
        }
    };

    // Display Favorites on the Favorites Page
    const displayFavorites = () => {
        loadFavorites(); // Ensure we have the latest
        favoritesListElement.innerHTML = ''; // Clear existing list

        if (favorites.length === 0) {
            favoritesListElement.innerHTML = '<p>You haven\'t favorited any quotes yet.</p>';
            return;
        }

        favorites.forEach((quote, index) => {
            const item = document.createElement('div');
            item.classList.add('favorite-item');
            item.innerHTML = `
                <div class="quote-content">
                    <p class="fav-quote-text">${quote.text}</p>
                    <p class="fav-quote-author">${quote.author || 'Unknown'}</p>
                </div>
                <button class="remove-favorite-button" data-index="${index}" aria-label="Remove favorite">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            // Add event listener directly to the button
            const removeButton = item.querySelector('.remove-favorite-button');
            removeButton.addEventListener('click', () => removeFavorite(index));

            favoritesListElement.appendChild(item);
        });
    };

    // Remove a specific favorite by index
    const removeFavorite = (index) => {
        if (index >= 0 && index < favorites.length) {
             // Check if the currently displayed quote on the home page is the one being removed
             const removedQuote = favorites[index];
             const isRemovingCurrent = currentQuote && currentQuote.text === removedQuote.text && currentQuote.author === removedQuote.author;

             favorites.splice(index, 1); // Remove from array
             saveFavorites(); // Update local storage
             displayFavorites(); // Re-render the list

             // If the removed quote was the one displayed on the home page, update its favorite button
             if (isRemovingCurrent) {
                 updateFavoriteButtonState();
             }
        }
    };


    // --- Event Listeners ---
    menuButton.addEventListener('click', toggleDrawer);
    closeDrawerButton.addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', toggleDrawer);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            const pageId = link.dataset.page;
            navigateToPage(pageId);
        });
    });

    nextQuoteButton.addEventListener('click', getRandomLocalQuote);
    fetchApiQuoteButton.addEventListener('click', fetchQuoteFromAPI);
    favoriteButton.addEventListener('click', toggleFavorite);


    // --- Initialization ---
    const initializeApp = () => {
        loadFavorites(); // Load favorites first
        navigateToPage('home-page'); // Start on the home page
        // Get initial quote (try API first, fallback to local)
        fetchQuoteFromAPI().catch(() => {
             console.warn("API fetch failed on init, trying local quote.");
             getRandomLocalQuote(); // Fallback on initial load error
        });
    };

    initializeApp();

}); // End DOMContentLoaded