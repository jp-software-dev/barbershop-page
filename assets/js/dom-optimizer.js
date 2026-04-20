// OPTIMIZATION: DocumentFragment batch rendering and event delegation
const DOMOptimizer = {
    // PERFORMANCE: Render products using fragment (single reflow)
    renderProductGrid: function(products, containerId, renderCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // USE FRAGMENT: Batch DOM operations
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        products.forEach(product => {
            const productHTML = renderCallback(product);
            tempDiv.innerHTML = productHTML;
            const element = tempDiv.firstElementChild;
            if (element) fragment.appendChild(element);
        });
        
        // SINGLE REFLOW: Clear and append fragment once
        container.innerHTML = '';
        container.appendChild(fragment);
    },
    
    // PERFORMANCE: Lazy load images with Intersection Observer
    initLazyLoading: function() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.01
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // FALLBACK: Load all images immediately for older browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
            });
        }
    },
    
    // PERFORMANCE: Event delegation for dynamic elements
    setupDelegation: function(parentSelector, eventType, targetSelector, callback) {
        const parent = document.querySelector(parentSelector);
        if (!parent) return;
        
        parent.addEventListener(eventType, (e) => {
            const target = e.target.closest(targetSelector);
            if (target) callback(e, target);
        });
    },
    
    // PERFORMANCE: Debounce function for search inputs
    debounce: function(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // PERFORMANCE: Throttle for scroll events
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // PERFORMANCE: Cache DOM element reference
    cacheElement: function(id) {
        if (!this._cache) this._cache = {};
        if (!this._cache[id]) {
            this._cache[id] = document.getElementById(id);
        }
        return this._cache[id];
    },
    
    // PERFORMANCE: Clear cache for dynamic elements
    clearCache: function(id) {
        if (this._cache && this._cache[id]) {
            delete this._cache[id];
        }
    }
};