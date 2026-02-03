/*!
 * Emby Reviews Integration
 * Adapted from Jellyfin-Enhanced Reviews -> THX to https://github.com/n00bcodr/Jellyfin-Enhanced
 * Shows TMDB Reviews for Library items in Emby
 * Add <script src="EmbyReviews.js"></script> in index.html before </body>
 */

(function() {
    'use strict';

    /* -------------- Configuration - Edit these values -------------- */

    const TMDB_API_KEY = 'YOUR_API_KEY'; // <-- Enter your TMDB API key here
    
    // Fallback language if user language cannot be detected
    const PRIMARY_LANGUAGE = 'en-US'; // <-- Enter your Language if it's not en-US
    
    // Always include en-US reviews as secondary source
    const SECONDARY_LANGUAGE = 'en-US';
    
    const MAX_REVIEWS = 30; // Maximum number of reviews to display
    const REVIEW_PREVIEW_LENGTH = 600; // Characters to show before "Read More"
    const EXPANDED_BY_DEFAULT = false; // Whether reviews section is expanded by default
    const SHOW_LANGUAGE_FLAGS = true; // Show language flags next to author names

    /* -------------- End of Configuration -------------- */

    const LOG_PREFIX = '📝 Emby Reviews:';
    let lastProcessedId = null;
    let reviewsExpandedState = EXPANDED_BY_DEFAULT;
    let detectedUserLanguage = null;

    console.log(`${LOG_PREFIX} Script starting...`);

    // Language code to flag emoji mapping
    const LANGUAGE_FLAGS = {
        'de': '🇩🇪', 'de-DE': '🇩🇪', 'de-AT': '🇦🇹', 'de-CH': '🇨🇭',
        'en': '🇺🇸', 'en-US': '🇺🇸', 'en-GB': '🇬🇧', 'en-AU': '🇦🇺', 'en-CA': '🇨🇦',
        'fr': '🇫🇷', 'fr-FR': '🇫🇷', 'fr-CA': '🇨🇦',
        'es': '🇪🇸', 'es-ES': '🇪🇸', 'es-MX': '🇲🇽',
        'it': '🇮🇹', 'it-IT': '🇮🇹',
        'pt': '🇵🇹', 'pt-PT': '🇵🇹', 'pt-BR': '🇧🇷',
        'nl': '🇳🇱', 'nl-NL': '🇳🇱',
        'pl': '🇵🇱', 'pl-PL': '🇵🇱',
        'ru': '🇷🇺', 'ru-RU': '🇷🇺',
        'ja': '🇯🇵', 'ja-JP': '🇯🇵',
        'ko': '🇰🇷', 'ko-KR': '🇰🇷',
        'zh': '🇨🇳', 'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼',
        'sv': '🇸🇪', 'sv-SE': '🇸🇪',
        'da': '🇩🇰', 'da-DK': '🇩🇰',
        'no': '🇳🇴', 'nb-NO': '🇳🇴',
        'fi': '🇫🇮', 'fi-FI': '🇫🇮',
        'cs': '🇨🇿', 'cs-CZ': '🇨🇿',
        'hu': '🇭🇺', 'hu-HU': '🇭🇺',
        'tr': '🇹🇷', 'tr-TR': '🇹🇷',
        'el': '🇬🇷', 'el-GR': '🇬🇷',
        'he': '🇮🇱', 'he-IL': '🇮🇱',
        'ar': '🇸🇦', 'ar-SA': '🇸🇦',
        'th': '🇹🇭', 'th-TH': '🇹🇭',
        'vi': '🇻🇳', 'vi-VN': '🇻🇳',
        'id': '🇮🇩', 'id-ID': '🇮🇩',
        'ms': '🇲🇾', 'ms-MY': '🇲🇾',
        'uk': '🇺🇦', 'uk-UA': '🇺🇦',
        'ro': '🇷🇴', 'ro-RO': '🇷🇴',
        'bg': '🇧🇬', 'bg-BG': '🇧🇬',
        'hr': '🇭🇷', 'hr-HR': '🇭🇷',
        'sk': '🇸🇰', 'sk-SK': '🇸🇰',
        'sl': '🇸🇮', 'sl-SI': '🇸🇮'
    };

	// Language code to COUNTRY code mapping (for flag images)
	const LANGUAGE_TO_COUNTRY = {
		'de': 'de', 'de-DE': 'de', 'de-AT': 'at', 'de-CH': 'ch',
		'en': 'us', 'en-US': 'us', 'en-GB': 'gb', 'en-AU': 'au', 'en-CA': 'ca',
		'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'ca',
		'es': 'es', 'es-ES': 'es', 'es-MX': 'mx',
		'it': 'it', 'it-IT': 'it',
		'pt': 'pt', 'pt-PT': 'pt', 'pt-BR': 'br',
		'nl': 'nl', 'nl-NL': 'nl',
		'pl': 'pl', 'pl-PL': 'pl',
		'ru': 'ru', 'ru-RU': 'ru',
		'ja': 'jp', 'ja-JP': 'jp',
		'ko': 'kr', 'ko-KR': 'kr',
		'zh': 'cn', 'zh-CN': 'cn', 'zh-TW': 'tw',
		'sv': 'se', 'sv-SE': 'se',
		'da': 'dk', 'da-DK': 'dk',
		'no': 'no', 'nb-NO': 'no',
		'fi': 'fi', 'fi-FI': 'fi',
		'cs': 'cz', 'cs-CZ': 'cz',
		'hu': 'hu', 'hu-HU': 'hu',
		'tr': 'tr', 'tr-TR': 'tr',
		'el': 'gr', 'el-GR': 'gr',
		'he': 'il', 'he-IL': 'il',
		'ar': 'sa', 'ar-SA': 'sa',
		'th': 'th', 'th-TH': 'th',
		'vi': 'vn', 'vi-VN': 'vn',
		'id': 'id', 'id-ID': 'id',
		'ms': 'my', 'ms-MY': 'my',
		'uk': 'ua', 'uk-UA': 'ua',
		'ro': 'ro', 'ro-RO': 'ro',
		'bg': 'bg', 'bg-BG': 'bg',
		'hr': 'hr', 'hr-HR': 'hr',
		'sk': 'sk', 'sk-SK': 'sk',
		'sl': 'si', 'sl-SI': 'si'
	};

	// Get language display name for tooltip
	function getLanguageDisplayName(langCode) {
		if (!langCode) return 'Unknown';
		try {
			const displayNames = new Intl.DisplayNames([langCode.split('-')[0]], { type: 'language' });
			return displayNames.of(langCode.split('-')[0]);
		} catch (e) {
			return langCode;
		}
	}

	function getLanguageFlag(langCode) {
		if (!langCode) return '<span class="emby-review-flag-fallback">🌐</span>';
		
		const countryCode = LANGUAGE_TO_COUNTRY[langCode] || LANGUAGE_TO_COUNTRY[langCode.split('-')[0]];
		
		if (countryCode) {
			// Using flagcdn.com for SVG flags
			return `<img class="emby-review-flag" src="https://flagcdn.com/w40/${countryCode}.png" srcset="https://flagcdn.com/w80/${countryCode}.png 2x" alt="${countryCode}" loading="lazy">`;
		}
		
		return '<span class="emby-review-flag-fallback">🌐</span>';
	}

    // Detect user language from Emby settings
    function detectUserLanguage() {
        // Method 1: Try to get from Emby's ApiClient if available
        if (typeof ApiClient !== 'undefined' && ApiClient.getCurrentUserId) {
            try {
                const userId = ApiClient.getCurrentUserId();
                if (userId && ApiClient.getUser) {
                    ApiClient.getUser(userId).then(user => {
                        if (user && user.Configuration && user.Configuration.SubtitleLanguagePreference) {
                            detectedUserLanguage = convertToTmdbLanguage(user.Configuration.SubtitleLanguagePreference);
                            console.log(`${LOG_PREFIX} Detected user language from subtitle preference: ${detectedUserLanguage}`);
                        }
                    }).catch(() => {});
                }
            } catch (e) {
                console.log(`${LOG_PREFIX} Could not get user settings from ApiClient`);
            }
        }

        // Method 2: Check Emby's globalize/culture settings
        if (typeof window.Globalize !== 'undefined' && window.Globalize.getLocale) {
            try {
                const locale = window.Globalize.getLocale();
                if (locale) {
                    detectedUserLanguage = convertToTmdbLanguage(locale);
                    console.log(`${LOG_PREFIX} Detected user language from Globalize: ${detectedUserLanguage}`);
                    return detectedUserLanguage;
                }
            } catch (e) {}
        }

        // Method 3: Check document language
        if (document.documentElement.lang) {
            detectedUserLanguage = convertToTmdbLanguage(document.documentElement.lang);
            console.log(`${LOG_PREFIX} Detected user language from document: ${detectedUserLanguage}`);
            return detectedUserLanguage;
        }

        // Method 4: Check navigator language
        if (navigator.language) {
            detectedUserLanguage = convertToTmdbLanguage(navigator.language);
            console.log(`${LOG_PREFIX} Detected user language from navigator: ${detectedUserLanguage}`);
            return detectedUserLanguage;
        }

        // Fallback
        detectedUserLanguage = PRIMARY_LANGUAGE;
        console.log(`${LOG_PREFIX} Using fallback language: ${detectedUserLanguage}`);
        return detectedUserLanguage;
    }

    // Convert various language formats to TMDB format
    function convertToTmdbLanguage(lang) {
        if (!lang) return PRIMARY_LANGUAGE;
        
        if (lang.match(/^[a-z]{2}-[A-Z]{2}$/)) {
            return lang;
        }
        
        const baseLang = lang.split('-')[0].toLowerCase();
        const regionMap = {
            'de': 'de-DE', 'en': 'en-US', 'fr': 'fr-FR', 'es': 'es-ES',
            'it': 'it-IT', 'pt': 'pt-PT', 'nl': 'nl-NL', 'pl': 'pl-PL',
            'ru': 'ru-RU', 'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN',
            'sv': 'sv-SE', 'da': 'da-DK', 'no': 'nb-NO', 'fi': 'fi-FI',
            'cs': 'cs-CZ', 'hu': 'hu-HU', 'tr': 'tr-TR', 'el': 'el-GR',
            'he': 'he-IL', 'ar': 'ar-SA', 'th': 'th-TH', 'vi': 'vi-VN',
            'id': 'id-ID', 'uk': 'uk-UA', 'ro': 'ro-RO', 'bg': 'bg-BG',
            'hr': 'hr-HR', 'sk': 'sk-SK', 'sl': 'sl-SI'
        };
        
        return regionMap[baseLang] || `${baseLang}-${baseLang.toUpperCase()}`;
    }

    // Load saved expanded state from localStorage
    function loadExpandedState() {
        try {
            const saved = localStorage.getItem('emby-reviews-expanded');
            if (saved !== null) {
                reviewsExpandedState = saved === 'true';
            }
        } catch (e) {
            console.log(`${LOG_PREFIX} Could not load expanded state from localStorage`);
        }
    }

    // Save expanded state to localStorage
    function saveExpandedState(expanded) {
        try {
            localStorage.setItem('emby-reviews-expanded', expanded.toString());
            reviewsExpandedState = expanded;
        } catch (e) {
            console.log(`${LOG_PREFIX} Could not save expanded state to localStorage`);
        }
    }

    // HTTP request function
    function makeRequest(url) {
        return fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            });
    }

    // Fetch reviews from TMDB API for a specific language
    async function fetchReviewsForLanguage(tmdbId, mediaType, language) {
        const apiMediaType = mediaType === 'tv' ? 'tv' : 'movie';
        const url = `https://api.themoviedb.org/3/${apiMediaType}/${tmdbId}/reviews?api_key=${TMDB_API_KEY}&language=${language}&page=1`;

        try {
            const data = await makeRequest(url);
            const reviews = data.results || [];
            return reviews.map(review => ({
                ...review,
                _sourceLanguage: language
            }));
        } catch (error) {
            console.error(`${LOG_PREFIX} Failed to fetch reviews for ${language}:`, error);
            return [];
        }
    }

    // Fetch and aggregate reviews from multiple languages
    async function fetchReviews(tmdbId, mediaType) {
        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
            console.error(`${LOG_PREFIX} TMDB API Key not configured!`);
            return null;
        }

        const primaryLanguage = detectedUserLanguage || detectUserLanguage();
        const languagesToFetch = [primaryLanguage];
        
        if (!primaryLanguage.startsWith('en')) {
            languagesToFetch.push(SECONDARY_LANGUAGE);
        }

        console.log(`${LOG_PREFIX} Fetching reviews for languages: ${languagesToFetch.join(', ')}`);

        try {
            const reviewPromises = languagesToFetch.map(lang => 
                fetchReviewsForLanguage(tmdbId, mediaType, lang)
            );
            
            const reviewArrays = await Promise.all(reviewPromises);
            
            const seenIds = new Set();
            const primaryReviews = [];
            const secondaryReviews = [];
            
            if (reviewArrays[0]) {
                for (const review of reviewArrays[0]) {
                    if (!seenIds.has(review.id)) {
                        seenIds.add(review.id);
                        primaryReviews.push(review);
                    }
                }
            }
            
            if (reviewArrays[1]) {
                for (const review of reviewArrays[1]) {
                    if (!seenIds.has(review.id)) {
                        seenIds.add(review.id);
                        secondaryReviews.push(review);
                    }
                }
            }
            
            const sortByDate = (a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            };
            
            primaryReviews.sort(sortByDate);
            secondaryReviews.sort(sortByDate);
            
            const combinedReviews = [...primaryReviews, ...secondaryReviews];
            
            console.log(`${LOG_PREFIX} Found ${primaryReviews.length} reviews in ${primaryLanguage}, ${secondaryReviews.length} in ${SECONDARY_LANGUAGE}`);
            
            return combinedReviews;
            
        } catch (error) {
            console.error(`${LOG_PREFIX} Failed to fetch reviews:`, error);
            return null;
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Parse Markdown to HTML
    function parseMarkdown(text) {
        if (!text) return '';

        let html = escapeHtml(text);

        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        html = html.replace(/(^|[^"'>])(https?:\/\/[^\s<]+[^\s<.,;!?)])/gi, function(match, prefix, url) {
            return prefix + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
        });

        const lines = html.split(/\r?\n/);
        const processed = [];
        let inBlockquote = false;
        let blockquoteLines = [];
        let inList = false;
        let listItems = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('&gt; ')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteLines = [];
                }
                blockquoteLines.push(trimmedLine.substring(5));
                continue;
            } else if (inBlockquote) {
                processed.push('<blockquote>' + blockquoteLines.join('<br>') + '</blockquote>');
                inBlockquote = false;
                blockquoteLines = [];
            }

            if (trimmedLine.match(/^[-*]\s+/)) {
                if (!inList) {
                    inList = true;
                    listItems = [];
                }
                listItems.push('<li>' + trimmedLine.substring(2) + '</li>');
                continue;
            } else if (inList) {
                processed.push('<ul>' + listItems.join('') + '</ul>');
                inList = false;
                listItems = [];
            }

            if (trimmedLine.match(/^#{1,6}\s/)) {
                const level = trimmedLine.match(/^#+/)[0].length;
                const text = trimmedLine.substring(level + 1);
                processed.push(`<h${level}>${text}</h${level}>`);
                continue;
            }

            if (trimmedLine.match(/^([-*]){3,}$/)) {
                processed.push('<hr>');
                continue;
            }

            if (trimmedLine) {
                processed.push(line);
            } else {
                processed.push('<br>');
            }
        }

        if (inBlockquote) {
            processed.push('<blockquote>' + blockquoteLines.join('<br>') + '</blockquote>');
        }
        if (inList) {
            processed.push('<ul>' + listItems.join('') + '</ul>');
        }

        return processed.join('');
    }

    // Create a single review card element
    function createReviewElement(review, allReviews) {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'emby-review-card';

        const content = review.content || 'No content available';
        const isLongReview = content.length > REVIEW_PREVIEW_LENGTH;
        const previewContent = isLongReview ? content.substring(0, REVIEW_PREVIEW_LENGTH) : content;

        const reviewDate = review.created_at ? new Date(review.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        }) : '';

        const rating = review.author_details?.rating;
        const ratingDisplay = rating 
            ? `<span class="emby-review-rating"><span class="emby-review-star">★</span> ${rating}/10</span>` 
            : '';

        const languageFlag = SHOW_LANGUAGE_FLAGS && review._sourceLanguage
            ? `<span class="emby-review-lang" title="${getLanguageDisplayName(review._sourceLanguage)}">${getLanguageFlag(review._sourceLanguage)}</span>`
            : '';

        reviewCard.innerHTML = `
            <div class="emby-review-header">
                <div class="emby-review-author-info">
                    <div class="emby-review-author-line">
                        <strong class="emby-review-author">${escapeHtml(review.author || 'Anonymous')}</strong>
                        ${languageFlag}
                    </div>
                    <span class="emby-review-date">${reviewDate}</span>
                </div>
                ${ratingDisplay}
            </div>
            <div class="emby-review-content-wrapper">
                <p class="emby-review-text"></p>
            </div>
        `;

        const textElement = reviewCard.querySelector('.emby-review-text');
        textElement.innerHTML = parseMarkdown(previewContent) +
            (isLongReview ? `<span class="emby-review-ellipsis">...</span> <span class="emby-review-toggle">Read More</span>` : '');

        reviewCard.dataset.reviewId = review.id;

        return reviewCard;
    }

    // Inject CSS styles
    function injectStyles() {
        const styleId = 'emby-reviews-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Reviews Section Container */
            .emby-reviews-section {
                display: flex;
                flex-direction: column;
				backdrop-filter: blur(10px);
            }

            /* Summary/Header styling */
            .emby-reviews-section summary {
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                user-select: none;
                -webkit-user-select: none;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                color: #fff;
            }

            .emby-reviews-section summary::-webkit-details-marker {
                display: none;
            }

            .emby-reviews-section summary::marker {
                display: none;
                content: '';
            }

            .emby-reviews-section summary .expand-icon {
                color: rgba(255, 255, 255, 0.8);
                transition: transform 0.2s ease-in-out;
                font-size: 20px;
            }

            .emby-reviews-section[open] summary .expand-icon {
                transform: rotate(180deg);
            }

            .emby-reviews-section summary:hover {
                background: rgba(0, 0, 0, 0.4);
            }

            /* Swipe Container for horizontal scrolling */
            .emby-review-swipe-container {
                display: flex;
                overflow-x: auto;
                gap: 1.2em;
                padding: 1em 0.5em;
                scroll-snap-type: x mandatory;
                scrollbar-width: thin;
                scrollbar-color: var(--theme-primary-color) transparent;
            }

            .emby-review-swipe-container::-webkit-scrollbar {
                height: 6px;
            }

            .emby-review-swipe-container::-webkit-scrollbar-track {
                background: transparent;
            }

            .emby-review-swipe-container::-webkit-scrollbar-thumb {
                background: rgba(0, 164, 220, 0.5);
                border-radius: 3px;
            }

            /* Individual Review Card */
            .emby-review-card {
                flex: 0 0 85%;
                max-width: 500px;
                min-width: 280px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 8px;
                border-left: 4px solid rgb(0, 164, 220);
                padding: 1.5em;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                scroll-snap-align: start;
                display: flex;
                flex-direction: column;
            }

            @media (min-width: 768px) {
                .emby-review-card {
                    flex-basis: 400px;
                }
            }

            /* Review Header */
            .emby-review-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1em;
                gap: 1em;
            }

            .emby-review-author-info {
                display: flex;
                flex-direction: column;
                gap: 0.3em;
            }

            .emby-review-author-line {
                display: flex;
                align-items: center;
                gap: 0.5em;
            }

            .emby-review-author {
                color: #fff;
                font-size: 1.1em;
                font-weight: 600;
            }

            .emby-review-lang {
                font-size: 1em;
                cursor: help;
            }

            .emby-review-date {
                color: #aaa;
                font-size: 0.9em;
            }

            /* Rating Badge */
            .emby-review-rating {
                color: #ffd700;
                background: rgba(255, 215, 0, 0.15);
                padding: 0.3em 0.6em;
                border-radius: 4px;
                font-weight: 600;
                font-size: 0.95em;
                white-space: nowrap;
            }

            .emby-review-star {
                margin-right: 2px;
            }

            /* Review Content */
            .emby-review-content-wrapper {
                flex-grow: 1;
                line-height: 1.7;
                overflow-y: auto;
                color: #ddd;
                font-size: 0.95em;
                max-height: 300px;
            }

            .emby-review-text {
                word-wrap: break-word;
                margin: 0;
            }

            .emby-review-text.expanded {
                max-height: none;
            }

            /* Markdown Styling within Reviews */
            .emby-review-text strong { color: #fff; font-weight: 600; }
            .emby-review-text em { font-style: italic; color: #e0e0e0; }
            .emby-review-text del { text-decoration: line-through; opacity: 0.7; }
            .emby-review-text code { background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; color: #ffa500; }
            .emby-review-text blockquote { border-left: 3px solid rgb(0, 164, 220); padding-left: 1em; margin: 0.8em 0; color: #aaa; font-style: italic; }
            .emby-review-text h1, .emby-review-text h2, .emby-review-text h3, .emby-review-text h4, .emby-review-text h5, .emby-review-text h6 { color: #fff; margin: 0.8em 0 0.4em 0; font-weight: 600; }
            .emby-review-text h1 { font-size: 1.4em; }
            .emby-review-text h2 { font-size: 1.25em; }
            .emby-review-text h3 { font-size: 1.1em; }
            .emby-review-text h4, .emby-review-text h5, .emby-review-text h6 { font-size: 1em; }
            .emby-review-text ul, .emby-review-text ol { margin: 0.5em 0; padding-left: 1.5em; }
            .emby-review-text li { margin: 0.3em 0; }
            .emby-review-text hr { border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 1em 0; }
            .emby-review-text a { color: rgb(0, 164, 220); text-decoration: underline; }
            .emby-review-text a:hover { color: rgb(50, 200, 250); }

            /* Read More/Less Toggle */
            .emby-review-ellipsis { color: #888; }
            .emby-review-toggle { color: rgb(0, 164, 220); font-weight: bold; cursor: pointer; text-decoration: underline; margin-left: 0.3em; }
            .emby-review-toggle:hover { color: rgb(50, 200, 250); }

            /* No Reviews Message */
            .emby-reviews-none {
                color: #888;
                font-size: 13px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                border-left: 4px solid rgb(0, 164, 220);
                margin-top: 0;
            }

            /* Wrapper for positioning in additionalContent area */
            .emby-reviews-wrapper {
                margin-bottom: 1em;
				margin: 0em 2.9em;
            }
			
			/* Flag Images */
			.emby-review-flag {
				width: 20px;
				height: 15px;
				object-fit: cover;
				border-radius: 2px;
				vertical-align: middle;
				box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
			}

			.emby-review-flag-fallback {
				font-size: 1em;
				vertical-align: middle;
			}

			.emby-review-lang {
				display: inline-flex;
				align-items: center;
				cursor: help;
			}
        `;
        document.head.appendChild(style);
    }

    // Find the correct insertion point - ALWAYS before peopleSection
    function findInsertionPoint(contextPage) {
        // Primary target: Insert BEFORE the peopleSection (Besetzung & Mitwirkende)
        const peopleSection = contextPage.querySelector('.peopleSection');
        if (peopleSection) {
            return { element: peopleSection, position: 'before' };
        }

        // Fallback 1: After Elsewhere container if it exists
        const elsewhereContainer = contextPage.querySelector('.streaming-lookup-container');
        if (elsewhereContainer) {
            return { element: elsewhereContainer, position: 'after' };
        }

        // Fallback 2: At the beginning of additionalContent area
        const additionalContent = contextPage.querySelector('.details-additionalContent');
        if (additionalContent && additionalContent.firstChild) {
            return { element: additionalContent.firstChild, position: 'before' };
        }

        // Fallback 3: After overview container in detailTextContainer
        const overviewContainer = contextPage.querySelector('.overview-container');
        if (overviewContainer) {
            return { element: overviewContainer, position: 'after' };
        }

        // Fallback 4: After tagline
        const tagline = contextPage.querySelector('.tagline');
        if (tagline) {
            return { element: tagline, position: 'after' };
        }

        return null;
    }

    // Add reviews section to the page
    function addReviewsToPage(reviews, contextPage, tmdbId, mediaType) {
        // Remove existing reviews section if present
        const existingSection = contextPage.querySelector('.emby-reviews-section');
        if (existingSection) {
            existingSection.remove();
        }
        const existingWrapper = contextPage.querySelector('.emby-reviews-wrapper');
        if (existingWrapper) {
            existingWrapper.remove();
        }

        let reviewsSection;
        const hasReviews = reviews && reviews.length > 0;

		if (hasReviews) {
			reviewsSection = document.createElement('details');
			reviewsSection.className = 'emby-reviews-section';
			
			if (reviewsExpandedState) {
				reviewsSection.setAttribute('open', '');
			}

			const summary = document.createElement('summary');
			summary.innerHTML = `Reviews (${reviews.length}) <span class="md-icon expand-icon">expand_more</span>`;
			reviewsSection.appendChild(summary);

			const swipeContainer = document.createElement('div');
			swipeContainer.className = 'emby-review-swipe-container';

			const displayReviews = reviews.slice(0, MAX_REVIEWS);
			displayReviews.forEach(review => {
				swipeContainer.appendChild(createReviewElement(review, reviews));
			});

			reviewsSection.appendChild(swipeContainer);

			// Sanftes horizontales Scrollen mit Mausrad
			let targetScrollPos = 0;
			let currentScrollPos = 0;
			let isScrolling = false;
			
			function smoothScroll() {
				if (!isScrolling) return;
				
				const diff = targetScrollPos - currentScrollPos;
				
				// Wenn fast am Ziel, direkt setzen und stoppen
				if (Math.abs(diff) < 1) {
					currentScrollPos = targetScrollPos;
					swipeContainer.scrollLeft = currentScrollPos;
					isScrolling = false;
					return;
				}
				
				// Sanfte Annäherung (ease-out Effekt)
				currentScrollPos += diff * 0.5;
				swipeContainer.scrollLeft = currentScrollPos;
				
				requestAnimationFrame(smoothScroll);
			}
			
			swipeContainer.addEventListener('wheel', function(e) {
				const maxScroll = this.scrollWidth - this.clientWidth;
				
				if (maxScroll > 0 && e.deltaY !== 0) {
					e.preventDefault();
					e.stopPropagation();
					
					// Initialisiere Position beim ersten Scroll
					if (!isScrolling) {
						currentScrollPos = this.scrollLeft;
					}
					
					// Berechne neue Zielposition (deltaY direkt nutzen für natürliches Gefühl)
					targetScrollPos = targetScrollPos + e.deltaY * 4;
					targetScrollPos = Math.max(0, Math.min(maxScroll, targetScrollPos));
					
					// Starte Animation falls nicht bereits aktiv
					if (!isScrolling) {
						isScrolling = true;
						requestAnimationFrame(smoothScroll);
					}
				}
			}, { passive: false });

			swipeContainer.addEventListener('click', function(e) {
				if (e.target.classList.contains('emby-review-toggle')) {
					const textElement = e.target.closest('.emby-review-text');
					const card = e.target.closest('.emby-review-card');
					const reviewId = card.dataset.reviewId;
					
					const review = reviews.find(r => String(r.id) === String(reviewId));
					
					if (!review) return;

					if (textElement.classList.toggle('expanded')) {
						textElement.innerHTML = parseMarkdown(review.content) + 
							` <span class="emby-review-toggle">Read Less</span>`;
					} else {
						const previewContent = review.content.substring(0, REVIEW_PREVIEW_LENGTH);
						textElement.innerHTML = parseMarkdown(previewContent) + 
							`<span class="emby-review-ellipsis">...</span> <span class="emby-review-toggle">Read More</span>`;
					}
				}
			});

            reviewsSection.addEventListener('toggle', function() {
                saveExpandedState(reviewsSection.open);
            });

        } else {
            reviewsSection = document.createElement('div');
            reviewsSection.className = 'emby-reviews-section';
            
            const header = document.createElement('div');
            header.className = 'emby-reviews-none';
            header.textContent = 'Reviews (0) - No reviews available';
            reviewsSection.appendChild(header);
        }

        // Find the correct insertion point
        const insertionPoint = findInsertionPoint(contextPage);

        if (insertionPoint) {
            const { element, position } = insertionPoint;
            
            // Create a wrapper div for proper spacing in the additionalContent area
            const wrapper = document.createElement('div');
            wrapper.className = 'emby-reviews-wrapper verticalSection verticalSection-cards';
            wrapper.appendChild(reviewsSection);

            if (position === 'before') {
                element.parentNode.insertBefore(wrapper, element);
                console.log(`${LOG_PREFIX} Reviews section inserted BEFORE ${element.className || element.tagName}`);
            } else if (position === 'after') {
                if (element.nextSibling) {
                    element.parentNode.insertBefore(wrapper, element.nextSibling);
                } else {
                    element.parentNode.appendChild(wrapper);
                }
                console.log(`${LOG_PREFIX} Reviews section inserted AFTER ${element.className || element.tagName}`);
            }
        } else {
            // Ultimate fallback: append to detailTextContainer (in the overview area)
            const detailContainer = contextPage.querySelector('.detailTextContainer');
            if (detailContainer) {
                // Insert directly without wrapper for this fallback location
                detailContainer.appendChild(reviewsSection);
                console.log(`${LOG_PREFIX} Reviews section appended to detailTextContainer (fallback)`);
            } else {
                console.error(`${LOG_PREFIX} Could not find any suitable anchor to insert reviews`);
            }
        }
    }

    // Get TMDB info from page links
    function getTmdbInfoFromPage(detailPage) {
        const selectors = ['.itemLinks', '.linksSection', '.aboutSection'];
        for (const selector of selectors) {
            const section = detailPage.querySelector(selector);
            if (section) {
                const tmdbLink = section.querySelector('a[href*="themoviedb.org"]');
                if (tmdbLink) {
                    const match = tmdbLink.href.match(/themoviedb\.org\/(movie|tv)\/(\d+)/);
                    if (match) {
                        return { mediaType: match[1], tmdbId: match[2] };
                    }
                }
            }
        }

        const allLinks = detailPage.querySelectorAll('a[href*="themoviedb.org"]');
        for (const link of allLinks) {
            const match = link.href.match(/themoviedb\.org\/(movie|tv)\/(\d+)/);
            if (match) {
                return { mediaType: match[1], tmdbId: match[2] };
            }
        }

        return null;
    }

    // Wait for peopleSection to be available (indicates page is fully loaded)
    function waitForPeopleSection(detailPage, timeout = 5000) {
        return new Promise((resolve) => {
            const existing = detailPage.querySelector('.peopleSection');
            if (existing) {
                resolve(existing);
                return;
            }

            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const section = detailPage.querySelector('.peopleSection');
                if (section) {
                    clearInterval(checkInterval);
                    resolve(section);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve(null);
                }
            }, 100);
        });
    }

    // Process detail page
    async function processDetailPage(detailPage) {
        if (!detailPage || detailPage.classList.contains('hide')) {
            return;
        }

        if (detailPage.querySelector('.emby-reviews-section')) {
            return;
        }

        const tmdbInfo = getTmdbInfoFromPage(detailPage);
        if (!tmdbInfo) {
            console.log(`${LOG_PREFIX} No TMDB link found on this page`);
            return;
        }

        const pageId = `${tmdbInfo.mediaType}-${tmdbInfo.tmdbId}`;
        if (lastProcessedId === pageId && detailPage.querySelector('.emby-reviews-section')) {
            return;
        }
        lastProcessedId = pageId;

        const { mediaType, tmdbId } = tmdbInfo;
        console.log(`${LOG_PREFIX} Processing TMDB ${mediaType}/${tmdbId}`);

        // Wait for peopleSection to be available (ensures page is ready)
        await waitForPeopleSection(detailPage, 3000);

        // Fetch and display reviews
        const reviews = await fetchReviews(tmdbId, mediaType);
        
        if (reviews !== null) {
            addReviewsToPage(reviews, detailPage, tmdbId, mediaType);
        } else {
            console.log(`${LOG_PREFIX} Failed to fetch reviews or API key not configured`);
        }
    }

    // Check for visible detail page
    function checkForDetailPage() {
        const detailPages = document.querySelectorAll('.view-item-item');
        for (const page of detailPages) {
            if (!page.classList.contains('hide')) {
                processDetailPage(page);
                return;
            }
        }
    }

    // Setup mutation observer for SPA navigation
    function setupObserver() {
        let debounceTimer = null;

        const debouncedCheck = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(checkForDetailPage, 300);
        };

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('view-item-item') && !target.classList.contains('hide')) {
                        setTimeout(() => processDetailPage(target), 500);
                    }
                }

                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;

                        if (node.classList && node.classList.contains('view-item-item')) {
                            setTimeout(() => processDetailPage(node), 500);
                        } else if (node.querySelector) {
                            const detailPage = node.querySelector('.view-item-item:not(.hide)');
                            if (detailPage) {
                                setTimeout(() => processDetailPage(detailPage), 500);
                            }
                        }

                        // Check for peopleSection being added (indicates page content is loaded)
                        if (node.classList && node.classList.contains('peopleSection')) {
                            debouncedCheck();
                        } else if (node.querySelector && node.querySelector('.peopleSection')) {
                            debouncedCheck();
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        window.addEventListener('hashchange', () => {
            lastProcessedId = null;
            setTimeout(checkForDetailPage, 500);
        });

        window.addEventListener('popstate', () => {
            lastProcessedId = null;
            setTimeout(checkForDetailPage, 500);
        });

        document.addEventListener('viewshow', () => {
            setTimeout(checkForDetailPage, 500);
        });

        document.addEventListener('pageshow', () => {
            setTimeout(checkForDetailPage, 500);
        });
    }

    // Initialize
    function init() {
        injectStyles();
        loadExpandedState();
        detectUserLanguage();
        setupObserver();
        
        setTimeout(checkForDetailPage, 1500);
        setInterval(checkForDetailPage, 5000);

        console.log(`${LOG_PREFIX} Initialized successfully!`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.EmbyReviews = {
        refresh: checkForDetailPage,
        init: init,
        getDetectedLanguage: () => detectedUserLanguage
    };

})();