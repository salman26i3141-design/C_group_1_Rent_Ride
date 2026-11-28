/**
 * RentRide Support & Help Shared Navigation Controller
 * Handles mobile menu drawer and keyboard/mouse accessible "More" dropdown.
 */
(function () {
  "use strict";

  const mobileNavToggle = document.getElementById("mobile-nav-toggle");
  const primaryNavigation = document.getElementById("primary-navigation");
  const moreMenuButton = document.getElementById("more-menu-button");
  const moreMenuList = document.getElementById("more-menu-list");

  function initNavigation() {
    if (mobileNavToggle && primaryNavigation) {
      mobileNavToggle.addEventListener("click", function () {
        const isOpen = primaryNavigation.classList.toggle("is-open");
        mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (moreMenuButton && moreMenuList) {
      const dropdownLinks = Array.from(
        moreMenuList.querySelectorAll(".dropdown-link")
      );
      const dropdownContainer = moreMenuButton.closest(".nav-dropdown");

      function setMoreMenuOpen(shouldOpen, focusTarget) {
        moreMenuList.classList.toggle("is-open", shouldOpen);
        moreMenuButton.setAttribute("aria-expanded", String(shouldOpen));

        if (shouldOpen && focusTarget === "first" && dropdownLinks.length > 0) {
          dropdownLinks[0].focus();
        } else if (shouldOpen && focusTarget === "last" && dropdownLinks.length > 0) {
          dropdownLinks[dropdownLinks.length - 1].focus();
        } else if (!shouldOpen && focusTarget === "trigger") {
          moreMenuButton.focus();
        }
      }

      moreMenuButton.addEventListener("click", function (event) {
        event.stopPropagation();
        const currentlyOpen = moreMenuList.classList.contains("is-open");
        const isKeyboardClick = event.detail === 0;
        setMoreMenuOpen(!currentlyOpen, !currentlyOpen && isKeyboardClick ? "first" : null);
      });

      moreMenuButton.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMoreMenuOpen(true, "first");
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setMoreMenuOpen(true, "last");
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          const currentlyOpen = moreMenuList.classList.contains("is-open");
          setMoreMenuOpen(!currentlyOpen, !currentlyOpen ? "first" : null);
        } else if (event.key === "Escape") {
          if (moreMenuList.classList.contains("is-open")) {
            event.preventDefault();
            setMoreMenuOpen(false, "trigger");
          }
        }
      });

      moreMenuList.addEventListener("keydown", function (event) {
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
            moreMenuList.classList.contains("is-open") &&
            event.relatedTarget &&
            !dropdownContainer.contains(event.relatedTarget)
          ) {
            setMoreMenuOpen(false, null);
          }
        });
      }

      document.addEventListener("click", function (event) {
        if (
          !moreMenuList.contains(event.target) &&
          !moreMenuButton.contains(event.target)
        ) {
          setMoreMenuOpen(false, null);
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && moreMenuList.classList.contains("is-open")) {
          setMoreMenuOpen(false, "trigger");
        }
      });
    }
  }

  initNavigation();
})();
