// home.js
document.addEventListener('DOMContentLoaded', () => {

    // ------------------------------
    // Helper Functions
    // ------------------------------
    function formatPrice(price) {
        if (!price) return '$0.00';
        return '$' + parseFloat(price).toFixed(2);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.getFullYear();
    }

    function getStatusBadgeClass(status) {
        const statusLower = (status || '').toLowerCase();
        if (statusLower === 'available') return 'available';
        if (statusLower === 'rented') return 'rented';
        if (statusLower === 'maintenance') return 'maintenance';
        if (statusLower === 'sold') return 'sold';
        return 'available';
    }

    function getStatusText(status) {
        if (!status) return 'Available';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    // ------------------------------
    // 1️⃣ Load Cars từ Backend
    // ------------------------------
    async function loadCarsFromDB() {
        try {
            const res = await fetch("http://localhost:3000/api/cars"); // endpoint backend
            const cars = await res.json();

            const popularGrid = document.querySelector(".popular-grid");
            const recommendationGrid = document.querySelector(".recommendation-section .car-grid");
            popularGrid.innerHTML = "";
            recommendationGrid.innerHTML = "";

            // Filter only available cars for display
            const availableCars = cars.filter(car => {
                const status = (car.Status || '').toLowerCase();
                return status === 'available' || status === '';
            });

            availableCars.forEach((car, index) => {
                const card = document.createElement("div");
                card.className = "car-card";
                card.dataset.index = index;
                card.dataset.carId = car.CarId || '';
                card.dataset.ownerId = car.OwnerId || '';

                // Format model year
                const modelYear = formatDate(car.ModelYear);
                
                // Format prices
                const priceRent = formatPrice(car.PriceRent);
                const priceBuy = formatPrice(car.PriceBuy);
                
                // Status badge
                const statusClass = getStatusBadgeClass(car.Status);
                const statusText = getStatusText(car.Status);

                card.innerHTML = `
                    <div class="card-header">
                        <div>
                            <h4 class="car-name">${car.CarName || 'Unknown Car'}</h4>
                            <p class="car-category">${car.Brand || 'Unknown Brand'}</p>
                        </div>
                        <div class="card-header-right">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <button class="heart-icon" data-car-id="${car.CarId || ''}">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="car-image-container">
                        <img src="${car.ImageURL || 'https://via.placeholder.com/232x72'}" 
                             alt="${car.CarName || 'Car'}" 
                             class="car-img"
                             onerror="this.src='https://via.placeholder.com/232x72'">
                        ${car.Description ? `<div class="car-description-tooltip">${car.Description}</div>` : ''}
                    </div>
                    <div class="car-specs">
                        <div class="spec-item">
                            <i class="fa-solid fa-calendar"></i>
                            <span>${modelYear || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <i class="fa-solid fa-tag"></i>
                            <span>${car.Brand || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <i class="fa-solid fa-id-card"></i>
                            <span>ID: ${car.CarId || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="pricing">
                            <div class="price-rent">
                                <span class="price-label">Rent:</span>
                                <span class="current-price">${priceRent}/<span class="day">day</span></span>
                            </div>
                            ${car.PriceBuy ? `
                            <div class="price-buy">
                                <span class="price-label">Buy:</span>
                                <span class="buy-price">${priceBuy}</span>
                            </div>
                            ` : ''}
                        </div>
                        <div class="card-actions">
                            <button class="rent-btn" data-car-id="${car.CarId || ''}">Rent Now</button>
                            ${car.PriceBuy ? `<button class="buy-btn" data-car-id="${car.CarId || ''}">Buy</button>` : ''}
                        </div>
                    </div>
                `;

                // Gán cho popular hoặc recommendation theo logic ví dụ
                if(index < 4) popularGrid.appendChild(card);
                else recommendationGrid.appendChild(card);
            });

            // Update total cars count
            const totalCarsElement = document.querySelector('.total-cars');
            if (totalCarsElement) {
                totalCarsElement.textContent = `${availableCars.length} Cars`;
            }

            attachFavorites();
            attachRentButtons();
            attachBuyButtons();
            animateCarCards();

        } catch (err) {
            console.error("Error loading cars:", err);
            // Show error message to user
            const popularGrid = document.querySelector(".popular-grid");
            const recommendationGrid = document.querySelector(".recommendation-section .car-grid");
            if (popularGrid) {
                popularGrid.innerHTML = '<div class="error-message">Failed to load cars. Please try again later.</div>';
            }
            if (recommendationGrid) {
                recommendationGrid.innerHTML = '<div class="error-message">Failed to load cars. Please try again later.</div>';
            }
        }
    }

    // ------------------------------
    // 2️⃣ Favorites Toggle
    // ------------------------------
    function attachFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const heartIcons = document.querySelectorAll('.heart-icon');

        heartIcons.forEach((icon) => {
            const carId = icon.dataset.carId;
            if (carId && favorites.includes(carId)) {
                icon.classList.add('active');
                icon.innerHTML = '<i class="fa-solid fa-heart"></i>';
            }

            icon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const carId = this.dataset.carId;
                
                if (!carId) return;

                this.classList.toggle('active');

                if (this.classList.contains('active')) {
                    this.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    if (!favorites.includes(carId)) {
                        favorites.push(carId);
                    }
                } else {
                    this.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    const favIndex = favorites.indexOf(carId);
                    if (favIndex > -1) {
                        favorites.splice(favIndex, 1);
                    }
                }
                localStorage.setItem('favorites', JSON.stringify(favorites));
            });
        });
    }

    // ------------------------------
    // 3️⃣ Rent Now Button
    // ------------------------------
    function attachRentButtons() {
        const rentButtons = document.querySelectorAll('.rent-btn');
        rentButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const carId = this.dataset.carId;
                const carCard = this.closest('.car-card');
                const carName = carCard.querySelector('.car-name').textContent;
                
                console.log('Renting car:', carId, carName);

                const originalText = this.textContent;
                this.textContent = 'Processing...';
                this.disabled = true;
                this.style.background = '#90A3BF';
                this.style.cursor = 'not-allowed';

                // Here you would typically make an API call to rent the car
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    this.style.background = '#3563E9';
                    this.style.cursor = 'pointer';
                    alert(`Rental request submitted for ${carName} (ID: ${carId}). Redirecting to rental form...`);
                    // window.location.href = `rental.html?carId=${carId}`;
                }, 800);
            });
        });
    }

    // ------------------------------
    // 3️⃣ Buy Button
    // ------------------------------
    function attachBuyButtons() {
        const buyButtons = document.querySelectorAll('.buy-btn');
        buyButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const carId = this.dataset.carId;
                const carCard = this.closest('.car-card');
                const carName = carCard.querySelector('.car-name').textContent;
                const buyPrice = carCard.querySelector('.buy-price')?.textContent || 'N/A';
                
                console.log('Buying car:', carId, carName, buyPrice);

                if (confirm(`Are you sure you want to buy ${carName} for ${buyPrice}?`)) {
                    const originalText = this.textContent;
                    this.textContent = 'Processing...';
                    this.disabled = true;
                    this.style.background = '#90A3BF';
                    this.style.cursor = 'not-allowed';

                    // Here you would typically make an API call to buy the car
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.disabled = false;
                        this.style.background = '#3563E9';
                        this.style.cursor = 'pointer';
                        alert(`Purchase request submitted for ${carName} (ID: ${carId}). Redirecting to purchase form...`);
                        // window.location.href = `purchase.html?carId=${carId}`;
                    }, 800);
                }
            });
        });
    }

    // ------------------------------
    // 4️⃣ Hero Rental Buttons Scroll
    // ------------------------------
    const heroRentalButtons = document.querySelectorAll('.rental-btn');
    heroRentalButtons.forEach(button => {
        if (!button.classList.contains('rent-btn')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const catalogSection = document.querySelector('.popular-section');
                catalogSection.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });

    // ------------------------------
    // 5️⃣ Show More / Show Less
    // ------------------------------
    const showMoreBtn = document.querySelector('.show-more-btn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
            console.log('Toggling car list...');
        });
    }

    // ------------------------------
    // 6️⃣ Car Card Animation
    // ------------------------------
    function animateCarCards() {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.car-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    // ------------------------------
    // 7️⃣ Smooth Scroll for Anchors
    // ------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ------------------------------
    // Load Cars từ DB khi DOM sẵn sàng
    // ------------------------------
    loadCarsFromDB();

});
