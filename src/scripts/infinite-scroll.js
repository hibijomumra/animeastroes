/**
 * @module InfiniteScroll
 * @description Implements infinite scrolling functionality by dynamically fetching
 *              and appending content to the page as the user scrolls.
 */

import { fetchData } from "../utils/api.js";

/**
 * Intersection observer used to detect when to load more content.
 * @type {IntersectionObserver|null}
 */
export let observer = null;

/**
 * Current page number used for pagination (initially set to 2).
 * @type {number}
 */
export let currentPage = 2;

/**
 * Indicates if data is currently being fetched.
 * @type {boolean}
 */
export let isLoading = false;

/**
 * Flag indicating whether there is a next page available.
 * @type {boolean}
 */
export let hasNextPage = true;

/**
 * Initializes the infinite scroll functionality.
 *
 * This function sets up the required DOM elements, creates a loading indicator,
 * and initializes an IntersectionObserver that triggers data loading when the
 * user scrolls near the bottom of the content area.
 *
 * @param {string} endpoint - The API endpoint URL used to fetch data.
 */
export function initInfiniteScroll(endpoint) {
  // Reset pagination and state variables.
  currentPage = 2;
  isLoading = false;
  hasNextPage = true;

  const content = document.getElementById("content");
  const skeletons = document.querySelectorAll("#loading");
  const template = document.getElementById("card-template");

  // Validate that necessary DOM elements exist.
  if (!content || !skeletons.length || !template) {
    console.error(
      "Infinite scroll initialization failed: Make sure if u change some id element u also edit the JSHT bruh",
    );
    return;
  }

  // Choose the last skeleton as the loading indicator target.
  let loadingIndicator = skeletons[skeletons.length - 1];

  /**
   * Removes excess child elements from the content container to improve performance.
   *
   * Prevents the page from accumulating too many DOM elements, which is important
   * for performance on devices with limited resources.
   */
  function cleanUpDOM() {
    const THRESHOLD_ITEMS = 100;
    while (content.children.length > THRESHOLD_ITEMS) {
      content.removeChild(content.firstChild);
    }
  }

  /**
   * Creates and returns a card element populated with the given item data.
   *
   * Clones a pre-defined template and updates its image, title, link, and additional
   * info (such as episode, type, or status) based on the provided item object.
   *
   * @param {Object} item - The data object for a single card.
   * @param {string} [item.image] - URL of the image to display.
   * @param {string} [item.title] - Title text for the card.
   * @param {string} [item.episode] - Episode information (used to construct query parameters).
   * @param {string} [item.link] - Optional link URL; if not provided, a default is constructed.
   * @param {number|string} [item.id] - Unique identifier used in constructing a default link.
   * @param {string} [item.slug] - Slug used in constructing a default link.
   * @param {string} [item.type] - Additional type information.
   * @param {string} [item.status] - Additional status information.
   * @returns {HTMLElement} The populated card element.
   */
  function createCard(item) {
    const cardFragment = template.content.cloneNode(true);
    const card = cardFragment.querySelector(".card");

    const img = card.querySelector("img");
    img.src = item.image || "placeholder.jpg";
    img.alt = item.title || "No Title";

    const titleElem = card.querySelector("h3");
    titleElem.textContent = item.title || "No Title";

    const episode = item.episode
      ? `?episode=${item.episode.split(" ")[1]?.split("/")[0]}`
      : "";
    const linkTo = item.link
      ? item.link
      : `/watch/${item.id}/${item.slug}${episode}`;
    const link = card.querySelector("a");
    link.href = linkTo;

    const infoElem = card.querySelector("p");
    infoElem.textContent = item.episode || item.type || item.status || "";

    return card;
  }

  /**
   * Loads additional data from the API and appends new cards to the content.
   *
   * Sets the loading state to true, fetches data for the specified page, and for
   * each result, creates a card and inserts it before the loading indicator. If no
   * further data is available, disconnects the observer and replaces the loading
   * indicator with a fallback card.
   *
   * @async
   * @param {number} page - The page number to load.
   * @returns {Promise<void>}
   */
  async function loadMoreData(page) {
    isLoading = true;
    const data = await fetchData(endpoint, page);

    if (data && Array.isArray(data.results)) {
      data.results.forEach((item) => {
        content.insertBefore(createCard(item), loadingIndicator);
      });
      cleanUpDOM();
    }

    if (data?.pagination?.[0]?.next) {
      hasNextPage = true;
    } else {
      hasNextPage = false;
      if (observer) {
        observer.disconnect();
      }
      // Display a fallback card when no more data is available.
      const noMoreDataCard = createCard({
        image:
          "https://raw.githubusercontent.com/mitsuav/resources/refs/heads/main/wallpaper.webp",
        title: "AnimEZ",
        link: "https://animeastroes.pages.dev",
        episode: "Mitsuaa",
        type: "",
        status: "",
      });
      content.replaceChild(noMoreDataCard, loadingIndicator);
    }
    isLoading = false;
  }

  // Disconnect any existing observer before setting up a new one.
  if (observer) {
    observer.disconnect();
  }

  // Create an IntersectionObserver that triggers data loading when the loading indicator is visible.
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoading && hasNextPage) {
          currentPage++;
          loadMoreData(currentPage);
        }
      });
    },
    { rootMargin: "0px 0px 100px 0px" },
  );

  // Optionally expose the observer on the window for debugging.
  window.__infiniteScrollObserver = observer;

  // Load the initial data and start observing the loading indicator.
  loadMoreData(currentPage);
  observer.observe(loadingIndicator);
}

// If you are Dizzy after seeing this, I suggest you to take a rest and keep scroll Fesnuk
