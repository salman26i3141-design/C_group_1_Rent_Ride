/* ==========================================================================
   RentRide Trip Cost Estimator Script (pages/calculator.js)
   Handles vehicle type cards (Sedan/SUV/Van/Luxury) with unique images,
   auto-updating default rate & MPG, live vehicle summary photo,
   trip distance & date validation, cost breakdown, and shared overlays.
   ========================================================================== */

(() => {
  "use strict";

  const KEYS = {
    SELECTED_CAR: "rentride_selected_car",
    FAV_CARS: "rentride_fav_cars",
    FAV_RIDES: "rentride_fav_rides",
    USER_PROFILE: "rentride_user_profile",
    ESTIMATOR_PREFILL: "rentride_estimator_prefill"
  };

  const CAR_CATALOG = [
    { id: "urban-glide-hatchback", name: "Urban Glide Hatchback", category: "Hatchback", rate: 44 },
    { id: "swift-aero-hatch", name: "Swift Aero Sport Hatch", category: "Hatchback", rate: 48 },
    { id: "executive-touring-sedan", name: "Executive Touring Sedan", category: "Sedan", rate: 58 },
    { id: "civic-elegance-hybrid", name: "Civic Elegance Hybrid", category: "Sedan", rate: 62 },
    { id: "trailblaze-awd-suv", name: "TrailBlaze AWD SUV", category: "SUV", rate: 88 },
    { id: "highland-touring-suv", name: "Highland Touring SUV", category: "SUV", rate: 96 },
    { id: "apex-sovereign-ls", name: "Apex Sovereign LS", category: "Luxury", rate: 125 },
    { id: "monarch-gt-coupe", name: "Monarch GT Executive", category: "Luxury", rate: 145 }
  ];

  const VEHICLE_SPECS = {
    Sedan: {
      type: "Sedan",
      model: "Civic Elegance Hybrid",
      rate: 58,
      mpg: 32,
      image: "images/car-sedan-silver.jpg",
      alt: "Silver modern touring Sedan"
    },
    SUV: {
      type: "SUV",
      model: "TrailBlaze AWD SUV",
      rate: 88,
      mpg: 24,
      image: "images/car-suv-black.jpg",
      alt: "Gloss black AWD touring SUV"
    },
    Van: {
      type: "Van",
      model: "Grand Voyager Van",
      rate: 110,
      mpg: 20,
      image: "images/car-van.jpg",
      alt: "Slate teal passenger touring Van"
    },
    Luxury: {
      type: "Luxury",
      model: "Monarch GT Executive",
      rate: 145,
      mpg: 22,
      image: "images/car-luxury-gt.jpg",
      alt: "Champagne gold Luxury GT coupe"
    }
  };

  function getOffsetDateISO(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const offsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offsetMs).toISOString().split("T")[0];
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
      // Ignore storage failures cleanly.
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // State
  let selectedVehicleType = "Sedan";

  // DOM References
  const costEstimatorForm = document.getElementById("costEstimatorForm");
  const vehicleTypeCards = Array.from(document.querySelectorAll("[data-vehicle-type]"));
  const tripDistanceInput = document.getElementById("tripDistance");
  const calcStartDateInput = document.getElementById("calcStartDate");
  const calcEndDateInput = document.getElementById("calcEndDate");
  const rentalDaysPill = document.getElementById("rentalDaysPill");
  const avgMpgInput = document.getElementById("avgMpg");
  const gasPriceInput = document.getElementById("gasPrice");

  const distanceError = document.getElementById("distanceError");
  const dateRangeError = document.getElementById("dateRangeError");
  const mpgError = document.getElementById("mpgError");
  const gasPriceError = document.getElementById("gasPriceError");

  const resultsBreakdownPanel = document.getElementById("resultsBreakdownPanel");
  const summaryVehicleImg = document.getElementById("summaryVehicleImg");
  const summaryVehicleType = document.getElementById("summaryVehicleType");
  const summaryVehicleModel = document.getElementById("summaryVehicleModel");
  const summaryVehicleSpecs = document.getElementById("summaryVehicleSpecs");
  const summaryRatePill = document.getElementById("summaryRatePill");
  const estimatedFuelLine = document.getElementById("estimatedFuelLine");
  const estimatedRentalLine = document.getElementById("estimatedRentalLine");
  const totalEstimatedLine = document.getElementById("totalEstimatedLine");
  const fuelDetailsSub = document.getElementById("fuelDetailsSub");
  const rentalDetailsSub = document.getElementById("rentalDetailsSub");
  const totalPerMileSub = document.getElementById("totalPerMileSub");

  // Header & Overlay DOM
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

  function setFieldError(inputEl, errorEl, message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = !message;
    }
    if (inputEl) {
      if (message) {
        inputEl.setAttribute("aria-invalid", "true");
      } else {
        inputEl.removeAttribute("aria-invalid");
      }
    }
  }

  function calculateRentalDays() {
    const startVal = calcStartDateInput ? calcStartDateInput.value : "";
    const endVal = calcEndDateInput ? calcEndDateInput.value : "";
    if (!startVal || !endVal) {
      return { valid: false, days: 1, error: "Please choose both Start Date and End Date." };
    }

    const start = new Date(`${startVal}T00:00:00`);
    const end = new Date(`${endVal}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { valid: false, days: 1, error: "Please enter valid dates." };
    }
    if (end < start) {
      return { valid: false, days: 1, error: "End Date cannot be before Start Date." };
    }

    const diffDays = Math.round((end - start) / 86400000);
    const days = Math.max(1, diffDays);
    return { valid: true, days, error: "" };
  }

  function validateInputs() {
    let allValid = true;

    const distance = Number(tripDistanceInput ? tripDistanceInput.value : 0);
    if (!Number.isFinite(distance) || distance <= 0) {
      setFieldError(tripDistanceInput, distanceError, "Trip Distance must be greater than 0 miles.");
      allValid = false;
    } else {
      setFieldError(tripDistanceInput, distanceError, "");
    }

    const dateCheck = calculateRentalDays();
    if (!dateCheck.valid) {
      setFieldError(calcEndDateInput, dateRangeError, dateCheck.error);
      if (rentalDaysPill) rentalDaysPill.textContent = "Invalid";
      allValid = false;
    } else {
      setFieldError(calcEndDateInput, dateRangeError, "");
      if (rentalDaysPill) {
        rentalDaysPill.textContent = `${dateCheck.days} Day${dateCheck.days === 1 ? "" : "s"}`;
      }
    }

    const mpg = Number(avgMpgInput ? avgMpgInput.value : 0);
    if (!Number.isFinite(mpg) || mpg <= 0) {
      setFieldError(avgMpgInput, mpgError, "Average MPG must be greater than 0.");
      allValid = false;
    } else {
      setFieldError(avgMpgInput, mpgError, "");
    }

    const gasPrice = Number(gasPriceInput ? gasPriceInput.value : 0);
    if (!Number.isFinite(gasPrice) || gasPrice <= 0) {
      setFieldError(gasPriceInput, gasPriceError, "Gas price must be greater than $0.00.");
      allValid = false;
    } else {
      setFieldError(gasPriceInput, gasPriceError, "");
    }

    return { allValid, distance, days: dateCheck.days, mpg, gasPrice };
  }

  function syncSummaryVehicleUI() {
    const vehicleSpec = VEHICLE_SPECS[selectedVehicleType] || VEHICLE_SPECS.Sedan;

    if (summaryVehicleImg) {
      summaryVehicleImg.src = vehicleSpec.image;
      summaryVehicleImg.alt = vehicleSpec.alt;
    }
    if (summaryVehicleType) {
      summaryVehicleType.textContent = vehicleSpec.type;
    }
    if (summaryVehicleModel) {
      summaryVehicleModel.textContent = vehicleSpec.model;
    }
    if (summaryVehicleSpecs) {
      summaryVehicleSpecs.textContent = `Default Rate: $${vehicleSpec.rate.toFixed(2)}/day • Default Efficiency: ${vehicleSpec.mpg} MPG`;
    }
    if (summaryRatePill) {
      summaryRatePill.textContent = `$${vehicleSpec.rate}/day`;
    }
  }

  function updateBreakdown(fromSubmit) {
    syncSummaryVehicleUI();

    const check = validateInputs();
    if (!check.allValid) return false;

    const vehicleSpec = VEHICLE_SPECS[selectedVehicleType] || VEHICLE_SPECS.Sedan;
    const dailyRate = vehicleSpec.rate;
    const gallonsNeeded = check.distance / check.mpg;
    const estimatedFuel = gallonsNeeded * check.gasPrice;
    const estimatedRental = check.days * dailyRate;
    const totalCost = estimatedFuel + estimatedRental;
    const costPerMile = totalCost / check.distance;

    if (estimatedFuelLine) {
      estimatedFuelLine.innerHTML = `Estimated Fuel: <strong>$${estimatedFuel.toFixed(2)}</strong>`;
    }
    if (fuelDetailsSub) {
      fuelDetailsSub.textContent = `${gallonsNeeded.toFixed(2)} gal @ $${check.gasPrice.toFixed(2)}/gal (${check.mpg} MPG)`;
    }
    if (estimatedRentalLine) {
      estimatedRentalLine.innerHTML = `Estimated Rental: <strong>$${estimatedRental.toFixed(2)}</strong>`;
    }
    if (rentalDetailsSub) {
      rentalDetailsSub.textContent = `${vehicleSpec.type} • ${check.days} day${check.days === 1 ? "" : "s"} × $${dailyRate.toFixed(2)}/day`;
    }
    if (totalEstimatedLine) {
      totalEstimatedLine.innerHTML = `<strong>Total Estimated Cost: $${totalCost.toFixed(2)}</strong>`;
    }
    if (totalPerMileSub) {
      totalPerMileSub.textContent = `Approx. $${costPerMile.toFixed(2)}/mile across ${check.distance} miles`;
    }

    if (resultsBreakdownPanel) {
      resultsBreakdownPanel.hidden = false;
      if (fromSubmit) {
        resultsBreakdownPanel.classList.remove("is-highlighted");
        void resultsBreakdownPanel.offsetWidth;
        resultsBreakdownPanel.classList.add("is-highlighted");
      }
    }
    return true;
  }

  function selectVehicleType(typeName) {
    if (!VEHICLE_SPECS[typeName]) return;
    selectedVehicleType = typeName;

    vehicleTypeCards.forEach((card) => {
      const isSelected = card.dataset.vehicleType === typeName;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });

    if (avgMpgInput) {
      avgMpgInput.value = String(VEHICLE_SPECS[typeName].mpg);
    }

    updateBreakdown(false);
  }

  // Event Bindings
  vehicleTypeCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectVehicleType(card.dataset.vehicleType || "Sedan");
    });
  });

  [tripDistanceInput, calcStartDateInput, calcEndDateInput, avgMpgInput, gasPriceInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => updateBreakdown(false));
    input.addEventListener("change", () => updateBreakdown(false));
  });

  if (costEstimatorForm) {
    costEstimatorForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const ok = updateBreakdown(true);
      if (ok && resultsBreakdownPanel) {
        resultsBreakdownPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  // Shared Header Overlays & Navigation
  function getFavCarIds() {
    const arr = readJSON(KEYS.FAV_CARS, []);
    return Array.isArray(arr) ? arr : [];
  }

  function getFavRides() {
    const arr = readJSON(KEYS.FAV_RIDES, []);
    return Array.isArray(arr) ? arr : [];
  }

  function syncHeaderBadges() {
    if (favCountBadge) {
      favCountBadge.textContent = String(getFavCarIds().length + getFavRides().length);
    }
    const profile = readJSON(KEYS.USER_PROFILE, null);
    if (accountStatusDot) {
      accountStatusDot.hidden = !(profile && profile.name && profile.email);
    }
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
                  <p class="fav-item-title">${escapeHtml(ride.carName || "Selected Ride")}</p>
                  <p class="fav-item-sub">${escapeHtml(ride.startTime)} &rarr; ${escapeHtml(ride.endTime)}</p>
                </div>
                <button type="button" class="fav-remove-btn" data-remove-fav-ride="${escapeHtml(ride.id)}">Remove</button>
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
          <p><strong>Name:</strong> ${escapeHtml(profile.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(profile.email)}</p>
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

  // Initialize
  function init() {
    const prefill = readJSON(KEYS.ESTIMATOR_PREFILL, null);
    if (calcStartDateInput) calcStartDateInput.value = (prefill && prefill.startDate) || getOffsetDateISO(1);
    if (calcEndDateInput) calcEndDateInput.value = (prefill && prefill.endDate) || getOffsetDateISO(4);
    if (tripDistanceInput && prefill && Number(prefill.distance) > 0) {
      tripDistanceInput.value = String(Math.round(Number(prefill.distance)));
    }

    const selectedCar = readJSON(KEYS.SELECTED_CAR, null);
    if (prefill && prefill.vehicleType && VEHICLE_SPECS[prefill.vehicleType]) {
      selectVehicleType(prefill.vehicleType);
    } else if (selectedCar && VEHICLE_SPECS[selectedCar.category]) {
      selectVehicleType(selectedCar.category);
    } else {
      selectVehicleType("Sedan");
    }

    updateBreakdown(false);
    syncHeaderBadges();
  }

  init();
})();
