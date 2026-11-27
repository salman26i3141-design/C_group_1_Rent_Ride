/* ==========================================================================
   RentRide Search Page Script (search.js)
   Handles Find Your Ride form, localStorage state, filter bar (category,
   city, max price slider), matching cars grid, and shared header overlays.
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

  function getTodayISO() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
  }

  function getFavCarIds() {
    const arr = readJSON(KEYS.FAV_CARS, []);
    return Array.isArray(arr) ? arr : [];
  }

  function getFavRides() {
    const arr = readJSON(KEYS.FAV_RIDES, []);
    return Array.isArray(arr) ? arr : [];
  }

  // DOM References
  const rentalSearchForm = document.getElementById("rentalSearchForm");
  const pickupCityInput = document.getElementById("pickupCity");
  const pickupDateInput = document.getElementById("pickupDate");
  const returnDateInput = document.getElementById("returnDate");
  const preferredCategoryInput = document.getElementById("preferredCategory");
  const resetSearchBtn = document.getElementById("resetSearchBtn");
  const savedStateBadge = document.getElementById("savedStateBadge");
  const dateError = document.getElementById("dateError");

  const searchResultsSection = document.getElementById("searchResultsSection");
  const filterCategory = document.getElementById("filterCategory");
  const filterCity = document.getElementById("filterCity");
  const maxPriceSlider = document.getElementById("maxPriceSlider");
  const maxPriceValue = document.getElementById("maxPriceValue");
  const resultsCountText = document.getElementById("resultsCountText");
  const matchingCarsGrid = document.getElementById("matchingCarsGrid");

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

  function toggleFavCar(carId) {
    const favs = getFavCarIds();
    const idx = favs.indexOf(carId);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(carId);
    }
    writeJSON(KEYS.FAV_CARS, favs);
    syncHeaderBadges();
    renderMatchingCars();
    renderFavDrawer();
  }

  function validateDates() {
    if (!dateError) return true;
    const today = getTodayISO();
    const start = pickupDateInput.value;
    const end = returnDateInput.value;

    if (start && start < today) {
      dateError.textContent = "Pickup date cannot be in the past.";
      dateError.hidden = false;
      return false;
    }

    if (start && end && end <= start) {
      dateError.textContent = "Return date must be after the pickup date.";
      dateError.hidden = false;
      return false;
    }

    dateError.hidden = true;
    dateError.textContent = "";
    return true;
  }

  function renderMatchingCars() {
    if (!matchingCarsGrid) return;
    const category = filterCategory.value || "all";
    const city = filterCity.value || "";
    const maxPrice = Number(maxPriceSlider.value) || 160;
    const favIds = getFavCarIds();

    if (maxPriceValue) {
      maxPriceValue.textContent = `$${maxPrice}/day`;
    }

    const filtered = CAR_CATALOG.filter((car) => {
      const matchesCategory = category === "all" || car.category === category;
      const matchesCity = !city || car.cities.includes(city);
      const matchesPrice = car.rate <= maxPrice;
      return matchesCategory && matchesCity && matchesPrice;
    });

    if (resultsCountText) {
      resultsCountText.textContent = `${filtered.length} car${filtered.length === 1 ? "" : "s"} found`;
    }

    if (filtered.length === 0) {
      matchingCarsGrid.innerHTML = `
        <div class="empty-results">
          No vehicles match the selected filters. Try raising the max daily price or choosing All Vehicles.
        </div>
      `;
      return;
    }

    matchingCarsGrid.innerHTML = filtered
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
              <button type="button" class="btn btn-primary btn-book-car" data-book-car="${car.id}">Book This Car</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function saveSearchState(hasSearched) {
    writeJSON(KEYS.SEARCH_STATE, {
      pickupCity: pickupCityInput.value,
      pickupDate: pickupDateInput.value,
      returnDate: returnDateInput.value,
      preferredCategory: preferredCategoryInput.value,
      hasSearched: Boolean(hasSearched)
    });
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
                <div>
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
                <div>
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

  // Form Submit -> Show ONLY filter bar + matching cars grid
  if (rentalSearchForm) {
    const today = getTodayISO();
    pickupDateInput.min = today;
    returnDateInput.min = today;

    rentalSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateDates()) return;

      filterCategory.value = preferredCategoryInput.value || "all";
      filterCity.value = pickupCityInput.value || "";
      saveSearchState(true);

      if (savedStateBadge) savedStateBadge.hidden = false;
      if (searchResultsSection) searchResultsSection.hidden = false;
      renderMatchingCars();
    });
  }

  if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", () => {
      rentalSearchForm.reset();
      filterCategory.value = "all";
      filterCity.value = "";
      maxPriceSlider.value = "160";
      if (dateError) dateError.hidden = true;
      if (savedStateBadge) savedStateBadge.hidden = true;
      if (searchResultsSection) searchResultsSection.hidden = true;
      writeJSON(KEYS.SEARCH_STATE, {
        pickupCity: "",
        pickupDate: "",
        returnDate: "",
        preferredCategory: "all",
        hasSearched: false
      });
    });
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", () => {
      preferredCategoryInput.value = filterCategory.value;
      saveSearchState(true);
      renderMatchingCars();
    });
  }

  if (filterCity) {
    filterCity.addEventListener("change", () => {
      pickupCityInput.value = filterCity.value;
      saveSearchState(true);
      renderMatchingCars();
    });
  }

  if (maxPriceSlider) {
    maxPriceSlider.addEventListener("input", renderMatchingCars);
  }

  if (matchingCarsGrid) {
    matchingCarsGrid.addEventListener("click", (event) => {
      const heartBtn = event.target.closest("[data-fav-id]");
      if (heartBtn) {
        toggleFavCar(heartBtn.dataset.favId);
        return;
      }

      const bookBtn = event.target.closest("[data-book-car]");
      if (bookBtn) {
        const car = CAR_CATALOG.find((item) => item.id === bookBtn.dataset.bookCar);
        if (car) {
          writeJSON(KEYS.SELECTED_CAR, car);
          window.location.href = "book.html";
        }
      }
    });
  }

  // Overlays & Nav
  if (favDrawerBtn) {
    favDrawerBtn.addEventListener("click", () => {
      closeAllOverlays();
      renderFavDrawer();
      favDrawer.hidden = false;
      modalBackdrop.hidden = false;
      favDrawerBtn.setAttribute("aria-expanded", "true");
    });
  }

  if (accountModalBtn) {
    accountModalBtn.addEventListener("click", () => {
      closeAllOverlays();
      renderAccountModal();
      accountModal.hidden = false;
      modalBackdrop.hidden = false;
      accountModalBtn.setAttribute("aria-expanded", "true");
    });
  }

  if (closeFavDrawer) closeFavDrawer.addEventListener("click", closeAllOverlays);
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
      renderMatchingCars();
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

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      primaryNav.classList.toggle("is-open", !expanded);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllOverlays();
  });

  // Restore saved search state on load
  function init() {
    const saved = readJSON(KEYS.SEARCH_STATE, null);
    if (saved) {
      if (saved.pickupCity) pickupCityInput.value = saved.pickupCity;
      if (saved.pickupDate) pickupDateInput.value = saved.pickupDate;
      if (saved.returnDate) returnDateInput.value = saved.returnDate;
      if (saved.preferredCategory) preferredCategoryInput.value = saved.preferredCategory;

      const hasAny = Boolean(saved.pickupCity || saved.pickupDate || saved.returnDate || (saved.preferredCategory && saved.preferredCategory !== "all"));
      if (savedStateBadge) savedStateBadge.hidden = !hasAny;

      if (saved.hasSearched) {
        filterCategory.value = saved.preferredCategory || "all";
        filterCity.value = saved.pickupCity || "";
        if (searchResultsSection) searchResultsSection.hidden = false;
        renderMatchingCars();
      }
    }
    syncHeaderBadges();
  }

  init();
})();
