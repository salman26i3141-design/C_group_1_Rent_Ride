/* ==========================================================================
   RentRide Search & Filters Script (pages/search.js)
   Handles sticky date-range utility, segmented sidebar control, Car Categories
   grid tiles, search feed bar, distinct vehicle rendering, and shared overlays.
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

  // Every vehicle uses a distinct image (relative to root for shared localStorage,
  // resolved with "../" when rendered inside pages/search.html).
  const CAR_CATALOG = [
    {
      id: "urban-glide-hatchback",
      name: "Urban Glide Hatchback",
      category: "Hatchback",
      image: "pages/images/car-hatchback-teal.jpg",
      rate: 44,
      cities: ["Islamabad", "Lahore", "Rawalpindi"],
      seats: 5,
      transmission: "Automatic",
      mileage: "23 km/L"
    },
    {
      id: "swift-aero-hatch",
      name: "Swift Aero Sport Hatch",
      category: "Hatchback",
      image: "pages/images/car-hatchback-white.jpg",
      rate: 48,
      cities: ["Islamabad", "Karachi", "Lahore"],
      seats: 5,
      transmission: "CVT Hybrid",
      mileage: "24 km/L"
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
      image: "pages/images/car-sedan-silver.jpg",
      rate: 62,
      cities: ["Islamabad", "Lahore", "Rawalpindi"],
      seats: 5,
      transmission: "CVT Hybrid",
      mileage: "22 km/L"
    },
    {
      id: "trailblaze-awd-suv",
      name: "TrailBlaze AWD SUV",
      category: "SUV",
      image: "car-suv.jpg",
      rate: 88,
      cities: ["Islamabad", "Lahore", "Karachi", "Peshawar"],
      seats: 7,
      transmission: "AWD Automatic",
      mileage: "13 km/L"
    },
    {
      id: "highland-touring-suv",
      name: "Highland Touring SUV",
      category: "SUV",
      image: "pages/images/car-suv-black.jpg",
      rate: 96,
      cities: ["Islamabad", "Rawalpindi", "Peshawar"],
      seats: 7,
      transmission: "AWD Hybrid",
      mileage: "16 km/L"
    },
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
      image: "pages/images/car-luxury-gt.jpg",
      rate: 145,
      cities: ["Islamabad", "Karachi"],
      seats: 4,
      transmission: "Sport Automatic",
      mileage: "12 km/L"
    }
  ];

  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function resolvePageImagePath(rootRelativePath) {
    if (!rootRelativePath) return "../hero-car.jpg";
    if (rootRelativePath.startsWith("pages/")) {
      return rootRelativePath.slice("pages/".length);
    }
    return `../${rootRelativePath}`;
  }

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
      // Ignore storage errors cleanly.
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

  function formatWidgetDate(isoString, prefix) {
    if (!isoString) return "";
    const parts = isoString.split("-");
    if (parts.length !== 3) return isoString;
    const monthIdx = Number(parts[1]) - 1;
    const day = parts[2];
    const monthName = MONTHS_SHORT[monthIdx] || parts[1];
    return `${prefix} - ${day} - ${monthName}`;
  }

  // Filter State
  const state = {
    segment: "all",
    category: "all",
    query: "",
    city: "",
    maxPrice: 160,
    transmission: "all",
    sort: "featured"
  };

  // DOM References
  const dateUtilityForm = document.getElementById("dateUtilityForm");
  const pickupDateInput = document.getElementById("pickupDate");
  const returnDateInput = document.getElementById("returnDate");
  const pickupDateDisplay = document.getElementById("pickupDateDisplay");
  const returnDateDisplay = document.getElementById("returnDateDisplay");
  const dateValidationMsg = document.getElementById("dateValidationMsg");
  const dateWidgets = Array.from(document.querySelectorAll(".date-widget"));

  const segmentButtons = Array.from(document.querySelectorAll(".segment-btn"));
  const categoriesPanelBlock = document.getElementById("categoriesPanelBlock");
  const filtersPanelBlock = document.getElementById("filtersPanelBlock");
  const categoryTiles = Array.from(document.querySelectorAll("[data-cat-tile]"));
  const clearCategoryBtn = document.getElementById("clearCategoryBtn");
  const resetAllFiltersBtn = document.getElementById("resetAllFiltersBtn");

  const filterCity = document.getElementById("filterCity");
  const maxPriceSlider = document.getElementById("maxPriceSlider");
  const maxPriceValue = document.getElementById("maxPriceValue");
  const transChips = Array.from(document.querySelectorAll("[data-trans-filter]"));

  const feedSearchForm = document.getElementById("feedSearchForm");
  const feedSearchInput = document.getElementById("feedSearchInput");
  const sortOrderSelect = document.getElementById("sortOrderSelect");
  const resultsCountText = document.getElementById("resultsCountText");
  const activeTagsStrip = document.getElementById("activeTagsStrip");
  const vehicleFeedGrid = document.getElementById("vehicleFeedGrid");

  // Header & Overlay DOM References
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const moreNavBtn = document.getElementById("moreNavBtn");
  const moreNavMenu = document.getElementById("moreNavMenu");
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

  function validateDateRange() {
    if (!pickupDateInput || !returnDateInput || !dateValidationMsg) return true;
    const start = pickupDateInput.value;
    const end = returnDateInput.value;
    if (start && end && end <= start) {
      dateValidationMsg.textContent = "Return date must be after the pickup date.";
      dateValidationMsg.hidden = false;
      return false;
    }
    dateValidationMsg.hidden = true;
    dateValidationMsg.textContent = "";
    return true;
  }

  function persistSearchState() {
    writeJSON(KEYS.SEARCH_STATE, {
      pickupCity: state.city,
      pickupDate: pickupDateInput ? pickupDateInput.value : "",
      returnDate: returnDateInput ? returnDateInput.value : "",
      preferredCategory: state.category,
      searchQuery: state.query,
      hasSearched: true
    });
  }

  function updateCategoryTilesUI() {
    categoryTiles.forEach((tile) => {
      const isSelected = tile.dataset.catTile === state.category;
      tile.classList.toggle("is-selected", isSelected);
      tile.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function updateTransmissionChipsUI() {
    transChips.forEach((chip) => {
      const isSelected = chip.dataset.transFilter === state.transmission;
      chip.classList.toggle("is-active", isSelected);
      chip.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function applySegmentedView(segment) {
    state.segment = segment;
    segmentButtons.forEach((btn) => {
      const active = btn.dataset.segment === segment;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });

    if (segment === "all") {
      if (categoriesPanelBlock) categoriesPanelBlock.hidden = false;
      if (filtersPanelBlock) filtersPanelBlock.hidden = false;
    } else if (segment === "categories") {
      if (categoriesPanelBlock) categoriesPanelBlock.hidden = false;
      if (filtersPanelBlock) filtersPanelBlock.hidden = true;
    } else if (segment === "filters") {
      if (categoriesPanelBlock) categoriesPanelBlock.hidden = true;
      if (filtersPanelBlock) filtersPanelBlock.hidden = false;
    } else if (segment === "search") {
      if (categoriesPanelBlock) categoriesPanelBlock.hidden = false;
      if (filtersPanelBlock) filtersPanelBlock.hidden = false;
      if (feedSearchInput) {
        feedSearchInput.focus();
        feedSearchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function renderActiveTags() {
    if (!activeTagsStrip) return;
    const tags = [];
    if (state.category !== "all") tags.push(`Category: ${state.category}`);
    if (state.city) tags.push(`City: ${state.city}`);
    if (state.maxPrice < 160) tags.push(`Max $${state.maxPrice}/day`);
    if (state.transmission !== "all") tags.push(`Transmission: ${state.transmission}`);
    if (state.query.trim()) tags.push(`Query: "${state.query.trim()}"`);

    if (tags.length === 0) {
      activeTagsStrip.hidden = true;
      activeTagsStrip.innerHTML = "";
      return;
    }

    activeTagsStrip.hidden = false;
    activeTagsStrip.innerHTML = tags.map((t) => `<span class="active-tag">${t}</span>`).join("");
  }

  function getFilteredVehicles() {
    const q = state.query.trim().toLowerCase();
    const list = CAR_CATALOG.filter((car) => {
      const matchesCat = state.category === "all" || car.category === state.category;
      const matchesCity = !state.city || car.cities.includes(state.city);
      const matchesPrice = car.rate <= state.maxPrice;
      const matchesTrans =
        state.transmission === "all" ||
        car.transmission.toLowerCase().includes(state.transmission.toLowerCase());
      const matchesQuery =
        !q ||
        car.name.toLowerCase().includes(q) ||
        car.category.toLowerCase().includes(q) ||
        car.transmission.toLowerCase().includes(q) ||
        car.cities.some((c) => c.toLowerCase().includes(q));

      return matchesCat && matchesCity && matchesPrice && matchesTrans && matchesQuery;
    });

    if (state.sort === "price-asc") {
      list.sort((a, b) => a.rate - b.rate);
    } else if (state.sort === "price-desc") {
      list.sort((a, b) => b.rate - a.rate);
    }

    return list;
  }

  function renderVehicleFeed() {
    if (!vehicleFeedGrid) return;
    const filtered = getFilteredVehicles();
    const favIds = getFavCarIds();

    if (maxPriceValue) {
      maxPriceValue.textContent = `$${state.maxPrice}/day`;
    }
    if (resultsCountText) {
      resultsCountText.textContent = `${filtered.length} vehicle${filtered.length === 1 ? "" : "s"} available`;
    }

    renderActiveTags();

    if (filtered.length === 0) {
      vehicleFeedGrid.innerHTML = `
        <div class="empty-feed-state">
          <h3>No matching vehicles found</h3>
          <p>Try clearing a category, raising the max daily rate, or searching a broader keyword.</p>
          <button type="button" class="btn btn-teal" id="emptyResetBtn">Reset All Filters</button>
        </div>
      `;
      const emptyResetBtn = document.getElementById("emptyResetBtn");
      if (emptyResetBtn) {
        emptyResetBtn.addEventListener("click", resetAllFilters);
      }
      return;
    }

    vehicleFeedGrid.innerHTML = filtered
      .map((car) => {
        const isLiked = favIds.includes(car.id);
        const imgSrc = resolvePageImagePath(car.image);
        return `
          <article class="vehicle-card">
            <div class="vehicle-visual">
              <div class="vehicle-badges-left">
                <span class="available-badge"><span class="available-dot" aria-hidden="true"></span>Available</span>
                <span class="category-badge">${car.category}</span>
              </div>
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
              <img src="${imgSrc}" alt="${car.name} (${car.category})" class="vehicle-img" loading="lazy">
            </div>
            <div class="vehicle-body">
              <div class="vehicle-title-row">
                <h3 class="vehicle-name">${car.name}</h3>
                <span class="vehicle-price"><strong>$${car.rate}</strong>/day</span>
              </div>
              <p class="vehicle-specs">${car.seats} Seats &bull; ${car.transmission} &bull; ${car.mileage}</p>
              <p class="vehicle-hubs">Pickup hubs: ${car.cities.join(", ")}</p>
              <button type="button" class="btn btn-teal btn-book-now" data-book-car="${car.id}">Book Now</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function resetAllFilters() {
    state.category = "all";
    state.query = "";
    state.city = "";
    state.maxPrice = 160;
    state.transmission = "all";
    state.sort = "featured";

    if (feedSearchInput) feedSearchInput.value = "";
    if (filterCity) filterCity.value = "";
    if (maxPriceSlider) maxPriceSlider.value = "160";
    if (sortOrderSelect) sortOrderSelect.value = "featured";

    updateCategoryTilesUI();
    updateTransmissionChipsUI();
    renderVehicleFeed();
    persistSearchState();
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
    renderVehicleFeed();
    renderFavDrawer();
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
        <a href="../book.html" class="btn btn-teal">Update Details on Book Page</a>
      `;
    } else {
      accountModalBody.innerHTML = `
        <div class="profile-box">
          <p><strong>Status:</strong> Not registered yet</p>
          <p>Register your name and email on the Booking page to save your rider profile.</p>
        </div>
        <a href="../book.html" class="btn btn-teal">Go to Register &amp; Book</a>
      `;
    }
  }

  function closeMoreMenu() {
    if (moreNavMenu) moreNavMenu.hidden = true;
    if (moreNavBtn) moreNavBtn.setAttribute("aria-expanded", "false");
  }

  function closeAllOverlays() {
    if (favDrawer) favDrawer.hidden = true;
    if (accountModal) accountModal.hidden = true;
    if (modalBackdrop) modalBackdrop.hidden = true;
    if (favDrawerBtn) favDrawerBtn.setAttribute("aria-expanded", "false");
    if (accountModalBtn) accountModalBtn.setAttribute("aria-expanded", "false");
    closeMoreMenu();
  }

  // Event Bindings: Sticky Date Widgets & Search Utility
  dateWidgets.forEach((widget) => {
    const nativeInput = widget.querySelector(".date-native-input");
    if (!nativeInput) return;
    widget.addEventListener("click", () => {
      if (typeof nativeInput.showPicker === "function") {
        try {
          nativeInput.showPicker();
        } catch {
          nativeInput.focus();
        }
      } else {
        nativeInput.focus();
      }
    });
  });

  if (pickupDateInput && pickupDateDisplay) {
    pickupDateInput.addEventListener("change", () => {
      if (pickupDateInput.value) {
        pickupDateDisplay.textContent = formatWidgetDate(pickupDateInput.value, "02");
      }
      validateDateRange();
      persistSearchState();
    });
  }

  if (returnDateInput && returnDateDisplay) {
    returnDateInput.addEventListener("change", () => {
      if (returnDateInput.value) {
        returnDateDisplay.textContent = formatWidgetDate(returnDateInput.value, "Dx");
      }
      validateDateRange();
      persistSearchState();
    });
  }

  if (dateUtilityForm) {
    dateUtilityForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateDateRange()) return;
      persistSearchState();
      renderVehicleFeed();
      if (vehicleFeedGrid) {
        vehicleFeedGrid.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  // Event Bindings: Sidebar Segmented Control, Categories Grid & Filters
  segmentButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applySegmentedView(btn.dataset.segment || "all");
    });
  });

  categoryTiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      const cat = tile.dataset.catTile || "all";
      state.category = state.category === cat ? "all" : cat;
      updateCategoryTilesUI();
      renderVehicleFeed();
      persistSearchState();
    });
  });

  if (clearCategoryBtn) {
    clearCategoryBtn.addEventListener("click", () => {
      state.category = "all";
      updateCategoryTilesUI();
      renderVehicleFeed();
      persistSearchState();
    });
  }

  if (resetAllFiltersBtn) {
    resetAllFiltersBtn.addEventListener("click", resetAllFilters);
  }

  if (filterCity) {
    filterCity.addEventListener("change", () => {
      state.city = filterCity.value;
      renderVehicleFeed();
      persistSearchState();
    });
  }

  if (maxPriceSlider) {
    maxPriceSlider.addEventListener("input", () => {
      state.maxPrice = Number(maxPriceSlider.value) || 160;
      renderVehicleFeed();
    });
  }

  transChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.transmission = chip.dataset.transFilter || "all";
      updateTransmissionChipsUI();
      renderVehicleFeed();
    });
  });

  // Event Bindings: Search Feed Bar & Sort
  if (feedSearchForm) {
    feedSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.query = feedSearchInput ? feedSearchInput.value : "";
      renderVehicleFeed();
      persistSearchState();
    });
  }

  if (feedSearchInput) {
    feedSearchInput.addEventListener("input", () => {
      state.query = feedSearchInput.value;
      renderVehicleFeed();
    });
  }

  if (sortOrderSelect) {
    sortOrderSelect.addEventListener("change", () => {
      state.sort = sortOrderSelect.value;
      renderVehicleFeed();
    });
  }

  // Event Bindings: Vehicle Cards (Favourite & Book Now)
  if (vehicleFeedGrid) {
    vehicleFeedGrid.addEventListener("click", (event) => {
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
          persistSearchState();
          window.location.href = "../book.html";
        }
      }
    });
  }

  // Overlays & Global Header Navigation
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
      renderVehicleFeed();
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
      if (expanded) closeMoreMenu();
    });
  }

  if (moreNavBtn && moreNavMenu) {
    moreNavBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const expanded = moreNavBtn.getAttribute("aria-expanded") === "true";
      moreNavBtn.setAttribute("aria-expanded", String(!expanded));
      moreNavMenu.hidden = expanded;
    });

    moreNavMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMoreMenu();
        if (primaryNav && navToggle) {
          primaryNav.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (moreNavMenu && !moreNavMenu.hidden && !event.target.closest(".nav-more-item")) {
      closeMoreMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllOverlays();
  });

  // Initialize from saved state if available (preserving "02 - 23 - Nov" and "Dx - 28 - Nov" defaults when unset)
  function init() {
    const saved = readJSON(KEYS.SEARCH_STATE, null);
    if (saved) {
      if (saved.pickupCity && filterCity) {
        state.city = saved.pickupCity;
        filterCity.value = saved.pickupCity;
      }
      if (saved.preferredCategory && ["Hatchback", "Sedan", "SUV", "Luxury"].includes(saved.preferredCategory)) {
        state.category = saved.preferredCategory;
      }
      if (saved.pickupDate && pickupDateInput && pickupDateDisplay) {
        pickupDateInput.value = saved.pickupDate;
        pickupDateDisplay.textContent = formatWidgetDate(saved.pickupDate, "02");
      }
      if (saved.returnDate && returnDateInput && returnDateDisplay) {
        returnDateInput.value = saved.returnDate;
        returnDateDisplay.textContent = formatWidgetDate(saved.returnDate, "Dx");
      }
    }

    updateCategoryTilesUI();
    updateTransmissionChipsUI();
    renderVehicleFeed();
    syncHeaderBadges();
  }

  init();
})();
