/**
 * RentRide FAQ & Rental Eligibility Controller
 * Vanilla JS implementation for FAQ rendering, live search, category filtering,
 * keyboard-accessible accordions, navigation menus, and age eligibility validation.
 */
(function () {
  "use strict";

  const FAQ_ITEMS = [
    {
      id: "faq-documents",
      category: "Eligibility",
      question: "What documents are required to rent a vehicle?",
      answer:
        "You must present a valid full driver's license held for at least 12 months, a government-issued photo ID or passport, and a credit or debit card in the primary driver's name for the security deposit.",
      policyNote:
        "International renters whose license is not in English must also carry a valid International Driving Permit (IDP)."
    },
    {
      id: "faq-age-rules",
      category: "Eligibility",
      question: "What is the minimum and maximum age to rent a car with RentRide?",
      answer:
        "Drivers must be at least 21 years old to rent Economy, Compact, or Standard Sedan vehicles. Drivers aged 25 and above can book any vehicle class including SUVs, Luxury cars, and Vans with no young-driver surcharge.",
      policyNote:
        "Drivers aged 21–24 incur a daily Young Driver Surcharge and are restricted from Luxury and Specialty classes."
    },
    {
      id: "faq-booking-modify",
      category: "Booking",
      question: "How do I book a vehicle or modify my pickup time?",
      answer:
        "Select your pickup location, dates, and preferred vehicle on the Booking page. To change your pickup time, return location, or add-ons later, open My Account and select Modify Reservation at least 12 hours before pickup.",
      policyNote: null
    },
    {
      id: "faq-booking-grace",
      category: "Booking",
      question: "What happens if my flight or arrival is delayed?",
      answer:
        "We hold your reserved vehicle for up to 2 hours after your scheduled pickup time at city branches, and up to 4 hours at airport counters when you provide your flight number during booking.",
      policyNote: null
    },
    {
      id: "faq-payment-methods",
      category: "Payments",
      question: "Which payment methods and deposits are accepted?",
      answer:
        "RentRide accepts major credit cards (Visa, Mastercard, American Express) and verified debit cards. A refundable security hold between $200 and $500 depending on vehicle class is authorized at pickup and released within 3–5 business days after return.",
      policyNote:
        "Prepaid gift cards and cash are not accepted for the refundable security deposit."
    },
    {
      id: "faq-payment-fuel",
      category: "Payments",
      question: "Are taxes, mileage, and fuel included in the rental quote?",
      answer:
        "Every quote displays base rental rates, mandatory local taxes, and unlimited mileage for standard bookings. Vehicles follow a Full-to-Full fuel policy—return the tank full to avoid refueling service charges.",
      policyNote: null
    },
    {
      id: "faq-cancellation-free",
      category: "Cancellation",
      question: "Can I cancel my booking for free?",
      answer:
        "Yes. Standard bookings canceled at least 24 hours before the scheduled pickup time receive a 100% refund to the original payment method.",
      policyNote:
        "Cancellations within 24 hours of pickup or no-shows are subject to a 1-day rental cancellation fee."
    },
    {
      id: "faq-cancellation-early",
      category: "Cancellation",
      question: "Do I get a refund if I return the car early?",
      answer:
        "Unused full rental days on Pay-at-Counter bookings are recalculated at the applicable daily rate. Prepaid discounted bookings are non-refundable for early returns unless covered by our Flexible Return add-on.",
      policyNote: null
    },
    {
      id: "faq-insurance-included",
      category: "Insurance",
      question: "What insurance coverage is included with every rental?",
      answer:
        "All RentRide vehicles include Third-Party Liability coverage and basic Collision Damage Waiver (CDW) with a standard deductible. You can upgrade to Zero-Deductible Protection or Roadside Plus on the Add-ons page.",
      policyNote: null
    },
    {
      id: "faq-insurance-personal",
      category: "Insurance",
      question: "Can I use my personal auto insurance or credit card coverage?",
      answer:
        "Yes. You may decline optional RentRide protection upgrades if your personal policy or credit card explicitly covers rental vehicles in your travel region. Proof of active coverage may be requested at pickup.",
      policyNote:
        "Personal policies rarely cover off-road damage, lost keys, or unauthorized additional drivers."
    }
  ];

  const state = {
    activeCategory: "All",
    searchQuery: "",
    openIds: new Set(["faq-documents"])
  };

  const elements = {
    accordionList: document.getElementById("faq-accordion-list"),
    emptyState: document.getElementById("faq-empty-state"),
    resultsStatus: document.getElementById("faq-results-status"),
    searchInput: document.getElementById("faq-search"),
    searchClearBtn: document.getElementById("search-clear-btn"),
    filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
    resetFiltersBtn: document.getElementById("reset-filters-btn"),
    eligibilityForm: document.getElementById("eligibility-form"),
    ageInput: document.getElementById("driver-age-input"),
    eligibilityResult: document.getElementById("eligibility-result"),
    mobileNavToggle: document.getElementById("mobile-nav-toggle"),
    primaryNavigation: document.getElementById("primary-navigation"),
    moreMenuButton: document.getElementById("more-menu-button"),
    moreMenuList: document.getElementById("more-menu-list")
  };

  /**
   * Filter FAQ items using current category and search query.
   */
  function getFilteredFaqs() {
    const normalizedQuery = state.searchQuery.trim().toLowerCase();

    return FAQ_ITEMS.filter(function (item) {
      const matchesCategory =
        state.activeCategory === "All" || item.category === state.activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        item.question,
        item.answer,
        item.category,
        item.policyNote || ""
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }

  /**
   * Build a single accessible accordion item DOM element.
   */
  function createAccordionItem(item) {
    const isOpen = state.openIds.has(item.id);
    const panelId = item.id + "-panel";
    const buttonId = item.id + "-trigger";

    const article = document.createElement("article");
    article.className = "faq-item" + (isOpen ? " is-open" : "");
    article.dataset.faqId = item.id;

    const heading = document.createElement("h3");
    heading.className = "faq-item-heading";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "faq-trigger";
    trigger.id = buttonId;
    trigger.setAttribute("aria-expanded", String(isOpen));
    trigger.setAttribute("aria-controls", panelId);

    const metaWrapper = document.createElement("span");
    metaWrapper.className = "faq-question-meta";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "faq-category-tag";
    categoryBadge.textContent = item.category;

    const questionText = document.createElement("span");
    questionText.textContent = item.question;

    metaWrapper.appendChild(categoryBadge);
    metaWrapper.appendChild(questionText);

    const symbol = document.createElement("span");
    symbol.className = "faq-toggle-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = isOpen ? "-" : "+";

    trigger.appendChild(metaWrapper);
    trigger.appendChild(symbol);
    heading.appendChild(trigger);

    const panel = document.createElement("div");
    panel.className = "faq-panel";
    panel.id = panelId;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", buttonId);
    panel.hidden = !isOpen;

    const answerPara = document.createElement("p");
    answerPara.className = "faq-answer";
    answerPara.textContent = item.answer;
    panel.appendChild(answerPara);

    if (item.policyNote) {
      const notePara = document.createElement("p");
      notePara.className = "faq-policy-note";
      notePara.textContent = "Policy Notice: " + item.policyNote;
      panel.appendChild(notePara);
    }

    trigger.addEventListener("click", function () {
      toggleAccordionItem(item.id);
    });

    trigger.addEventListener("keydown", handleAccordionKeydown);

    article.appendChild(heading);
    article.appendChild(panel);
    return article;
  }

  /**
   * Toggle an FAQ accordion item open/closed without full re-render so focus stays put.
   */
  function toggleAccordionItem(faqId) {
    const shouldOpen = !state.openIds.has(faqId);
    if (shouldOpen) {
      state.openIds.add(faqId);
    } else {
      state.openIds.delete(faqId);
    }

    const article = elements.accordionList.querySelector(
      '[data-faq-id="' + faqId + '"]'
    );
    if (!article) {
      return;
    }

    const trigger = article.querySelector(".faq-trigger");
    const panel = article.querySelector(".faq-panel");
    const symbol = article.querySelector(".faq-toggle-symbol");

    article.classList.toggle("is-open", shouldOpen);
    trigger.setAttribute("aria-expanded", String(shouldOpen));
    panel.hidden = !shouldOpen;
    symbol.textContent = shouldOpen ? "-" : "+";
  }

  /**
   * Keyboard navigation between visible FAQ accordion triggers (ArrowUp, ArrowDown, Home, End).
   */
  function handleAccordionKeydown(event) {
    const triggers = Array.from(
      elements.accordionList.querySelectorAll(".faq-trigger")
    );
    const currentIndex = triggers.indexOf(event.currentTarget);
    if (currentIndex === -1 || triggers.length === 0) {
      return;
    }

    let nextIndex = null;
    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % triggers.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = triggers.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      triggers[nextIndex].focus();
    }
  }

  /**
   * Render filtered FAQ items and update status text / empty state.
   */
  function renderFaqs() {
    const filtered = getFilteredFaqs();
    elements.accordionList.innerHTML = "";

    if (filtered.length === 0) {
      elements.emptyState.hidden = false;
      elements.resultsStatus.textContent =
        "Showing 0 questions" +
        (state.activeCategory !== "All" ? " in " + state.activeCategory : "") +
        ".";
      return;
    }

    elements.emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    filtered.forEach(function (item) {
      fragment.appendChild(createAccordionItem(item));
    });
    elements.accordionList.appendChild(fragment);

    const label = filtered.length === 1 ? "question" : "questions";
    elements.resultsStatus.textContent =
      "Showing " +
      filtered.length +
      " " +
      label +
      (state.activeCategory !== "All" ? " in " + state.activeCategory : "") +
      (state.searchQuery.trim() ? ' matching "' + state.searchQuery.trim() + '"' : "") +
      ".";
  }

  /**
   * Update active category button and re-render list.
   */
  function setCategory(category) {
    state.activeCategory = category;
    elements.filterButtons.forEach(function (btn) {
      const isSelected = btn.dataset.category === category;
      btn.classList.toggle("is-active", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    });
    renderFaqs();
  }

  /**
   * Render eligibility result box with accessible status styling.
   */
  function renderEligibilityResult(variant, badgeText, summaryText, detailsList) {
    const container = elements.eligibilityResult;
    container.className = "eligibility-result " + variant;
    container.innerHTML = "";

    const badge = document.createElement("span");
    badge.className = "eligibility-badge";
    badge.textContent = badgeText;

    const message = document.createElement("p");
    message.className = "eligibility-message";
    message.textContent = summaryText;

    container.appendChild(badge);
    container.appendChild(message);

    if (Array.isArray(detailsList) && detailsList.length > 0) {
      const list = document.createElement("ul");
      list.className = "eligibility-details";
      detailsList.forEach(function (detail) {
        const li = document.createElement("li");
        li.textContent = detail;
        list.appendChild(li);
      });
      container.appendChild(list);
    }
  }

  /**
   * Evaluate rental age and coverage eligibility from raw input string.
   */
  function evaluateEligibility(rawValue) {
    const trimmed = rawValue.trim();

    if (trimmed === "") {
      renderEligibilityResult(
        "is-warning",
        "Input Required",
        "Please enter your age to check rental and coverage eligibility.",
        ["Minimum self-drive rental age at RentRide is 21 years."]
      );
      elements.ageInput.focus();
      return;
    }

    const parsedAge = Number(trimmed);

    if (!Number.isFinite(parsedAge) || !Number.isInteger(parsedAge)) {
      renderEligibilityResult(
        "is-warning",
        "Invalid Format",
        "Please enter a whole number for your age (for example, 25).",
        []
      );
      elements.ageInput.focus();
      return;
    }

    if (parsedAge < 0) {
      renderEligibilityResult(
        "is-warning",
        "Invalid Age",
        "Age cannot be negative. Please enter a valid positive age.",
        ["Minimum self-drive rental age at RentRide is 21 years."]
      );
      elements.ageInput.focus();
      return;
    }

    if (parsedAge === 0 || parsedAge > 110) {
      renderEligibilityResult(
        "is-warning",
        "Check Input",
        "Please enter a realistic driver age between 1 and 110.",
        []
      );
      elements.ageInput.focus();
      return;
    }

    if (parsedAge < 18) {
      renderEligibilityResult(
        "is-ineligible",
        "Not Eligible (Under 18)",
        "Drivers aged " + parsedAge + " are not eligible to rent or drive a RentRide vehicle.",
        [
          "You must hold a full driver's license and be at least 21 years old to book a self-drive rental."
        ]
      );
      return;
    }

    if (parsedAge < 21) {
      renderEligibilityResult(
        "is-ineligible",
        "Under Minimum Rental Age (18–20)",
        "At age " + parsedAge + ", you do not meet RentRide's minimum self-drive rental age of 21.",
        [
          "Self-drive rentals require the primary driver to be at least 21 years old.",
          "An eligible driver aged 21+ may book and serve as the primary contract holder."
        ]
      );
      return;
    }

    if (parsedAge <= 24) {
      renderEligibilityResult(
        "is-warning",
        "Eligible — Young Driver Policy (21–24)",
        "You are eligible to rent Economy, Compact, and Standard Sedan vehicles.",
        [
          "A Young Driver Surcharge applies daily at checkout.",
          "Includes basic Third-Party Liability and standard CDW coverage; SUVs and Luxury vehicles require age 25+."
        ]
      );
      return;
    }

    if (parsedAge <= 75) {
      renderEligibilityResult(
        "is-valid",
        "Fully Eligible (25+)",
        "Great news! At age " + parsedAge + ", you qualify for all RentRide vehicle classes with no young-driver surcharge.",
        [
          "Eligible classes: Economy, Sedan, SUV, Luxury, and Passenger Vans.",
          "Coverage: Standard Liability + CDW included, with optional Zero-Deductible Protection available."
        ]
      );
      return;
    }

    renderEligibilityResult(
      "is-valid",
      "Eligible — Senior Driver Verification (76+)",
      "At age " + parsedAge + ", you are eligible for Economy, Sedan, and standard SUV rentals.",
      [
        "A current valid driver's license and local renewal/fitness documentation (where required by regional law) must be presented at pickup.",
        "Full Liability and optional Zero-Deductible coverage are available."
      ]
    );
  }

  /**
   * Setup header mobile drawer and "More" dropdown menu with mouse and full keyboard navigation.
   */
  function initNavigation() {
    if (elements.mobileNavToggle && elements.primaryNavigation) {
      elements.mobileNavToggle.addEventListener("click", function () {
        const isOpen = elements.primaryNavigation.classList.toggle("is-open");
        elements.mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (elements.moreMenuButton && elements.moreMenuList) {
      const dropdownLinks = Array.from(
        elements.moreMenuList.querySelectorAll(".dropdown-link")
      );
      const dropdownContainer = elements.moreMenuButton.closest(".nav-dropdown");

      function setMoreMenuOpen(shouldOpen, focusTarget) {
        elements.moreMenuList.classList.toggle("is-open", shouldOpen);
        elements.moreMenuButton.setAttribute("aria-expanded", String(shouldOpen));

        if (shouldOpen && focusTarget === "first" && dropdownLinks.length > 0) {
          dropdownLinks[0].focus();
        } else if (shouldOpen && focusTarget === "last" && dropdownLinks.length > 0) {
          dropdownLinks[dropdownLinks.length - 1].focus();
        } else if (!shouldOpen && focusTarget === "trigger") {
          elements.moreMenuButton.focus();
        }
      }

      elements.moreMenuButton.addEventListener("click", function (event) {
        event.stopPropagation();
        const currentlyOpen = elements.moreMenuList.classList.contains("is-open");
        const isKeyboardClick = event.detail === 0;
        setMoreMenuOpen(!currentlyOpen, !currentlyOpen && isKeyboardClick ? "first" : null);
      });

      elements.moreMenuButton.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMoreMenuOpen(true, "first");
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setMoreMenuOpen(true, "last");
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          const currentlyOpen = elements.moreMenuList.classList.contains("is-open");
          setMoreMenuOpen(!currentlyOpen, !currentlyOpen ? "first" : null);
        } else if (event.key === "Escape") {
          if (elements.moreMenuList.classList.contains("is-open")) {
            event.preventDefault();
            setMoreMenuOpen(false, "trigger");
          }
        }
      });

      elements.moreMenuList.addEventListener("keydown", function (event) {
        const currentIndex = dropdownLinks.indexOf(document.activeElement);
        if (currentIndex === -1) {
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          dropdownLinks[(currentIndex + 1) % dropdownLinks.length].focus();
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          dropdownLinks[
            (currentIndex - 1 + dropdownLinks.length) % dropdownLinks.length
          ].focus();
        } else if (event.key === "Home") {
          event.preventDefault();
          dropdownLinks[0].focus();
        } else if (event.key === "End") {
          event.preventDefault();
          dropdownLinks[dropdownLinks.length - 1].focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          setMoreMenuOpen(false, "trigger");
        } else if (event.key === " ") {
          event.preventDefault();
          dropdownLinks[currentIndex].click();
        }
      });

      if (dropdownContainer) {
        dropdownContainer.addEventListener("focusout", function (event) {
          if (
            elements.moreMenuList.classList.contains("is-open") &&
            event.relatedTarget &&
            !dropdownContainer.contains(event.relatedTarget)
          ) {
            setMoreMenuOpen(false, null);
          }
        });
      }

      document.addEventListener("click", function (event) {
        if (
          !elements.moreMenuList.contains(event.target) &&
          !elements.moreMenuButton.contains(event.target)
        ) {
          setMoreMenuOpen(false, null);
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && elements.moreMenuList.classList.contains("is-open")) {
          setMoreMenuOpen(false, "trigger");
        }
      });
    }
  }

  /**
   * Bind search, filter, reset, and eligibility events.
   */
  function initEvents() {
    elements.searchInput.addEventListener("input", function (event) {
      state.searchQuery = event.target.value;
      elements.searchClearBtn.hidden = state.searchQuery.length === 0;
      renderFaqs();
    });

    elements.searchClearBtn.addEventListener("click", function () {
      state.searchQuery = "";
      elements.searchInput.value = "";
      elements.searchClearBtn.hidden = true;
      renderFaqs();
      elements.searchInput.focus();
    });

    elements.filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setCategory(button.dataset.category);
      });
    });

    elements.resetFiltersBtn.addEventListener("click", function () {
      state.searchQuery = "";
      elements.searchInput.value = "";
      elements.searchClearBtn.hidden = true;
      setCategory("All");
      elements.searchInput.focus();
    });

    elements.eligibilityForm.addEventListener("submit", function (event) {
      event.preventDefault();
      evaluateEligibility(elements.ageInput.value);
    });
  }

  function init() {
    initNavigation();
    initEvents();
    renderFaqs();
  }

  init();
})();
