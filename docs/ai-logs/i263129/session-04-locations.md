 Copy the exact shared header (including the 15-page "More" dropdown, icons, and "Book Now" button) and footer
  from pages/faq.html (or pages/support.html) into pages/locations.html without changing their structure, links, or
  styling. Build out the main content of pages/locations.html, css/locations.css, and js/locations.js matching the
  layout of my Pickup Locations wireframe prototype and our established RentRide design system (dark navy #0F172A,
  teal #0D9488, white #FFFFFF, light grey #F1F5F9, Poppins headings, Inter body text, clean semantic HTML, and
  relative paths).
  
  Include the following sections and interactive features:
  
  Breadcrumb, Hero Title & Top Search Bar:
  
  Breadcrumb at the top left: Home > Pickup Locations (linking Home to ../index.html).
  
  Left-aligned hero heading Pickup Locations with subtitle "Find our branches near you and choose the most
  convenient location." paired on the right with a keyword search input (Search locations...) and Search button.
  
  2-Column Main Layout (Left Filter Sidebar + Right Map & Branch Results):
  
  Left Sidebar (Filter Results card):
  
  City dropdown (All Cities, Islamabad, Lahore, Karachi, Rawalpindi, Peshawar).
  
  Service Type checkboxes (Pickup Only, Drop-off Only, Both).
  
  Features checkboxes (24/7 Support, Airport Location, Free Parking).
  
  Full-width Apply Filters button (plus a subtle Reset Filters link/button) that dynamically filters both the
  branch list and the map pins.
  
  Right Column — Interactive Stylized Map Card:
  
  An interactive SVG/CSS stylized city road-and-park map with working + / - zoom controls and clickable location
  pins corresponding to the filtered branches.
  
  Clicking any map pin highlights that branch card below, displays a tooltip/popup with the branch name, address,
  and status (Open • 24/7 or hours), and saves the selected preferred pickup branch in localStorage
  (rentride_preferred_location).
  
  Right Column — JS-Rendered Branch List & Pagination:
  
  Render at least 9 realistic RentRide branches across Pakistan (e.g., Islamabad Main Branch — 123 F-6 Markaz,
  Islamabad Airport Terminal 1, Lahore Central Branch — 45 Mall Road, Lahore Allama Iqbal Airport, Karachi Clifton
  Branch — 789 Clifton Block, Karachi Shahrah-e-Faisal, Rawalpindi Saddar Hub, etc.) from a structured JavaScript
  array in js/locations.js.
  
  Each horizontal branch card displays a location pin icon, branch name, street address, status pill badge (Open •
  24/7 or operating hours), and a View Details button.
  
  Clicking View Details opens an accessible modal/drawer showing full branch details (phone number, exact hours,
  available features, service type, and a Select as Preferred Branch / Book from Here button linking to
  booking.html).
  
  Include working Pagination controls (<, 1, 2, 3, >) showing 3 branches per page with proper disabled/active
  states, keyboard navigation (:focus-visible), and a clear empty-state message if no branches match the
  search/filters.
  
  Responsive Design: Stack the filter sidebar cleanly above the map and branch list on tablet and mobile viewports
  with zero horizontal overflow.

○ Thought for 5.6s (Let me build out the locations page with all the required features. I have all the context...)
● Edited 3 files (locations.html, locations.css, locations.js)
● Ran 2 commands (Set-Location "C:\Use... ×2) (ctrl+o to expand)

  All three files are built and verified. Here's a summary:
  ──────
  Files Created

  **pages/locations.html** — 435 lines
  The diff check confirmed the only differences from faq.html's header are the intentional ones: the page
  <title>, <meta description>, linked CSS/JS files, the comment label, and is-current moved from faq.html to
  locations.html. The footer is byte-for-byte identical to faq.html. All 20 element IDs referenced by
  getElementById in the JS are present in the HTML.
  Sections built:

  • Home > Pickup Locations breadcrumb
  • Left-aligned hero + right-side search bar (keyword <input> + Search button)
  • Filter sidebar — city dropdown, service type checkboxes (3), features checkboxes (3), Apply + Reset buttons
  • SVG stylized map with roads, parks, city blocks, +/− zoom controls, 11 clickable pins, and a dismissable
  tooltip
  • JS-rendered branch list (3 per page) with pin icon, name, address, status pill, service pill, View Details
  button
  • Accessible detail modal/drawer (slides from right) with phone, hours, features, service type, Select as
  Preferred, Book from Here
  • Pagination (‹ 1 2 3 4 ›) with disabled states and keyboard focus

  **css/locations.css** — 707 lines
  Full design system compliance — navy/teal/white/grey palette, Poppins headings, Inter body, custom CSS
  checkboxes, map pin animations, modal slide-in keyframe, 3 responsive breakpoints (1000px stacks sidebar
  tighter, 860px stacks to 1-column + mobile nav, 600px collapses branch cards).

  **js/locations.js** — 807 lines

  • 11 branch entries across Islamabad (2), Lahore (3), Karachi (3), Rawalpindi (2), Peshawar (1)
  • Full shared nav controller (mobile drawer + More dropdown, Arrow/Home/End/Escape keyboard navigation)
  • applyFilters() — keyword + city + serviceType + features (AND logic for features, OR for service)
  • Map pin rendering positioned by % coordinates, click → tooltip + card highlight + localStorage save
  • Branch cards rendered from filtered slice, paginated 3/page
  • Pagination prev/next + number buttons with aria-current
  • Modal open/close with Escape key, focus trap on close button, preferred branch persistence under
  rentride_preferred_location
