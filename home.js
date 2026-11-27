/* ==========================================================================
   RentRide Home Page Script (home.js)
   Manages shared localStorage state, header drawers, Car Categories showcase,
   pickup hub quick-select, and trip estimator.
   ========================================================================== */

(() => {
  "use strict";

  const KEYS = {
    SELECTED_CAR: "rentride_selected_car",
    SEARCH_STATE: "rentride_search_state",
    FAV_CARS: "rentride_fav_cars",
    FAV_RIDES: "rentride_fav_rides",
    USER_PROFILE: "rentride_user_profile"
  };

  const CAR_CATALOG = [
    {
      id: "apex-sovereign-ls",
      name: "Apex Sovereign LS",
      category: "Luxury",
      image: "car-luxury.jpg",
      rate: 125,
      cities: ["Islamabad", "Lahore", "Karachi"],
      seats: 5,
      transmission: "Automatic",
      mileage: "14 km/L"
    },
    {
      id: "monarch-gt-coupe",
      name: "Monarch GT Executive",
      category: "Luxury",
      image: "car-luxury.jpg",
      rate: 145,
      cities: ["Islamabad", "Karachi"],
      seats: 4,
      transmission: "Sport Auto",
      mileage: "12 km/L"
    },
    {
      id: "trailblaze-awd-suv",
      name: "TrailBlaze AWD SUV",
      category: "SUV",
      image: "car-suv.jpg",
      rate: 88,
      cities: ["Islamabad", "Lahore", "Karachi", "Peshawar"],
      seats: 7,
      transmission: "AWD Auto",
      mileage: "13 km/L"
    },
    {
      id: "highland-touring-suv",
      name: "Highland Touring SUV",
      category: "SUV",
      image: "car-suv.jpg",
      rate: 96,
      cities: ["Islamabad", "Rawalpindi", "Peshawar"],
      seats: 7,
      transmission: "AWD Hybrid",
      mileage: "16 km/L"
    },
    {
      id: "executive-touring-sedan",
      name: "Executive Touring Sedan",
      category: "Sedan",
      image: "hero-car.jpg",
      rate: 58,
      cities: ["Islamabad", "Lahore", "Karachi", "Rawalpindi"],
      seats: 5,
      transmission: "Automatic",
      mileage: "20 km/L"
    },
    {
      id: "civic-elegance-hybrid",
      name: "Civic Elegance Hybrid",
      category: "Sedan",
      image: "hero-car.jpg",
      rate: 52,
      cities: ["Islamabad", "Lahore", "Rawalpindi"],
      seats: 5,
      transmission: "CVT Hybrid",
      mileage: "22 km/L"
    }
  ];

  const CATEGORY_ORDER = ["Luxury", "SUV", "Sedan"];

  // Storage helpers
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures cleanly.
    }
  }

  function getFavCarIds() {
    const arr = readJSON(KEYS.FAV_CARS, []);
    return Array.isArray(arr) ? arr : [];
  }

  function getFavRides() {
    const arr = readJSON(KEYS.FAV_RIDES, []);
    return Array.isArray(arr) ? arr : [];
  }

  function toggleFavCar(carId) {
    const favs = getFavCarIds();
    const index = favs.indexOf(carId);
    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.push(carId);
    }
    writeJSON(KEYS.FAV_CARS, favs);
    syncHeaderBadges();
    renderCategories(activeCategory);
    renderFavDrawer();
  }

  function selectCarAndNavigate(carId, targetPage) {
    const car = CAR_CATALOG.find((item) => item.id === carId);
    if (!car) return;
    writeJSON(KEYS.SELECTED_CAR, car);

    const searchState = readJSON(KEYS.SEARCH_STATE, {});
    writeJSON(KEYS.SEARCH_STATE, {
      pickupCity: searchState.pickupCity || "",
      pickupDate: searchState.pickupDate || "",
      returnDate: searchState.returnDate || "",
      preferredCategory: car.category
    });

    window.location.href = targetPage;
  }

  // DOM References
  const categoriesContainer = document.getElementById("categoriesContainer");
  const filterPills = Array.from(document.querySelectorAll(".filter-pill"));
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  const favDrawerBtn = document.getElementById("favDrawerBtn");
  const favDrawer = document.getElementById("favDrawer");
  const closeFavDrawer = document.getElementById("closeFavDrawer");
  const favCountBadge = document.getElementById("favCountBadge");
  const favCarsList = document.getElementById("favCarsList");
  const favRidesList = document.getElementById("favRidesList");
  const clearFavCarsBtn = document.getElementById("clearFavCarsBtn");
  const clearFavRidesBtn = document.getElementById("clearFavRidesBtn");

  const accountModalBtn = document.getElementById("accountModalBtn");
  const accountModal = document.getElementById("accountModal");
  const closeAccountModal = document.getElementById("closeAccountModal");
  const accountModalBody = document.getElementById("accountModalBody");
  const accountStatusDot = document.getElementById("accountStatusDot");
  const modalBackdrop = document.getElementById("modalBackdrop");

  const hubButtons = Array.from(document.querySelectorAll(".hub-chip"));
  const hubSelectedStatus = document.getElementById("hubSelectedStatus");
  const prefillCityLinks = Array.from(document.querySelectorAll("[data-prefill-city]"));
  const estDaysInput = document.getElementById("estDays");
  const estDistanceInput = document.getElementById("estDistance");
  const estimatorResult = document.getElementById("estimatorResult");

  let activeCategory = "all";

  function syncHeaderBadges() {
    const favCars = getFavCarIds();
    const favRides = getFavRides();
    if (favCountBadge) {
      favCountBadge.textContent = String(favCars.length + favRides.length);
    }

    const profile = readJSON(KEYS.USER_PROFILE, null);
    if (accountStatusDot) {
      accountStatusDot.hidden = !(profile && profile.name && profile.email);
    }
  }

  function renderCategories(categoryFilter) {
    if (!categoriesContainer) return;
    const favIds = getFavCarIds();
    const groups = categoryFilter === "all" ? CATEGORY_ORDER : [categoryFilter];

    categoriesContainer.innerHTML = groups
      .map((category) => {
        const cars = CAR_CATALOG.filter((c) => c.category === category);
        const cardsHtml = cars
          .map((car) => {
            const isLiked = favIds.includes(car.id);
            return `
              <article class="vehicle-card">
                <div class="vehicle-visual">
                  <span class="vehicle-badge">${car.category}</span>
                  <button
                    type="button"
                    class="heart-btn ${isLiked ? "is-liked" : ""}"
                    data-fav-id="${car.id}"
                    aria-label="${isLiked ? "Remove" : "Save"} ${car.name} ${isLiked ? "from" : "to"} Favourite Cars"
                    aria-pressed="${isLiked}"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <img src="${car.image}" alt="${car.name} ${car.category}" class="vehicle-img">
                </div>
                <div class="vehicle-body">
                  <div class="vehicle-title-row">
                    <h3 class="vehicle-name">${car.name}</h3>
                    <span class="vehicle-price"><strong>$${car.rate}</strong>/day</span>
                  </div>
                  <p class="vehicle-meta">${car.seats} Seats &bull; ${car.transmission} &bull; ${car.mileage}</p>
                  <p class="vehicle-hubs">Available in ${car.cities.join(", ")}</p>
                  <div class="vehicle-actions">
                    <button type="button" class="btn btn-primary" data-select-car="${car.id}">Select Car</button>
                    <button type="button" class="btn btn-outline" data-book-car="${car.id}">Book Now</button>
                  </div>
                </div>
              </article>
            `;
          })
          .join("");

        return `
          <section class="category-group" aria-label="${category} category">
            <div class="category-group-header">
              <h3 class="category-group-title">${category}</h3>
              <span class="category-count">${cars.length} Vehicles</span>
            </div>
            <div class="vehicle-grid">${cardsHtml}</div>
          </section>
        `;
      })
      .join("");
  }

  function renderFavDrawer() {
    if (!favCarsList || !favRidesList) return;
    const favCarIds = getFavCarIds();
    const favCars = CAR_CATALOG.filter((car) => favCarIds.includes(car.id));
    const favRides = getFavRides();

    favCarsList.innerHTML =
      favCars.length > 0
        ? favCars
            .map(
              (car) => `
              <div class="fav-item">
                <div class="fav-item-info">
                  <p class="fav-item-title">${car.name}</p>
                  <p class="fav-item-sub">${car.category} &bull; $${car.rate}/day</p>
                </div>
                <button type="button" class="fav-remove-btn" data-remove-fav-car="${car.id}">Remove</button>
              </div>
            `
            )
            .join("")
        : '<p class="fav-empty">No favourite cars saved yet. Tap the heart icon on any vehicle.</p>';

    favRidesList.innerHTML =
      favRides.length > 0
        ? favRides
            .map(
              (ride) => `
              <div class="fav-item">
                <div class="fav-item-info">
                  <p class="fav-item-title">${ride.carName || "Selected Ride"}</p>
                  <p class="fav-item-sub">${ride.startTime} &rarr; ${ride.endTime}</p>
                </div>
                <button type="button" class="fav-remove-btn" data-remove-fav-ride="${ride.id}">Remove</button>
              </div>
            `
            )
            .join("")
        : '<p class="fav-empty">No saved rides yet. Complete a booking schedule on the Book page.</p>';
  }

  function renderAccountModal() {
    if (!accountModalBody) return;
    const profile = readJSON(KEYS.USER_PROFILE, null);
    if (profile && profile.name && profile.email) {
      accountModalBody.innerHTML = `
        <div class="profile-box">
          <p><strong>Status:</strong> Registered Member</p>
          <p><strong>Name:</strong> ${profile.name}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
        </div>
        <a href="book.html" class="btn btn-primary">Update Details on Book Page</a>
      `;
    } else {
      accountModalBody.innerHTML = `
        <div class="profile-box">
          <p><strong>Status:</strong> Not registered yet</p>
          <p>Register your name and email on the Booking page to save your rider profile.</p>
        </div>
        <a href="book.html" class="btn btn-primary">Go to Register &amp; Book</a>
      `;
    }
  }

  function closeAllOverlays() {
    if (favDrawer) favDrawer.hidden = true;
    if (accountModal) accountModal.hidden = true;
    if (modalBackdrop) modalBackdrop.hidden = true;
    if (favDrawerBtn) favDrawerBtn.setAttribute("aria-expanded", "false");
    if (accountModalBtn) accountModalBtn.setAttribute("aria-expanded", "false");
  }

  function openFavDrawer() {
    closeAllOverlays();
    renderFavDrawer();
    if (favDrawer) favDrawer.hidden = false;
    if (modalBackdrop) modalBackdrop.hidden = false;
    if (favDrawerBtn) favDrawerBtn.setAttribute("aria-expanded", "true");
  }

  function openAccountModal() {
    closeAllOverlays();
    renderAccountModal();
    if (accountModal) accountModal.hidden = false;
    if (modalBackdrop) modalBackdrop.hidden = false;
    if (accountModalBtn) accountModalBtn.setAttribute("aria-expanded", "true");
  }

  function updateEstimator() {
    if (!estDaysInput || !estDistanceInput || !estimatorResult) return;
    const days = Math.max(1, Math.min(60, Number(estDaysInput.value) || 1));
    const distance = Math.max(10, Math.min(5000, Number(estDistanceInput.value) || 10));
    const selectedCar = readJSON(KEYS.SELECTED_CAR, null);
    const rate = selectedCar && selectedCar.rate ? Number(selectedCar.rate) : 58;
    const total = days * rate + Math.round(distance * 0.085);
    estimatorResult.innerHTML = `Estimated Total: <strong>$${total}</strong> ($${rate}/day &times; ${days}d + est. fuel)`;
  }

  function syncHubChips() {
    const searchState = readJSON(KEYS.SEARCH_STATE, {});
    const city = searchState.pickupCity || "";
    hubButtons.forEach((btn) => {
      const match = btn.dataset.hub === city;
      btn.classList.toggle("is-active", match);
      btn.setAttribute("aria-pressed", String(match));
    });
    if (hubSelectedStatus) {
      hubSelectedStatus.textContent = city ? `Selected pickup hub: ${city}` : "";
    }
  }

  // Event Listeners
  if (categoriesContainer) {
    categoriesContainer.addEventListener("click", (event) => {
      const heartBtn = event.target.closest("[data-fav-id]");
      if (heartBtn) {
        toggleFavCar(heartBtn.dataset.favId);
        return;
      }
      const selectBtn = event.target.closest("[data-select-car]");
      if (selectBtn) {
        selectCarAndNavigate(selectBtn.dataset.selectCar, "search.html");
        return;
      }
      const bookBtn = event.target.closest("[data-book-car]");
      if (bookBtn) {
        selectCarAndNavigate(bookBtn.dataset.bookCar, "book.html");
      }
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      activeCategory = pill.dataset.category || "all";
      filterPills.forEach((p) => {
        const isCurrent = p === pill;
        p.classList.toggle("is-active", isCurrent);
        p.setAttribute("aria-pressed", String(isCurrent));
      });
      renderCategories(activeCategory);
    });
  });

  if (favDrawerBtn) favDrawerBtn.addEventListener("click", openFavDrawer);
  if (closeFavDrawer) closeFavDrawer.addEventListener("click", closeAllOverlays);
  if (accountModalBtn) accountModalBtn.addEventListener("click", openAccountModal);
  if (closeAccountModal) closeAccountModal.addEventListener("click", closeAllOverlays);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeAllOverlays);

  if (favDrawer) {
    favDrawer.addEventListener("click", (event) => {
      const removeCarBtn = event.target.closest("[data-remove-fav-car]");
      if (removeCarBtn) {
        toggleFavCar(removeCarBtn.dataset.removeFavCar);
        return;
      }
      const removeRideBtn = event.target.closest("[data-remove-fav-ride]");
      if (removeRideBtn) {
        const rides = getFavRides().filter((r) => r.id !== removeRideBtn.dataset.removeFavRide);
        writeJSON(KEYS.FAV_RIDES, rides);
        syncHeaderBadges();
        renderFavDrawer();
      }
    });
  }

  if (clearFavCarsBtn) {
    clearFavCarsBtn.addEventListener("click", () => {
      writeJSON(KEYS.FAV_CARS, []);
      syncHeaderBadges();
      renderCategories(activeCategory);
      renderFavDrawer();
    });
  }

  if (clearFavRidesBtn) {
    clearFavRidesBtn.addEventListener("click", () => {
      writeJSON(KEYS.FAV_RIDES, []);
      syncHeaderBadges();
      renderFavDrawer();
    });
  }

  hubButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const city = btn.dataset.hub || "";
      const current = readJSON(KEYS.SEARCH_STATE, {});
      writeJSON(KEYS.SEARCH_STATE, {
        pickupCity: city,
        pickupDate: current.pickupDate || "",
        returnDate: current.returnDate || "",
        preferredCategory: current.preferredCategory || "all"
      });
      syncHubChips();
    });
  });

  prefillCityLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const city = link.dataset.prefillCity || "";
      const current = readJSON(KEYS.SEARCH_STATE, {});
      writeJSON(KEYS.SEARCH_STATE, {
        pickupCity: city,
        pickupDate: current.pickupDate || "",
        returnDate: current.returnDate || "",
        preferredCategory: current.preferredCategory || "all"
      });
    });
  });

  if (estDaysInput && estDistanceInput) {
    estDaysInput.addEventListener("input", updateEstimator);
    estDistanceInput.addEventListener("input", updateEstimator);
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      primaryNav.classList.toggle("is-open", !expanded);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllOverlays();
    }
  });

  // Initialize
  renderCategories("all");
  syncHeaderBadges();
  syncHubChips();
  updateEstimator();
})();
