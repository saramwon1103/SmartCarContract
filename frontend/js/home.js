// home.js
document.addEventListener('DOMContentLoaded', () => {

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

            cars.forEach((car, index) => {
                const card = document.createElement("div");
                card.className = "car-card";
                card.dataset.index = index;

                card.innerHTML = `
                    <div class="card-header">
                        <div>
                            <h4 class="car-name">${car.CarName}</h4>
                            <p class="car-category">${car.Brand}</p>
                        </div>
                        <button class="heart-icon">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>
                    <div class="car-image-container">
                        <img src="${car.ImageURL}" alt="${car.CarName}" class="car-img"
                            onerror="this.src='https://via.placeholder.com/232x72'">
                    </div>
                    <div class="car-specs">
                        <div class="spec-item">
                            <i class="fa-solid fa-gas-pump"></i>
                            <span>--L</span>
                        </div>
                        <div class="spec-item">
                            <i class="fa-solid fa-circle-m"></i>
                            <span>--</span>
                        </div>
                        <div class="spec-item">
                            <i class="fa-solid fa-users"></i>
                            <span>-- People</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="pricing">
                            <span class="current-price">$${car.PriceRent}/<span class="day">day</span></span>
                        </div>
                        <button class="rent-btn">Rent Now</button>
                    </div>
                `;

                // Gán cho popular hoặc recommendation theo logic ví dụ
                if(index < 4) popularGrid.appendChild(card);
                else recommendationGrid.appendChild(card);
            });

            attachFavorites();
            attachRentButtons();
            animateCarCards();

        } catch (err) {
            console.error("Error loading cars:", err);
        }
    }

    // ------------------------------
    // 2️⃣ Favorites Toggle
    // ------------------------------
    function attachFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const heartIcons = document.querySelectorAll('.heart-icon');

        heartIcons.forEach((icon, index) => {
            if (favorites.includes(index)) {
                icon.classList.add('active');
                icon.innerHTML = '<i class="fa-solid fa-heart"></i>';
            }

            icon.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('active');

                if (this.classList.contains('active')) {
                    this.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    if (!favorites.includes(index)) favorites.push(index);
                } else {
                    this.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    const favIndex = favorites.indexOf(index);
                    if (favIndex > -1) favorites.splice(favIndex, 1);
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
                const carCard = this.closest('.car-card');
                const carName = carCard.querySelector('.car-name').textContent;
                console.log('Renting:', carName);

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
