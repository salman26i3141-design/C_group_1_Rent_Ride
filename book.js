/* ==========================================================================
   RentRide Book Page Script (book.js)
   Renders selected car banner, handles user registration (Name + Email),
   booking start/end schedule saving to rentride_fav_rides, and header overlays.
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
      image: "pages/images/car-luxury-gt.jpg",
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
      image: "pages/images/car-suv-black.jpg",
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
      image: "pages/images/car-sedan-silver.jpg",
      rate: 62,
      cities: ["Islamabad", "Lahore", "Rawalpindi"],
      seats: 5,
      transmission: "CVT Hybrid",
      mileage: "22 km/L"
    },
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

  function getFavCarIds() {
    const arr = readJSON(KEYS.FAV_CARS, []);
    return Array.isArray(arr) ? arr : [];
  }

  function getFavRides() {
    const arr = readJSON(KEYS.FAV_RIDES, []);
    return Array.isArray(arr) ? arr : [];
  }

  function formatDateTimeLabel(value) {
    if (!value) return "";
    return value.replace("T", " ");
  }

  // DOM References
  const selectedCarBanner = document.getElementById("selectedCarBanner");
  const registerForm = document.getElementById("registerForm");
  const regNameInput = document.getElementById("regName");
  const regEmailInput = document.getElementById("regEmail");
  const registerFeedback = document.getElementById("registerFeedback");

  const bookingTimeForm = document.getElementById("bookingTimeForm");
  const bookingStartInput = document.getElementById("bookingStartTime");
  const bookingEndInput = document.getElementById("bookingEndTime");
  const saveBookingBtn = document.getElementById("saveBookingBtn");
  const bookingFeedback = document.getElementById("bookingFeedback");

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

  function renderSelectedCarBanner() {
    if (!selectedCarBanner) return;
    const selectedCar = readJSON(KEYS.SELECTED_CAR, null);
    const searchState = readJSON(KEYS.SEARCH_STATE, {});
    const cityText = searchState.pickupCity ? ` &bull; Pickup: ${searchState.pickupCity}` : "";

    if (selectedCar && selectedCar.name) {
      selectedCarBanner.innerHTML = `
        <div class="selected-car-info">
          <img src="${selectedCar.image || "hero-car.jpg"}" alt="${selectedCar.name}" class="selected-car-thumb">
          <div>
            <h2 class="selected-car-title">${selectedCar.name}</h2>
            <p class="selected-car-meta">${selectedCar.category} &bull; <strong>$${selectedCar.rate}/day</strong>${cityText}</p>
          </div>
        </div>
        <a href="search.html" class="btn btn-secondary">Change Car</a>
      `;
    } else {
      selectedCarBanner.innerHTML = `
        <div>
          <h2 class="selected-car-title">No car selected yet</h2>
          <p class="selected-car-meta">Choose a vehicle on Search or Home to attach it to your saved ride schedule.</p>
        </div>
        <a href="search.html" class="btn btn-secondary">Choose a Car</a>
      `;
    }
  }

  function showFeedback(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.toggle("is-error", isError);
    el.classList.toggle("is-success", !isError);
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
        : '<p class="fav-empty">No saved rides yet. Complete your booking schedule on the right.</p>';
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
      `;
    } else {
      accountModalBody.innerHTML = `
        <div class="profile-box">
          <p><strong>Status:</strong> Not registered yet</p>
          <p>Fill in your Name and Email in the Register card to create your profile.</p>
        </div>
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

  // Left Card: Register Form
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = regNameInput.value.trim();
      const email = regEmailInput.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name) {
        showFeedback(registerFeedback, "Please enter your name.", true);
        regNameInput.focus();
        return;
      }

      if (!email || !emailPattern.test(email)) {
        showFeedback(registerFeedback, "Please enter a valid email address.", true);
        regEmailInput.focus();
        return;
      }

      writeJSON(KEYS.USER_PROFILE, {
        name,
        email,
        registeredAt: new Date().toISOString()
      });

      syncHeaderBadges();
      showFeedback(registerFeedback, `Registered! Welcome, ${name} (${email}).`, false);
    });
  }

  // Right Card: Booking Schedule Form ("Saved" button)
  if (bookingTimeForm) {
    bookingTimeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const startVal = bookingStartInput.value;
      const endVal = bookingEndInput.value;

      if (!startVal) {
        showFeedback(bookingFeedback, "Please select a Booking Start Time.", true);
        bookingStartInput.focus();
        return;
      }

      if (!endVal) {
        showFeedback(bookingFeedback, "Please select a Booking End Time.", true);
        bookingEndInput.focus();
        return;
      }

      if (new Date(endVal) <= new Date(startVal)) {
        showFeedback(bookingFeedback, "Booking End Time must be after Booking Start Time.", true);
        bookingEndInput.focus();
        return;
      }

      const selectedCar = readJSON(KEYS.SELECTED_CAR, null);
      const searchState = readJSON(KEYS.SEARCH_STATE, {});
      const favRides = getFavRides();

      const newRide = {
        id: `ride-${Date.now()}`,
        carId: selectedCar ? selectedCar.id : "",
        carName: selectedCar ? selectedCar.name : "RentRide Vehicle",
        carCategory: selectedCar ? selectedCar.category : "Standard",
        carRate: selectedCar ? selectedCar.rate : 58,
        pickupCity: searchState.pickupCity || "",
        startTime: formatDateTimeLabel(startVal),
        endTime: formatDateTimeLabel(endVal),
        rawStart: startVal,
        rawEnd: endVal
      };

      favRides.unshift(newRide);
      writeJSON(KEYS.FAV_RIDES, favRides);
      syncHeaderBadges();

      if (saveBookingBtn) {
        saveBookingBtn.textContent = "Saved ✓";
        saveBookingBtn.classList.add("btn-saved-active");
      }

      showFeedback(
        bookingFeedback,
        `Saved! ${newRide.carName} scheduled from ${newRide.startTime} to ${newRide.endTime}.`,
        false
      );
    });

    [bookingStartInput, bookingEndInput].forEach((input) => {
      input.addEventListener("input", () => {
        if (saveBookingBtn) {
          saveBookingBtn.textContent = "Saved";
          saveBookingBtn.classList.remove("btn-saved-active");
        }
      });
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
        const nextCars = getFavCarIds().filter((id) => id !== removeCarBtn.dataset.removeFavCar);
        writeJSON(KEYS.FAV_CARS, nextCars);
        syncHeaderBadges();
        renderFavDrawer();
        return;
      }

      const removeRideBtn = event.target.closest("[data-remove-fav-ride]");
      if (removeRideBtn) {
        const nextRides = getFavRides().filter((r) => r.id !== removeRideBtn.dataset.removeFavRide);
        writeJSON(KEYS.FAV_RIDES, nextRides);
        syncHeaderBadges();
        renderFavDrawer();
      }
    });
  }

  if (clearFavCarsBtn) {
    clearFavCarsBtn.addEventListener("click", () => {
      writeJSON(KEYS.FAV_CARS, []);
      syncHeaderBadges();
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

  // Restore saved user profile & latest ride schedule
  function init() {
    renderSelectedCarBanner();
    syncHeaderBadges();

    const profile = readJSON(KEYS.USER_PROFILE, null);
    if (profile) {
      if (profile.name && regNameInput) regNameInput.value = profile.name;
      if (profile.email && regEmailInput) regEmailInput.value = profile.email;
    }

    const rides = getFavRides();
    if (rides.length > 0) {
      const latest = rides[0];
      if (latest.rawStart && bookingStartInput) bookingStartInput.value = latest.rawStart;
      if (latest.rawEnd && bookingEndInput) bookingEndInput.value = latest.rawEnd;
    }
  }

  init();
})();
