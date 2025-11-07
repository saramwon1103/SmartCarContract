// Favorite Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Heart icon toggle
    const heartIcons = document.querySelectorAll('.heart-icon');
    heartIcons.forEach((icon, index) => {
        // Check if this car is favorited
        if (favorites.includes(index)) {
            icon.classList.add('active');
            icon.innerHTML = '<i class="fa-solid fa-heart"></i>';
        }
        
        // Add click event listener
        icon.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('active');
            
            // Update icon
            if (this.classList.contains('active')) {
                this.innerHTML = '<i class="fa-solid fa-heart"></i>';
                // Add to favorites
                if (!favorites.includes(index)) {
                    favorites.push(index);
                }
            } else {
                this.innerHTML = '<i class="fa-regular fa-heart"></i>';
                // Remove from favorites
                const favIndex = favorites.indexOf(index);
                if (favIndex > -1) {
                    favorites.splice(favIndex, 1);
                }
            }
            
            // Save to localStorage
            localStorage.setItem('favorites', JSON.stringify(favorites));
        });
    });
    
    // Rent Now Button Functionality
    const rentButtons = document.querySelectorAll('.rent-btn');
    rentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const carCard = this.closest('.car-card');
            const carName = carCard.querySelector('.car-name').textContent;
            
            // You can redirect to rental form page or show modal
            console.log('Renting:', carName);
            // window.location.href = `rental_form.html?car=${encodeURIComponent(carName)}`;
            
            // Show temporary feedback
            const originalText = this.textContent;
            this.textContent = 'Processing...';
            this.style.background = '#90A3BF';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '#3563E9';
                alert(`Request submitted for ${carName}. Redirecting to rental form...`);
            }, 800);
        });
    });
    
    // Hero Rental Buttons
    const heroRentalButtons = document.querySelectorAll('.rental-btn');
    heroRentalButtons.forEach(button => {
        if (!button.classList.contains('rent-btn')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                // Scroll to car catalog
                const catalogSection = document.querySelector('.popular-section');
                catalogSection.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
    
    // Show More Button
    const showMoreBtn = document.querySelector('.show-more-btn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // This would typically load more cars via AJAX
            console.log('Loading more cars...');
            
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-chevron-down')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
                this.innerHTML = 'Show less cars <i class="fa-solid fa-chevron-up"></i>';
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                this.innerHTML = 'Show more cars <i class="fa-solid fa-chevron-down"></i>';
            }
        });
    }
    
    // Auto-resize iframe heights
    function resizeIframes() {
        const headerFrame = document.getElementById('header-frame');
        const footerFrame = document.getElementById('footer-frame');
        
        if (headerFrame) {
            try {
                const headerDoc = headerFrame.contentDocument || headerFrame.contentWindow.document;
                if (headerDoc) {
                    headerFrame.style.height = headerDoc.body.scrollHeight + 'px';
                }
            } catch (e) {
                console.log('Cannot access header iframe content');
            }
        }
        
        if (footerFrame) {
            try {
                const footerDoc = footerFrame.contentDocument || footerFrame.contentWindow.document;
                if (footerDoc) {
                    footerFrame.style.height = footerDoc.body.scrollHeight + 'px';
                }
            } catch (e) {
                console.log('Cannot access footer iframe content');
            }
        }
    }
    
    // Resize on load
    window.addEventListener('load', resizeIframes);
    
    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all car cards
    document.querySelectorAll('.car-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});
