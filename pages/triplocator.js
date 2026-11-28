/* ==========================================================================
   RentRide Trip Locator & Road-Trip Planner Script (pages/triplocator.js)
   Vehicle data model (Sedan, SUV, Van, Luxury) with unique photos,
   interactive SVG route map + vehicle preview + summary thumbnail,
   zoom controls, My Location quick-fill, dynamic stops, localStorage persistence,
   live date validation, and route optimization summary.
   ========================================================================== */

(() => {
  "use strict";

  const KEYS = {
    SELECTED_CAR: "rentride_selected_car",
    SEARCH_STATE: "rentride_search_state",
    FAV_CARS: "rentride_fav_cars",
    FAV_RIDES: "rentride_fav_rides",
    USER_PROFILE: "rentride_user_profile",
    TRIP_LOCATOR: "rentride_trip_locator",
    ESTIMATOR_PREFILL: "rentride_estimator_prefill"
  };

  const VEHICLE_TYPES = {
    Sedan: {
      id: "Sedan",
      label: "Sedan",
      modelName: "Civic Elegance Hybrid",
      rate: 58,
      mpg: 32,
      seats: 5,
      image: "images/car-sedan-silver.jpg",
      alt: "Silver modern touring Sedan"
    },
    SUV: {
      id: "SUV",
      label: "SUV",
      modelName: "Highland Touring SUV",
      rate: 88,
      mpg: 24,
      seats: 7,
      image: "images/car-suv-black.jpg",
      alt: "Gloss black AWD touring SUV"
    },
    Van: {
      id: "Van",
      label: "Van",
      modelName: "Grand Voyager Touring Van",
      rate: 110,
      mpg: 20,
      seats: 8,
      image: "images/car-van.jpg",
      alt: "Slate teal passenger touring Van"
    },
    Luxury: {
      id: "Luxury",
      label: "Luxury",
      modelName: "Monarch GT Executive",
      rate: 145,
      mpg: 22,
      seats: 4,
      image: "images/car-luxury-gt.jpg",
      alt: "Champagne gold Luxury GT coupe"
    }
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

  function getDefaultItinerary() {
    const selectedCar = readJSON(KEYS.SELECTED_CAR, null);
    const defaultType =
      selectedCar && VEHICLE_TYPES[selectedCar.category] ? selectedCar.category : "Sedan";

    return {
      vehicleType: defaultType,
      startDate: getOffsetDateISO(1),
      endDate: getOffsetDateISO(4),
      startLocation: "Islamabad Hub",
      endLocation: "Naran Valley",
      finalLegDistance: 85,
      stops: [
        { id: "stop-1", name: "Abbottabad Pine Overlook", type: "Scenic View", distance: 78 },
        { id: "stop-2", name: "Balakot Riverside Lodge", type: "Hotel", distance: 62 }
      ],
      isOptimized: false
    };
  }

  // State
  let itinerary = getDefaultItinerary();
  let mapZoom = 1;
  const MIN_ZOOM = 0.8;
  const MAX_ZOOM = 2.0;
  const ZOOM_STEP = 0.2;

  // DOM References
  const itineraryForm = document.getElementById("itineraryForm");
  const vehicleTypeCards = Array.from(document.querySelectorAll("[data-vehicle-type]"));
  const chosenVehicleImg = document.getElementById("chosenVehicleImg");
  const chosenVehicleTitle = document.getElementById("chosenVehicleTitle");
  const chosenVehicleMeta = document.getElementById("chosenVehicleMeta");

  const tripStartDate = document.getElementById("tripStartDate");
  const tripEndDate = document.getElementById("tripEndDate");
  const tripDurationChip = document.getElementById("tripDurationChip");
  const dateValidationError = document.getElementById("dateValidationError");

  const startLocationInput = document.getElementById("startLocation");
  const endLocationInput = document.getElementById("endLocation");
  const myLocationBtn = document.getElementById("myLocationBtn");
  const locationHint = document.getElementById("locationHint");
  const locationValidationError = document.getElementById("locationValidationError");

  const finalLegDistanceInput = document.getElementById("finalLegDistance");
  const stopsList = document.getElementById("stopsList");
  const newStopNameInput = document.getElementById("newStopName");
  const newStopTypeSelect = document.getElementById("newStopType");
  const newStopDistanceInput = document.getElementById("newStopDistance");
  const addStopBtn = document.getElementById("addStopBtn");
  const stopValidationError = document.getElementById("stopValidationError");
  const quickStopChips = Array.from(document.querySelectorAll(".quick-stop-chip"));

  const savedIndicator = document.getElementById("savedIndicator");
  const resetItineraryBtn = document.getElementById("resetItineraryBtn");

  const optimizedSummaryPanel = document.getElementById("optimizedSummaryPanel");
  const summaryTotalDistance = document.getElementById("summaryTotalDistance");
  const summaryDriveTime = document.getElementById("summaryDriveTime");
  const summaryStopCount = document.getElementById("summaryStopCount");
  const summaryDailyPace = document.getElementById("summaryDailyPace");
  const itineraryTimeline = document.getElementById("itineraryTimeline");
  const estimateTripCostLink = document.getElementById("estimateTripCostLink");

  // Map & Vehicle Preview DOM
  const mapViewport = document.getElementById("mapViewport");
  const mapCanvas = document.getElementById("mapCanvas");
  const mapRouteLayer = document.getElementById("mapRouteLayer");
  const mapPinsLayer = document.getElementById("mapPinsLayer");
  const mapPinTooltip = document.getElementById("mapPinTooltip");

  const mapSummaryVehicleImg = document.getElementById("mapSummaryVehicleImg");
  const mapSummaryVehicleType = document.getElementById("mapSummaryVehicleType");
  const mapSummaryRoute = document.getElementById("mapSummaryRoute");
  const mapSummaryDistance = document.getElementById("mapSummaryDistance");
  const mapSummaryTime = document.getElementById("mapSummaryTime");
  const mapSummaryStops = document.getElementById("mapSummaryStops");

  const mapPreviewBadge = document.getElementById("mapPreviewBadge");
  const mapPreviewImg = document.getElementById("mapPreviewImg");
  const mapPreviewModel = document.getElementById("mapPreviewModel");
  const mapPreviewSpecs = document.getElementById("mapPreviewSpecs");

  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomResetBtn = document.getElementById("zoomResetBtn");
  const zoomLevelLabel = document.getElementById("zoomLevelLabel");

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

  function getActiveVehicle() {
    return VEHICLE_TYPES[itinerary.vehicleType] || VEHICLE_TYPES.Sedan;
  }

  function persistItinerary() {
    writeJSON(KEYS.TRIP_LOCATOR, itinerary);
    if (savedIndicator) {
      savedIndicator.textContent = "Saved locally \u2713";
    }
  }

  function syncVehiclePreviewUI() {
    const vehicle = getActiveVehicle();

    vehicleTypeCards.forEach((card) => {
      const isSelected = card.dataset.vehicleType === vehicle.id;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });

    if (chosenVehicleImg) {
      chosenVehicleImg.src = vehicle.image;
      chosenVehicleImg.alt = vehicle.alt;
    }
    if (chosenVehicleTitle) {
      chosenVehicleTitle.textContent = `${vehicle.label} — ${vehicle.modelName}`;
    }
    if (chosenVehicleMeta) {
      chosenVehicleMeta.textContent = `${vehicle.seats} Seats • ${vehicle.mpg} MPG • $${vehicle.rate}/day`;
    }

    if (mapSummaryVehicleImg) {
      mapSummaryVehicleImg.src = vehicle.image;
      mapSummaryVehicleImg.alt = vehicle.alt;
    }
    if (mapSummaryVehicleType) {
      mapSummaryVehicleType.textContent = `${vehicle.label} • $${vehicle.rate}/day`;
    }

    if (mapPreviewImg) {
      mapPreviewImg.src = vehicle.image;
      mapPreviewImg.alt = vehicle.alt;
    }
    if (mapPreviewBadge) {
      mapPreviewBadge.textContent = vehicle.label;
    }
    if (mapPreviewModel) {
      mapPreviewModel.textContent = vehicle.modelName;
    }
    if (mapPreviewSpecs) {
      mapPreviewSpecs.textContent = `${vehicle.seats} Seats • ${vehicle.mpg} MPG • $${vehicle.rate}/day`;
    }
  }

  function selectVehicleType(typeName) {
    if (!VEHICLE_TYPES[typeName]) return;
    itinerary.vehicleType = typeName;
    persistItinerary();
    syncVehiclePreviewUI();
    if (itinerary.isOptimized) renderOptimizedSummary();
  }

  function getRentalDays() {
    if (!itinerary.startDate || !itinerary.endDate) return 1;
    const start = new Date(`${itinerary.startDate}T00:00:00`);
    const end = new Date(`${itinerary.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return 1;
    }
    const diffDays = Math.round((end - start) / 86400000);
    return Math.max(1, diffDays + 1);
  }

  function validateDates() {
    const start = tripStartDate ? tripStartDate.value : "";
    const end = tripEndDate ? tripEndDate.value : "";
    if (!start || !end) {
      if (dateValidationError) {
        dateValidationError.textContent = "Please select both a Start Date and End Date.";
        dateValidationError.hidden = false;
      }
      return false;
    }
    if (end < start) {
      if (dateValidationError) {
        dateValidationError.textContent = "End Date cannot be before Start Date.";
        dateValidationError.hidden = false;
      }
      if (tripEndDate) tripEndDate.setAttribute("aria-invalid", "true");
      if (tripDurationChip) tripDurationChip.textContent = "Invalid";
      return false;
    }
    if (dateValidationError) {
      dateValidationError.hidden = true;
      dateValidationError.textContent = "";
    }
    if (tripEndDate) tripEndDate.removeAttribute("aria-invalid");
    if (tripDurationChip) {
      const days = getRentalDays();
      tripDurationChip.textContent = `${days} Day${days === 1 ? "" : "s"}`;
    }
    return true;
  }

  function validateLocations() {
    const startLoc = (itinerary.startLocation || "").trim();
    const endLoc = (itinerary.endLocation || "").trim();
    if (!startLoc || !endLoc) {
      if (locationValidationError) {
        locationValidationError.textContent = "Please enter both a Start Location and an End Location.";
        locationValidationError.hidden = false;
      }
      return false;
    }
    if (locationValidationError) {
      locationValidationError.hidden = true;
      locationValidationError.textContent = "";
    }
    return true;
  }

  function computeMetrics() {
    const stopMiles = itinerary.stops.reduce((sum, s) => sum + Math.max(1, Number(s.distance) || 0), 0);
    const finalLeg = Math.max(1, Number(itinerary.finalLegDistance) || 0);
    const totalMiles = stopMiles + finalLeg;
    const avgSpeedMph = 52;
    const stopOverheadHours = itinerary.stops.length * 0.25;
    const totalHours = totalMiles / avgSpeedMph + stopOverheadHours;
    const hours = Math.floor(totalHours);
    const mins = Math.round((totalHours - hours) * 60);
    return {
      totalMiles,
      finalLeg,
      hours,
      mins,
      formattedTime: `${hours}h ${mins}m`
    };
  }

  function renderMap() {
    const startLabel = (itinerary.startLocation || "Start").trim() || "Start";
    const endLabel = (itinerary.endLocation || "Destination").trim() || "Destination";
    const metrics = computeMetrics();

    if (mapSummaryRoute) {
      mapSummaryRoute.textContent = `${startLabel} \u2192 ${endLabel}`;
    }
    if (mapSummaryDistance) {
      mapSummaryDistance.textContent = `${metrics.totalMiles} mi`;
    }
    if (mapSummaryTime) {
      mapSummaryTime.textContent = metrics.formattedTime;
    }
    if (mapSummaryStops) {
      const count = itinerary.stops.length;
      mapSummaryStops.textContent = `${count} stop${count === 1 ? "" : "s"}`;
    }

    if (!mapRouteLayer || !mapPinsLayer) return;

    const nodes = [
      { kind: "start", label: startLabel, sub: "Trip Origin", leg: 0 },
      ...itinerary.stops.map((s, idx) => ({
        kind: "stop",
        index: idx + 1,
        label: s.name,
        sub: `${s.type} • +${s.distance} mi`,
        leg: Number(s.distance) || 0
      })),
      { kind: "end", label: endLabel, sub: `Destination • +${metrics.finalLeg} mi`, leg: metrics.finalLeg }
    ];

    const startX = 110;
    const endX = 830;
    const count = nodes.length;
    const points = nodes.map((node, i) => {
      const t = count > 1 ? i / (count - 1) : 0;
      const x = startX + (endX - startX) * t;
      const wave = Math.sin(t * Math.PI * 1.65) * 68;
      const y = 225 - wave + (i % 2 === 0 ? 12 : -14);
      return { ...node, x: Math.round(x), y: Math.round(y) };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = Math.round((prev.x + curr.x) / 2);
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    mapRouteLayer.innerHTML = `
      <path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
      <path d="${d}" fill="none" stroke="url(#routeLineGrad)" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 6"/>
    `;

    mapPinsLayer.innerHTML = points
      .map((pt, idx) => {
        const safeLabel = escapeHtml(pt.label.length > 18 ? `${pt.label.slice(0, 17)}…` : pt.label);
        const fullLabel = escapeHtml(pt.label);
        const subText = escapeHtml(pt.sub);
        const fill = pt.kind === "start" ? "#149688" : pt.kind === "end" ? "#0B1522" : "#FFFFFF";
        const stroke = pt.kind === "stop" ? "#149688" : "#FFFFFF";
        const textColor = pt.kind === "stop" ? "#0B1522" : "#FFFFFF";
        const markerText = pt.kind === "start" ? "S" : pt.kind === "end" ? "E" : String(pt.index);
        const labelOffsetY = idx % 2 === 0 ? 34 : -26;

        return `
          <g class="map-pin-group" data-pin-title="${fullLabel}" data-pin-sub="${subText}" data-pin-x="${pt.x}" data-pin-y="${pt.y}">
            <circle cx="${pt.x}" cy="${pt.y}" r="18" fill="${pt.kind === "start" ? "rgba(20,150,136,0.22)" : "rgba(11,21,34,0.12)"}"/>
            <circle cx="${pt.x}" cy="${pt.y}" r="13" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
            <text x="${pt.x}" y="${pt.y + 4}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="11" font-weight="700" fill="${textColor}">${markerText}</text>
            <rect x="${pt.x - 62}" y="${pt.y + labelOffsetY - 13}" width="124" height="22" rx="11" fill="#FFFFFF" stroke="#DCE4EF" stroke-width="1"/>
            <text x="${pt.x}" y="${pt.y + labelOffsetY + 2}" text-anchor="middle" font-family="Inter, sans-serif" font-size="10.5" font-weight="600" fill="#0B1522">${safeLabel}</text>
          </g>
        `;
      })
      .join("");
  }

  function applyZoom(nextZoom) {
    mapZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));
    if (mapCanvas) {
      mapCanvas.style.transform = `scale(${mapZoom})`;
    }
    if (zoomLevelLabel) {
      zoomLevelLabel.textContent = `${Math.round(mapZoom * 100)}%`;
    }
    if (zoomInBtn) zoomInBtn.disabled = mapZoom >= MAX_ZOOM;
    if (zoomOutBtn) zoomOutBtn.disabled = mapZoom <= MIN_ZOOM;
  }

  function renderStops() {
    if (!stopsList) return;
    if (itinerary.stops.length === 0) {
      stopsList.innerHTML = `<li class="stop-empty">No intermediate stops added yet. Use "+ Add Stop" below or choose a quick stop.</li>`;
      return;
    }

    stopsList.innerHTML = itinerary.stops
      .map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === itinerary.stops.length - 1;
        return `
          <li class="stop-item" data-stop-id="${escapeHtml(stop.id)}">
            <div class="stop-item-main">
              <span class="stop-index" aria-hidden="true">${idx + 1}</span>
              <div class="stop-info">
                <p class="stop-name">${escapeHtml(stop.name)}</p>
                <span class="stop-type-badge">${escapeHtml(stop.type)}</span>
              </div>
            </div>
            <div class="stop-item-controls">
              <label class="stop-dist-wrap">
                <span>Leg</span>
                <input
                  type="number"
                  class="stop-dist-input"
                  data-stop-dist="${escapeHtml(stop.id)}"
                  min="1"
                  max="3000"
                  value="${Number(stop.distance) || 1}"
                  aria-label="Distance for ${escapeHtml(stop.name)} in miles"
                >
                <span>mi</span>
              </label>
              <button type="button" class="stop-action-btn" data-move-up="${idx}" ${isFirst ? "disabled" : ""} aria-label="Move ${escapeHtml(stop.name)} up" title="Move Up">&uarr;</button>
              <button type="button" class="stop-action-btn" data-move-down="${idx}" ${isLast ? "disabled" : ""} aria-label="Move ${escapeHtml(stop.name)} down" title="Move Down">&darr;</button>
              <button type="button" class="stop-action-btn stop-remove-btn" data-remove-stop="${idx}" aria-label="Remove ${escapeHtml(stop.name)}" title="Remove stop">&times;</button>
            </div>
          </li>
        `;
      })
      .join("");
  }

  function renderOptimizedSummary() {
    if (!optimizedSummaryPanel) return;
    if (!itinerary.isOptimized) {
      optimizedSummaryPanel.hidden = true;
      return;
    }

    const vehicle = getActiveVehicle();
    const metrics = computeMetrics();
    const days = getRentalDays();
    const dailyPace = Math.round(metrics.totalMiles / days);
    const startLabel = (itinerary.startLocation || "Origin").trim();
    const endLabel = (itinerary.endLocation || "Destination").trim();

    if (summaryTotalDistance) summaryTotalDistance.textContent = `${metrics.totalMiles} mi (${Math.round(metrics.totalMiles * 1.609)} km)`;
    if (summaryDriveTime) summaryDriveTime.textContent = metrics.formattedTime;
    if (summaryStopCount) summaryStopCount.textContent = `${itinerary.stops.length} Stop${itinerary.stops.length === 1 ? "" : "s"}`;
    if (summaryDailyPace) summaryDailyPace.textContent = `${dailyPace} mi/day`;

    let cumulativeMiles = 0;
    const timelineItems = [
      `<li class="timeline-step">
        <div>
          <p class="timeline-step-title">Depart: ${escapeHtml(startLabel)} (${escapeHtml(vehicle.label)} &bull; ${escapeHtml(vehicle.modelName)})</p>
          <p class="timeline-step-meta">Start Date: ${escapeHtml(itinerary.startDate)}</p>
        </div>
        <span class="timeline-step-leg">0 mi</span>
      </li>`
    ];

    itinerary.stops.forEach((stop, i) => {
      const leg = Math.max(1, Number(stop.distance) || 1);
      cumulativeMiles += leg;
      timelineItems.push(`
        <li class="timeline-step">
          <div>
            <p class="timeline-step-title">Stop ${i + 1}: ${escapeHtml(stop.name)}</p>
            <p class="timeline-step-meta">${escapeHtml(stop.type)} &bull; Leg +${leg} mi</p>
          </div>
          <span class="timeline-step-leg">${cumulativeMiles} mi</span>
        </li>
      `);
    });

    cumulativeMiles += metrics.finalLeg;
    timelineItems.push(`
      <li class="timeline-step is-destination">
        <div>
          <p class="timeline-step-title">Arrive: ${escapeHtml(endLabel)}</p>
          <p class="timeline-step-meta">End Date: ${escapeHtml(itinerary.endDate)} &bull; Final Leg +${metrics.finalLeg} mi</p>
        </div>
        <span class="timeline-step-leg">${cumulativeMiles} mi total</span>
      </li>
    `);

    if (itineraryTimeline) {
      itineraryTimeline.innerHTML = timelineItems.join("");
    }

    writeJSON(KEYS.ESTIMATOR_PREFILL, {
      vehicleType: vehicle.id,
      distance: metrics.totalMiles,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate
    });

    optimizedSummaryPanel.hidden = false;
  }

  function addStop(name, type, distance) {
    const cleanName = name.trim();
    const dist = Number(distance);

    if (!cleanName) {
      if (stopValidationError) {
        stopValidationError.textContent = "Please enter a name for the custom stop.";
        stopValidationError.hidden = false;
      }
      if (newStopNameInput) newStopNameInput.focus();
      return false;
    }

    if (!Number.isFinite(dist) || dist <= 0) {
      if (stopValidationError) {
        stopValidationError.textContent = "Stop distance must be greater than 0 miles.";
        stopValidationError.hidden = false;
      }
      if (newStopDistanceInput) newStopDistanceInput.focus();
      return false;
    }

    if (stopValidationError) {
      stopValidationError.hidden = true;
      stopValidationError.textContent = "";
    }

    itinerary.stops.push({
      id: `stop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: cleanName,
      type: type || "Custom",
      distance: Math.round(dist)
    });

    persistItinerary();
    renderStops();
    renderMap();
    if (itinerary.isOptimized) renderOptimizedSummary();
    return true;
  }

  // Event Bindings: Vehicle Selector
  vehicleTypeCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectVehicleType(card.dataset.vehicleType || "Sedan");
    });
  });

  // Event Bindings: Dates & Locations
  if (tripStartDate) {
    tripStartDate.addEventListener("change", () => {
      itinerary.startDate = tripStartDate.value;
      validateDates();
      persistItinerary();
      if (itinerary.isOptimized) renderOptimizedSummary();
    });
  }

  if (tripEndDate) {
    tripEndDate.addEventListener("change", () => {
      itinerary.endDate = tripEndDate.value;
      validateDates();
      persistItinerary();
      if (itinerary.isOptimized) renderOptimizedSummary();
    });
  }

  if (startLocationInput) {
    startLocationInput.addEventListener("input", () => {
      itinerary.startLocation = startLocationInput.value;
      validateLocations();
      persistItinerary();
      renderMap();
      if (itinerary.isOptimized) renderOptimizedSummary();
    });
  }

  if (endLocationInput) {
    endLocationInput.addEventListener("input", () => {
      itinerary.endLocation = endLocationInput.value;
      validateLocations();
      persistItinerary();
      renderMap();
      if (itinerary.isOptimized) renderOptimizedSummary();
    });
  }

  if (finalLegDistanceInput) {
    finalLegDistanceInput.addEventListener("input", () => {
      const val = Math.max(1, Number(finalLegDistanceInput.value) || 1);
      itinerary.finalLegDistance = val;
      persistItinerary();
      renderMap();
      if (itinerary.isOptimized) renderOptimizedSummary();
    });
  }

  // My Location Quick-Fill Pin Button
  if (myLocationBtn && startLocationInput) {
    myLocationBtn.addEventListener("click", () => {
      const fillFallbackLocation = (note) => {
        const searchState = readJSON(KEYS.SEARCH_STATE, {});
        const hubCity = searchState.pickupCity || "Islamabad";
        startLocationInput.value = `${hubCity} (My Location)`;
        itinerary.startLocation = startLocationInput.value;
        validateLocations();
        persistItinerary();
        renderMap();
        if (locationHint) locationHint.textContent = note;
      };

      if (!navigator.geolocation) {
        fillFallbackLocation("Quick-filled using nearest RentRide pickup hub.");
        return;
      }

      if (locationHint) locationHint.textContent = "Detecting your location…";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(2);
          const lng = pos.coords.longitude.toFixed(2);
          startLocationInput.value = `Current Location (${lat}, ${lng})`;
          itinerary.startLocation = startLocationInput.value;
          validateLocations();
          persistItinerary();
          renderMap();
          if (locationHint) locationHint.textContent = "Start location filled from your GPS coordinates.";
        },
        () => {
          fillFallbackLocation("Location permission unavailable — quick-filled with RentRide Hub.");
        },
        { timeout: 3000 }
      );
    });
  }

  // Stops Interactions (Add, Quick Add, Reorder, Edit Distance, Remove)
  if (addStopBtn) {
    addStopBtn.addEventListener("click", () => {
      const added = addStop(
        newStopNameInput ? newStopNameInput.value : "",
        newStopTypeSelect ? newStopTypeSelect.value : "Custom",
        newStopDistanceInput ? newStopDistanceInput.value : 55
      );
      if (added && newStopNameInput) {
        newStopNameInput.value = "";
        newStopNameInput.focus();
      }
    });
  }

  quickStopChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      addStop(
        chip.dataset.quickName || "Custom Stop",
        chip.dataset.quickType || "Custom",
        Number(chip.dataset.quickDist) || 40
      );
    });
  });

  if (stopsList) {
    stopsList.addEventListener("click", (event) => {
      const upBtn = event.target.closest("[data-move-up]");
      if (upBtn) {
        const idx = Number(upBtn.dataset.moveUp);
        if (idx > 0) {
          const temp = itinerary.stops[idx - 1];
          itinerary.stops[idx - 1] = itinerary.stops[idx];
          itinerary.stops[idx] = temp;
          persistItinerary();
          renderStops();
          renderMap();
          if (itinerary.isOptimized) renderOptimizedSummary();
        }
        return;
      }

      const downBtn = event.target.closest("[data-move-down]");
      if (downBtn) {
        const idx = Number(downBtn.dataset.moveDown);
        if (idx < itinerary.stops.length - 1) {
          const temp = itinerary.stops[idx + 1];
          itinerary.stops[idx + 1] = itinerary.stops[idx];
          itinerary.stops[idx] = temp;
          persistItinerary();
          renderStops();
          renderMap();
          if (itinerary.isOptimized) renderOptimizedSummary();
        }
        return;
      }

      const removeBtn = event.target.closest("[data-remove-stop]");
      if (removeBtn) {
        const idx = Number(removeBtn.dataset.removeStop);
        itinerary.stops.splice(idx, 1);
        persistItinerary();
        renderStops();
        renderMap();
        if (itinerary.isOptimized) renderOptimizedSummary();
      }
    });

    stopsList.addEventListener("input", (event) => {
      const distInput = event.target.closest("[data-stop-dist]");
      if (!distInput) return;
      const stop = itinerary.stops.find((s) => s.id === distInput.dataset.stopDist);
      if (!stop) return;
      stop.distance = Math.max(1, Number(distInput.value) || 1);
      persistItinerary();
      renderMap();
      if (itinerary.isOptimized) renderOptimizedSummary();
    });
  }

  // Optimize Route Submit
  if (itineraryForm) {
    itineraryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const datesOk = validateDates();
      const locsOk = validateLocations();
      if (!datesOk || !locsOk) return;

      if (itinerary.stops.length > 1) {
        itinerary.stops.sort((a, b) => Number(a.distance) - Number(b.distance));
      }
      itinerary.isOptimized = true;
      persistItinerary();
      renderStops();
      renderMap();
      renderOptimizedSummary();

      if (optimizedSummaryPanel) {
        optimizedSummaryPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  if (resetItineraryBtn) {
    resetItineraryBtn.addEventListener("click", () => {
      itinerary = getDefaultItinerary();
      persistItinerary();
      hydrateForm();
      syncVehiclePreviewUI();
      renderStops();
      renderMap();
      renderOptimizedSummary();
      validateDates();
      validateLocations();
      if (locationHint) locationHint.textContent = "";
    });
  }

  if (estimateTripCostLink) {
    estimateTripCostLink.addEventListener("click", () => {
      const metrics = computeMetrics();
      const vehicle = getActiveVehicle();
      writeJSON(KEYS.ESTIMATOR_PREFILL, {
        vehicleType: vehicle.id,
        distance: metrics.totalMiles,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate
      });
    });
  }

  // Map Zoom & Pin Tooltip Interactions
  if (zoomInBtn) zoomInBtn.addEventListener("click", () => applyZoom(mapZoom + ZOOM_STEP));
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => applyZoom(mapZoom - ZOOM_STEP));
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => applyZoom(1));

  if (mapPinsLayer && mapPinTooltip && mapViewport) {
    mapPinsLayer.addEventListener("mouseover", (event) => {
      const pin = event.target.closest(".map-pin-group");
      if (!pin) return;
      const rect = mapViewport.getBoundingClientRect();
      const pinRect = pin.getBoundingClientRect();
      mapPinTooltip.innerHTML = `<strong>${escapeHtml(pin.dataset.pinTitle || "")}</strong><br>${escapeHtml(pin.dataset.pinSub || "")}`;
      mapPinTooltip.style.left = `${pinRect.left - rect.left + pinRect.width / 2}px`;
      mapPinTooltip.style.top = `${pinRect.top - rect.top}px`;
      mapPinTooltip.hidden = false;
    });

    mapPinsLayer.addEventListener("mouseout", (event) => {
      if (event.target.closest(".map-pin-group")) {
        mapPinTooltip.hidden = true;
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

  function hydrateForm() {
    if (tripStartDate) tripStartDate.value = itinerary.startDate || "";
    if (tripEndDate) tripEndDate.value = itinerary.endDate || "";
    if (startLocationInput) startLocationInput.value = itinerary.startLocation || "";
    if (endLocationInput) endLocationInput.value = itinerary.endLocation || "";
    if (finalLegDistanceInput) finalLegDistanceInput.value = itinerary.finalLegDistance || 85;
  }

  function init() {
    const saved = readJSON(KEYS.TRIP_LOCATOR, null);
    if (saved && typeof saved === "object") {
      const validType = VEHICLE_TYPES[saved.vehicleType] ? saved.vehicleType : getDefaultItinerary().vehicleType;
      itinerary = {
        ...getDefaultItinerary(),
        ...saved,
        vehicleType: validType,
        stops: Array.isArray(saved.stops) ? saved.stops : getDefaultItinerary().stops
      };
    }
    hydrateForm();
    syncVehiclePreviewUI();
    validateDates();
    renderStops();
    renderMap();
    renderOptimizedSummary();
    applyZoom(1);
    syncHeaderBadges();
  }

  init();
})();
