/**
 * RentRide Pickup Locations Controller
 * Features: shared nav, branch data, keyword search, filter sidebar,
 * SVG map pins, zoom, map tooltip, branch cards, pagination (3/page),
 * detail modal/drawer, localStorage preferred-branch persistence.
 */
(function () {
  "use strict";

  /* =========================================================================
     BRANCH DATA — 11 realistic RentRide locations across Pakistan
     ========================================================================= */
  var BRANCHES = [
    {
      id: "isb-main",
      name: "Islamabad Main Branch",
      city: "Islamabad",
      address: "123 F-6 Markaz, Jinnah Super Market, Islamabad",
      phone: "+92-51-111-736-874",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Free Parking"],
      map: { x: 22, y: 32 }   // percentage of map viewport
    },
    {
      id: "isb-airport",
      name: "Islamabad Airport Terminal 1",
      city: "Islamabad",
      address: "New Islamabad International Airport, Fateh Jang Road",
      phone: "+92-51-111-736-875",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Airport Location"],
      map: { x: 12, y: 60 }
    },
    {
      id: "lhr-central",
      name: "Lahore Central Branch",
      city: "Lahore",
      address: "45 Mall Road, Near Punjab Assembly, Lahore",
      phone: "+92-42-111-736-874",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Free Parking"],
      map: { x: 42, y: 25 }
    },
    {
      id: "lhr-airport",
      name: "Lahore Allama Iqbal Airport",
      city: "Lahore",
      address: "Allama Iqbal International Airport, Lahore",
      phone: "+92-42-111-736-876",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Airport Location"],
      map: { x: 55, y: 42 }
    },
    {
      id: "khi-clifton",
      name: "Karachi Clifton Branch",
      city: "Karachi",
      address: "789 Clifton Block 5, Clifton, Karachi",
      phone: "+92-21-111-736-874",
      hours: "Open 8:00 AM – 10:00 PM",
      status: "limited",
      serviceType: "Both",
      features: ["Free Parking"],
      map: { x: 70, y: 20 }
    },
    {
      id: "khi-shahra",
      name: "Karachi Shahrah-e-Faisal",
      city: "Karachi",
      address: "214 Shahrah-e-Faisal, Near Hotel Metropole, Karachi",
      phone: "+92-21-111-736-875",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Free Parking"],
      map: { x: 82, y: 36 }
    },
    {
      id: "rwp-saddar",
      name: "Rawalpindi Saddar Hub",
      city: "Rawalpindi",
      address: "56 The Mall, Saddar, Rawalpindi",
      phone: "+92-51-111-736-877",
      hours: "Open 9:00 AM – 9:00 PM",
      status: "limited",
      serviceType: "Pickup Only",
      features: ["Free Parking"],
      map: { x: 30, y: 68 }
    },
    {
      id: "rwp-airport",
      name: "Rawalpindi Benazir Bhutto Airport",
      city: "Rawalpindi",
      address: "Shaheed Benazir Bhutto International Airport, Rawalpindi",
      phone: "+92-51-111-736-878",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Airport Location"],
      map: { x: 18, y: 80 }
    },
    {
      id: "pew-gt-road",
      name: "Peshawar GT Road Branch",
      city: "Peshawar",
      address: "12 Grand Trunk Road, Hashtnagri, Peshawar",
      phone: "+92-91-111-736-874",
      hours: "Open 8:00 AM – 8:00 PM",
      status: "limited",
      serviceType: "Drop-off Only",
      features: ["Free Parking"],
      map: { x: 60, y: 72 }
    },
    {
      id: "lhr-dha",
      name: "Lahore DHA Phase 5",
      city: "Lahore",
      address: "Shop 7, Block L Commercial, DHA Phase 5, Lahore",
      phone: "+92-42-111-736-879",
      hours: "Open 9:00 AM – 11:00 PM",
      status: "limited",
      serviceType: "Both",
      features: ["Free Parking"],
      map: { x: 48, y: 56 }
    },
    {
      id: "khi-airport",
      name: "Karachi Jinnah International Airport",
      city: "Karachi",
      address: "Jinnah International Airport, Terminal 1, Karachi",
      phone: "+92-21-111-736-880",
      hours: "Open 24/7",
      status: "open",
      serviceType: "Both",
      features: ["24/7 Support", "Airport Location"],
      map: { x: 76, y: 60 }
    }
  ];

  /* =========================================================================
     STATE
     ========================================================================= */
  var BRANCHES_PER_PAGE = 3;
  var PREFERRED_KEY     = "rentride_preferred_location";

  var state = {
    searchQuery:     "",
    cityFilter:      "",
    serviceFilters:  [],
    featureFilters:  [],
    currentPage:     1,
    filtered:        BRANCHES.slice(),
    activeBranchId:  null,
    openModalId:     null,
    mapScale:        1,
    preferredId:     loadPreferred()
  };

  /* =========================================================================
     ELEMENT REFS
     ========================================================================= */
  var el = {
    mobileNavToggle:    id("mobile-nav-toggle"),
    primaryNavigation:  id("primary-navigation"),
    moreMenuButton:     id("more-menu-button"),
    moreMenuList:       id("more-menu-list"),
    locationSearch:     id("location-search"),
    searchBtn:          id("search-btn"),
    resultsStatus:      id("results-status"),
    cityFilter:         id("city-filter"),
    applyFiltersBtn:    id("apply-filters-btn"),
    resetFiltersBtn:    id("reset-filters-btn"),
    mapCanvas:          id("map-canvas"),
    mapPins:            id("map-pins"),
    mapTooltip:         id("map-tooltip"),
    tooltipName:        id("tooltip-name"),
    tooltipAddress:     id("tooltip-address"),
    tooltipStatus:      id("tooltip-status"),
    tooltipCloseBtn:    id("tooltip-close-btn"),
    zoomInBtn:          id("zoom-in-btn"),
    zoomOutBtn:         id("zoom-out-btn"),
    branchList:         id("branch-list"),
    branchEmptyState:   id("branch-empty-state"),
    branchCountBadge:   id("branch-count-badge"),
    emptyResetBtn:      id("empty-reset-btn"),
    paginationNav:      id("pagination-nav"),
    pagePrev:           id("page-prev"),
    pageNext:           id("page-next"),
    pageNumbers:        id("page-numbers"),
    branchModal:        id("branch-modal"),
    modalCloseBtn:      id("modal-close-btn"),
    modalTitle:         id("modal-title"),
    modalCity:          id("modal-city"),
    modalAddress:       id("modal-address"),
    modalPhone:         id("modal-phone"),
    modalHours:         id("modal-hours"),
    modalService:       id("modal-service"),
    modalStatus:        id("modal-status"),
    modalFeatures:      id("modal-features"),
    modalSelectBtn:     id("modal-select-preferred-btn"),
    modalBookLink:      id("modal-book-from-here") || id("modal-book-link"),
    modalPreferredConf: id("modal-preferred-confirm"),
    serviceChecks:      Array.from(document.querySelectorAll('input[name="serviceType"]')),
    featureChecks:      Array.from(document.querySelectorAll('input[name="feature"]'))
  };

  function id(i) { return document.getElementById(i); }

  /* =========================================================================
     localStorage helpers
     ========================================================================= */
  function loadPreferred() {
    try { return localStorage.getItem(PREFERRED_KEY) || ""; }
    catch(e) { return ""; }
  }
  function savePreferred(branchId) {
    try { localStorage.setItem(PREFERRED_KEY, branchId); }
    catch(e) {}
  }

  /* =========================================================================
     SHARED NAVIGATION (mobile drawer + More dropdown)
     ========================================================================= */
  function initNavigation() {
    var toggle = el.mobileNavToggle;
    var nav    = el.primaryNavigation;
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    var btn   = el.moreMenuButton;
    var menu  = el.moreMenuList;
    if (!btn || !menu) return;
    var links = Array.from(menu.querySelectorAll(".dropdown-link"));
    var container = btn.closest(".nav-dropdown");

    function setOpen(open, focus) {
      menu.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      if (open  && focus === "first" && links.length) links[0].focus();
      if (open  && focus === "last"  && links.length) links[links.length - 1].focus();
      if (!open && focus === "trigger") btn.focus();
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = menu.classList.contains("is-open");
      setOpen(!wasOpen, !wasOpen && e.detail === 0 ? "first" : null);
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true, "first"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true, "last"); }
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        var wasOpen = menu.classList.contains("is-open");
        setOpen(!wasOpen, !wasOpen ? "first" : null);
      } else if (e.key === "Escape" && menu.classList.contains("is-open")) {
        e.preventDefault(); setOpen(false, "trigger");
      }
    });

    menu.addEventListener("keydown", function (e) {
      var idx = links.indexOf(document.activeElement);
      if (idx === -1) return;
      if (e.key === "ArrowDown") { e.preventDefault(); links[(idx + 1) % links.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); links[(idx - 1 + links.length) % links.length].focus(); }
      else if (e.key === "Home")   { e.preventDefault(); links[0].focus(); }
      else if (e.key === "End")    { e.preventDefault(); links[links.length - 1].focus(); }
      else if (e.key === "Escape"){ e.preventDefault(); setOpen(false, "trigger"); }
      else if (e.key === " ")     { e.preventDefault(); links[idx].click(); }
    });

    if (container) {
      container.addEventListener("focusout", function (e) {
        if (menu.classList.contains("is-open") && e.relatedTarget && !container.contains(e.relatedTarget)) {
          setOpen(false, null);
        }
      });
    }
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false, null);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false, "trigger");
    });
  }

  /* =========================================================================
     FILTERING
     ========================================================================= */
  function applyFilters() {
    var q       = state.searchQuery.trim().toLowerCase();
    var city    = state.cityFilter;
    var svcs    = state.serviceFilters;
    var feats   = state.featureFilters;

    state.filtered = BRANCHES.filter(function (b) {
      // keyword search
      if (q) {
        var haystack = [b.name, b.city, b.address, b.serviceType].join(" ").toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      // city
      if (city && b.city !== city) return false;
      // service type (OR: any selected must match)
      if (svcs.length && svcs.indexOf(b.serviceType) === -1) return false;
      // features (AND: all selected must be present)
      if (feats.length) {
        for (var i = 0; i < feats.length; i++) {
          if (b.features.indexOf(feats[i]) === -1) return false;
        }
      }
      return true;
    });

    state.currentPage = 1;
    renderAll();
  }

  function readFilters() {
    state.searchQuery = el.locationSearch ? el.locationSearch.value : "";
    state.cityFilter  = el.cityFilter ? el.cityFilter.value : "";
    state.serviceFilters = el.serviceChecks
      .filter(function (c) { return c.checked; })
      .map(function (c) { return c.value; });
    state.featureFilters = el.featureChecks
      .filter(function (c) { return c.checked; })
      .map(function (c) { return c.value; });
  }

  function resetAll() {
    state.searchQuery    = "";
    state.cityFilter     = "";
    state.serviceFilters = [];
    state.featureFilters = [];
    if (el.locationSearch) el.locationSearch.value = "";
    if (el.cityFilter)     el.cityFilter.value     = "";
    el.serviceChecks.forEach(function (c) { c.checked = false; });
    el.featureChecks.forEach(function (c) { c.checked = false; });
    state.filtered = BRANCHES.slice();
    state.currentPage = 1;
    renderAll();
  }

  /* =========================================================================
     MAP RENDERING
     ========================================================================= */
  function renderMapPins() {
    var container = el.mapPins;
    if (!container) return;
    container.innerHTML = "";

    var viewport = document.getElementById("map-viewport");
    var vw = viewport ? viewport.offsetWidth  : 700;
    var vh = viewport ? viewport.offsetHeight : 320;

    var filteredIds = state.filtered.map(function (b) { return b.id; });

    BRANCHES.forEach(function (branch) {
      var pin = document.createElement("button");
      pin.type = "button";
      pin.className = "map-pin";
      pin.setAttribute("data-branch-id", branch.id);
      pin.setAttribute("aria-label", branch.name + " — click for details");

      if (filteredIds.indexOf(branch.id) === -1) {
        pin.classList.add("is-hidden");
      }
      if (branch.id === state.activeBranchId) {
        pin.classList.add("is-selected");
      }

      // position as % of viewport
      var xPx = (branch.map.x / 100) * vw;
      var yPx = (branch.map.y / 100) * vh;
      pin.style.left = xPx + "px";
      pin.style.top  = yPx + "px";

      pin.innerHTML = [
        '<svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">',
        '  <path class="pin-body" d="M12 0C7.03 0 3 4.03 3 9c0 7.5 9 23 9 23s9-15.5 9-23C21 4.03 16.97 0 12 0Z"/>',
        '  <circle class="pin-dot" cx="12" cy="9" r="3.5"/>',
        '</svg>'
      ].join("");

      pin.addEventListener("click", function (e) {
        e.stopPropagation();
        onPinClick(branch.id);
      });
      pin.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPinClick(branch.id);
        }
      });

      container.appendChild(pin);
    });
  }

  function onPinClick(branchId) {
    state.activeBranchId = branchId;
    var branch = BRANCHES.filter(function (b) { return b.id === branchId; })[0];
    if (!branch) return;

    // save preferred
    savePreferred(branchId);
    state.preferredId = branchId;

    // show tooltip
    showTooltip(branch);

    // scroll to branch card & highlight it
    highlightBranchCard(branchId);

    // re-render pins to update selected state
    renderMapPins();
  }

  function showTooltip(branch) {
    if (!el.mapTooltip) return;
    el.tooltipName.textContent    = branch.name;
    el.tooltipAddress.textContent = branch.address;
    el.tooltipStatus.textContent  = branch.hours;
    el.tooltipStatus.className    = "tooltip-status " + (branch.status === "open" ? "is-open" : "is-limited");

    var viewport = document.getElementById("map-viewport");
    var vw = viewport ? viewport.offsetWidth  : 700;
    var vh = viewport ? viewport.offsetHeight : 320;
    var xPx = (branch.map.x / 100) * vw;
    var yPx = (branch.map.y / 100) * vh;

    var tt = el.mapTooltip;
    tt.hidden = false;

    // position: above-right of pin, clamped to viewport
    var ttW = 220, ttH = 90;
    var left = Math.min(xPx + 10, vw - ttW - 8);
    var top  = Math.max(yPx - ttH - 10, 4);
    tt.style.left = left + "px";
    tt.style.top  = top  + "px";
  }

  function hideTooltip() {
    if (el.mapTooltip) el.mapTooltip.hidden = true;
  }

  /* =========================================================================
     BRANCH CARD RENDERING
     ========================================================================= */
  function renderBranchList() {
    var list    = el.branchList;
    var empty   = el.branchEmptyState;
    var badge   = el.branchCountBadge;
    var paginav = el.paginationNav;
    if (!list) return;

    var total = state.filtered.length;
    if (badge) badge.textContent = total;

    if (total === 0) {
      list.innerHTML = "";
      if (empty) empty.hidden = false;
      if (paginav) paginav.hidden = true;
      setResultsStatus("No branches found. Try a different search or clear the filters.");
      return;
    }

    if (empty) empty.hidden = true;
    if (paginav) paginav.hidden = false;

    // paginate
    var totalPages = Math.ceil(total / BRANCHES_PER_PAGE);
    state.currentPage = Math.min(state.currentPage, totalPages);
    var start  = (state.currentPage - 1) * BRANCHES_PER_PAGE;
    var pageItems = state.filtered.slice(start, start + BRANCHES_PER_PAGE);

    setResultsStatus(
      "Showing " + (start + 1) + "–" + Math.min(start + BRANCHES_PER_PAGE, total) +
      " of " + total + " branch" + (total !== 1 ? "es" : "") + "."
    );

    // render cards
    list.innerHTML = "";
    pageItems.forEach(function (branch) {
      var card = document.createElement("article");
      card.className = "branch-card" + (branch.id === state.activeBranchId ? " is-highlighted" : "");
      card.dataset.branchId = branch.id;

      var statusClass = branch.status === "open" ? "is-open" : "is-limited";

      card.innerHTML = [
        '<div class="branch-pin-icon" aria-hidden="true">',
        '  <svg viewBox="0 0 24 24" fill="none">',
        '    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        '    <circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="2"/>',
        '  </svg>',
        '</div>',
        '<div class="branch-info">',
        '  <p class="branch-name">' + esc(branch.name) + '</p>',
        '  <p class="branch-address">' + esc(branch.address) + '</p>',
        '  <div class="branch-meta">',
        '    <span class="status-pill ' + statusClass + '">' + esc(branch.hours) + '</span>',
        '    <span class="service-pill">' + esc(branch.serviceType) + '</span>',
        '  </div>',
        '</div>',
        '<div class="branch-actions">',
        '  <button type="button" class="btn-view-details" data-branch-id="' + branch.id + '">View Details</button>',
        '</div>'
      ].join("");

      list.appendChild(card);
    });

    // bind View Details buttons
    Array.from(list.querySelectorAll(".btn-view-details")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.dataset.branchId);
      });
    });

    renderPagination(totalPages);
  }

  function highlightBranchCard(branchId) {
    // Check if branch is on current page; if not, navigate to its page
    var idx = state.filtered.findIndex(function (b) { return b.id === branchId; });
    if (idx === -1) return;
    var page = Math.floor(idx / BRANCHES_PER_PAGE) + 1;
    if (page !== state.currentPage) {
      state.currentPage = page;
      renderBranchList();
    }

    // scroll to card
    setTimeout(function () {
      var card = document.querySelector('.branch-card[data-branch-id="' + branchId + '"]');
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        card.classList.add("is-highlighted");
      }
    }, 50);
  }

  /* =========================================================================
     PAGINATION
     ========================================================================= */
  function renderPagination(totalPages) {
    var prev    = el.pagePrev;
    var next    = el.pageNext;
    var numbers = el.pageNumbers;
    if (!prev || !next || !numbers) return;

    prev.disabled = state.currentPage === 1;
    next.disabled = state.currentPage === totalPages;

    numbers.innerHTML = "";
    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-btn" + (i === state.currentPage ? " is-active" : "");
      btn.textContent = String(i);
      btn.setAttribute("aria-current", i === state.currentPage ? "page" : "false");
      btn.setAttribute("aria-label", "Page " + i);
      btn.dataset.page = i;
      btn.addEventListener("click", function () {
        state.currentPage = Number(this.dataset.page);
        renderBranchList();
        if (el.branchList) el.branchList.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      numbers.appendChild(btn);
    }
  }

  /* =========================================================================
     MODAL / DRAWER
     ========================================================================= */
  function openModal(branchId) {
    var branch = BRANCHES.filter(function (b) { return b.id === branchId; })[0];
    if (!branch || !el.branchModal) return;
    state.openModalId = branchId;

    el.modalTitle.textContent   = branch.name;
    el.modalCity.textContent    = branch.city;
    el.modalAddress.textContent = branch.address;
    el.modalPhone.textContent   = branch.phone;
    el.modalPhone.href          = "tel:" + branch.phone.replace(/[^+\d]/g, "");
    el.modalHours.textContent   = branch.hours;
    el.modalService.textContent = branch.serviceType;

    var statusClass = branch.status === "open" ? "is-open" : "is-limited";
    el.modalStatus.textContent = branch.hours;
    el.modalStatus.className   = "modal-status-pill " + statusClass;

    // features
    el.modalFeatures.innerHTML = "";
    branch.features.forEach(function (f) {
      var tag = document.createElement("span");
      tag.className = "feature-tag";
      tag.textContent = f;
      el.modalFeatures.appendChild(tag);
    });

    // preferred state
    updateModalPreferredBtn(branch.id);

    // book link
    var bookBtn = id("modal-book-link");
    if (bookBtn) bookBtn.href = "booking.html";

    // show modal
    el.branchModal.hidden = false;
    document.body.style.overflow = "hidden";
    if (el.modalCloseBtn) el.modalCloseBtn.focus();
  }

  function closeModal() {
    if (!el.branchModal) return;
    el.branchModal.hidden = true;
    document.body.style.overflow = "";
    state.openModalId = null;
    if (el.modalPreferredConf) el.modalPreferredConf.hidden = true;
  }

  function updateModalPreferredBtn(branchId) {
    var btn = el.modalSelectBtn;
    if (!btn) return;
    var isPreferred = state.preferredId === branchId;
    btn.textContent = isPreferred ? "✓ Preferred Branch" : "☆ Select as Preferred Branch";
    btn.classList.toggle("is-preferred", isPreferred);
  }

  /* =========================================================================
     RESULTS STATUS
     ========================================================================= */
  function setResultsStatus(msg) {
    if (el.resultsStatus) el.resultsStatus.textContent = msg;
  }

  /* =========================================================================
     MAP ZOOM
     ========================================================================= */
  var MIN_SCALE = 0.6, MAX_SCALE = 2.5;

  function setMapScale(scale) {
    state.mapScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    if (el.mapCanvas) {
      el.mapCanvas.style.transform = "scale(" + state.mapScale + ")";
    }
    if (el.zoomInBtn)  el.zoomInBtn.disabled  = state.mapScale >= MAX_SCALE;
    if (el.zoomOutBtn) el.zoomOutBtn.disabled  = state.mapScale <= MIN_SCALE;
  }

  /* =========================================================================
     STRING HELPERS
     ========================================================================= */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* =========================================================================
     RENDER ALL (map + list)
     ========================================================================= */
  function renderAll() {
    renderMapPins();
    renderBranchList();
  }

  /* =========================================================================
     EVENT BINDINGS
     ========================================================================= */
  function initEvents() {
    // Search
    if (el.searchBtn) {
      el.searchBtn.addEventListener("click", function () {
        readFilters();
        applyFilters();
      });
    }
    if (el.locationSearch) {
      el.locationSearch.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          readFilters();
          applyFilters();
        }
      });
    }

    // Apply / Reset filters
    if (el.applyFiltersBtn) {
      el.applyFiltersBtn.addEventListener("click", function () {
        readFilters();
        applyFilters();
      });
    }
    if (el.resetFiltersBtn) {
      el.resetFiltersBtn.addEventListener("click", resetAll);
    }
    if (el.emptyResetBtn) {
      el.emptyResetBtn.addEventListener("click", resetAll);
    }

    // Pagination prev/next
    if (el.pagePrev) {
      el.pagePrev.addEventListener("click", function () {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderBranchList();
          if (el.branchList) el.branchList.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    if (el.pageNext) {
      el.pageNext.addEventListener("click", function () {
        var totalPages = Math.ceil(state.filtered.length / BRANCHES_PER_PAGE);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderBranchList();
          if (el.branchList) el.branchList.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    // Map zoom
    if (el.zoomInBtn)  el.zoomInBtn.addEventListener("click", function () { setMapScale(state.mapScale + 0.25); });
    if (el.zoomOutBtn) el.zoomOutBtn.addEventListener("click", function () { setMapScale(state.mapScale - 0.25); });

    // Tooltip close
    if (el.tooltipCloseBtn) {
      el.tooltipCloseBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        hideTooltip();
      });
    }

    // Click on map background → close tooltip
    var mapViewport = document.getElementById("map-viewport");
    if (mapViewport) {
      mapViewport.addEventListener("click", function (e) {
        if (!e.target.closest(".map-pin") && !e.target.closest(".map-tooltip")) {
          hideTooltip();
        }
      });
    }

    // Modal close
    if (el.modalCloseBtn) {
      el.modalCloseBtn.addEventListener("click", closeModal);
    }
    if (el.branchModal) {
      el.branchModal.addEventListener("click", function (e) {
        if (e.target === el.branchModal) closeModal();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && el.branchModal && !el.branchModal.hidden) {
        closeModal();
      }
    });

    // Modal: Select as Preferred
    if (el.modalSelectBtn) {
      el.modalSelectBtn.addEventListener("click", function () {
        var branchId = state.openModalId;
        if (!branchId) return;
        savePreferred(branchId);
        state.preferredId = branchId;
        updateModalPreferredBtn(branchId);
        if (el.modalPreferredConf) {
          var branch = BRANCHES.filter(function (b) { return b.id === branchId; })[0];
          el.modalPreferredConf.textContent = "\"" + (branch ? branch.name : branchId) + "\" saved as your preferred pickup branch.";
          el.modalPreferredConf.hidden = false;
        }
      });
    }
  }

  /* =========================================================================
     INIT
     ========================================================================= */
  function init() {
    initNavigation();
    initEvents();
    state.filtered = BRANCHES.slice();
    renderAll();
    setResultsStatus("Showing " + BRANCHES_PER_PAGE + " of " + BRANCHES.length + " branches.");
  }

  init();

})();
