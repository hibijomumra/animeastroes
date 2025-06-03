// watch.js
import {
  VidstackPlayer,
  VidstackPlayerLayout,
} from "https://cdn.vidstack.io/player";
import { fetchWatchData } from "../utils/api.js";

/**
 * @fileoverview Handles the watch page functionality including fetching video data,
 * creating and updating the video player, and managing episode navigation.
 */

/**
 * The current instance of the video player.
 * @type {Object|null}
 */
let playerInstance = null;

/**
 * Indicates whether the watch page is active.
 * @type {boolean}
 */
let pageActive = true;

/**
 * Stores the current AbortController for cancelling pending API requests.
 * @type {AbortController|null}
 */
let currentAbortController = null;

/**
 * Navigation data for episodes fetched from the API.
 * Typically an array where the previous and next episodes are stored.
 * @type {Object|null}
 */
let navData = null;

/**
 * Extracts the video ID and slug from the URL pathname.
 *
 * The URL is split by "/" and the expected ID and slug are located at index 2 and 3.
 *
 * @returns {{id: string, slug: string}} An object containing the id and slug.
 */
function getIdAndSlug() {
  const parts = window.location.pathname.split("/");
  return { id: parts[2], slug: parts[3] };
}

/**
 * Retrieves the current episode number from an input element.
 *
 * @param {HTMLInputElement} episodeInput - The input element containing the episode number.
 * @returns {number} The episode number.
 */
function getEpisode(episodeInput) {
  return Number(episodeInput.value);
}

/**
 * Fetches watch data from the API for the current video using the provided episode input.
 *
 * If a previous API request is pending, it aborts that request before initiating a new one.
 *
 * @async
 * @param {HTMLInputElement} episodeInput - The input element containing the episode number.
 * @returns {Promise<Object|null>} The fetched data object or null if an error occurs.
 */
async function fetchWatchApi(episodeInput) {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  const { id, slug } = getIdAndSlug();
  const episode = getEpisode(episodeInput);
  try {
    const data = await fetchWatchData(id, slug, episode);
    return data;
  } catch (error) {
    console.error("Error fetching watch data:", error);
    return null;
  }
}

/**
 * Creates and initializes the video player if valid video data exists.
 *
 * If the page is inactive or hidden, the function returns early.
 * When video data is available, it hides the player information element,
 * displays the player container, and creates a player instance using VidstackPlayer.
 * Otherwise, it updates the player info element with a message indicating the video is unavailable.
 *
 * @async
 * @param {Object} data - The watch data object returned from the API.
 * @param {HTMLElement} playerInfo - The element used to display player information or error messages.
 * @param {HTMLElement} playerContainer - The container element where the video player is rendered.
 * @returns {Promise<Object|null>} The video player instance or null if creation failed.
 */
async function createPlayer(data, playerInfo, playerContainer) {
  if (!pageActive || document.visibilityState === "hidden") return null;
  if (data && data.video?.[0]?.src) {
    playerInfo.classList.add("hidden");
    playerContainer.classList.remove("hidden");

    const player = await VidstackPlayer.create({
      target: "#player",
      title: data.title,
      src: data.video.map((video) => ({
        src: video.src,
        type: "video/mp4",
        size: video.size,
      })),
      layout: new VidstackPlayerLayout(),
    });
    return player;
  } else {
    playerInfo.innerHTML =
      "Video belum tersedia, mungkin sedang proses upload. Silahkan coba lagi nanti. Jika masalah berlanjut, silahkan hubungi mitsuaa.";
    return null;
  }
}

/**
 * Removes any video elements inside the player container.
 *
 * Iterates over each <video> element within the element with ID "player",
 * pauses them, clears their source, reloads, and then removes them from the DOM.
 */
function removeVideoElements() {
  const videoElements = document.querySelectorAll("#player video");
  videoElements.forEach((video) => {
    video.pause();
    video.src = "";
    video.load();
    video.remove();
  });
}

/**
 * Destroys the current video player instance and cleans up related DOM elements.
 *
 * This function sets the page as inactive, pauses the video if possible, destroys the player instance,
 * removes any existing <media-player> elements, cleans up video elements, and aborts any pending API requests.
 */
function destroyPlayer() {
  pageActive = false;
  if (playerInstance) {
    if (typeof playerInstance.pause === "function") {
      playerInstance.pause();
    } else {
      const videoEl = document.querySelector("#player video");
      if (videoEl) videoEl.pause();
    }
    playerInstance.destroy();
    playerInstance = null;
  }
  const existingPlayer = document.querySelector("media-player");
  if (existingPlayer) {
    existingPlayer.remove();
  }
  removeVideoElements();
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

/**
 * Updates the video player and episode navigation UI based on the current episode.
 *
 * This function fetches updated watch data, logs the navigation data from the API,
 * and then updates the previous and next buttons based on available navigation info.
 * Finally, it creates a new video player instance with the fetched data.
 *
 * @async
 * @param {HTMLInputElement} episodeInput - The input element containing the episode number.
 * @param {HTMLElement} prevButton - The button element for navigating to the previous episode.
 * @param {HTMLElement} nextButton - The button element for navigating to the next episode.
 * @param {HTMLElement} currentEpButton - The element displaying the current episode.
 * @param {HTMLElement} playerInfo - The element used to display player information.
 * @param {HTMLElement} playerContainer - The container element where the video player is rendered.
 * @returns {Promise<void>}
 */
async function updatePlayer(
  episodeInput,
  prevButton,
  nextButton,
  currentEpButton,
  playerInfo,
  playerContainer,
) {
  const data = await fetchWatchApi(episodeInput);
  if (!pageActive || document.visibilityState === "hidden") return;

  console.log("navData dari API:", data.nav);
  navData = data.nav;
  const currentEpisode = getEpisode(episodeInput);

  // Update previous button state based on nav data.
  if (navData && navData[0] && navData[0].episode) {
    if (currentEpisode === Number(navData[0].episode)) {
      prevButton.disabled = true;
      prevButton.classList.add("btn-disable");
    } else {
      prevButton.disabled = false;
      prevButton.classList.remove("btn-disable");
    }
  } else {
    prevButton.disabled = true;
    prevButton.classList.add("btn-disable");
  }

  // Update next button state based on nav data.
  if (navData && navData[2] && navData[2].episode) {
    if (currentEpisode === Number(navData[2].episode)) {
      nextButton.disabled = true;
      nextButton.classList.add("btn-disable");
    } else {
      nextButton.disabled = false;
      nextButton.classList.remove("btn-disable");
    }
  } else {
    nextButton.disabled = true;
    nextButton.classList.add("btn-disable");
  }

  playerInstance = await createPlayer(data, playerInfo, playerContainer);
}

/**
 * Updates the video player for a new episode.
 *
 * This function first destroys the current player, updates the UI to show a loading state,
 * changes the URL to reflect the new episode, and then re-initializes the player.
 *
 * @async
 * @param {number|string} newEpisode - The new episode number to update to.
 * @param {HTMLInputElement} episodeInput - The input element containing the episode number.
 * @param {HTMLElement} prevButton - The button element for navigating to the previous episode.
 * @param {HTMLElement} nextButton - The button element for navigating to the next episode.
 * @param {HTMLElement} currentEpButton - The element displaying the current episode.
 * @param {HTMLElement} playerInfo - The element used to display player information.
 * @param {HTMLElement} playerContainer - The container element where the video player is rendered.
 * @returns {Promise<void>}
 */
async function updateEpisode(
  newEpisode,
  episodeInput,
  prevButton,
  nextButton,
  currentEpButton,
  playerInfo,
  playerContainer,
) {
  destroyPlayer();
  playerInfo.classList.remove("hidden");
  playerContainer.classList.add("hidden");
  playerInfo.innerHTML = "Loading episode " + newEpisode + "...";
  episodeInput.value = newEpisode;
  currentEpButton.textContent = `Episode ${newEpisode}`;

  // Update the URL to include the new episode parameter.
  const url = new URL(window.location);
  url.searchParams.set("episode", newEpisode);
  window.history.pushState({}, "", url);

  pageActive = true;
  await updatePlayer(
    episodeInput,
    prevButton,
    nextButton,
    currentEpButton,
    playerInfo,
    playerContainer,
  );
}

/**
 * Initializes the watch page video player.
 *
 * If the document is still loading, the initialization is deferred until the DOM is ready.
 * Otherwise, the internal initialization function is called immediately.
 */
export function initWatchPlayer() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _initWatchPlayer);
  } else {
    _initWatchPlayer();
  }
}

/**
 * Internal function to initialize the watch player and set up event listeners.
 *
 * Retrieves necessary DOM elements, fetches the initial watch data, creates the video player,
 * updates episode navigation buttons, and attaches various event listeners to destroy the
 * player on navigation or page unload.
 *
 * @private
 */
function _initWatchPlayer() {
  const prevButton = document.getElementById("prevEpisode");
  const nextButton = document.getElementById("nextEpisode");
  const currentEpButton = document.getElementById("currentEp");
  const episodeInput = document.getElementById("episode");
  const playerInfo = document.getElementById("playerInfo");
  const playerContainer = document.getElementById("player");

  fetchWatchApi(episodeInput).then((data) => {
    if (!pageActive || document.visibilityState === "hidden") return;
    currentEpButton.textContent = "Episode " + getEpisode(episodeInput);
    createPlayer(data, playerInfo, playerContainer).then((player) => {
      if (!pageActive || document.visibilityState === "hidden") return;
      playerInstance = player;
      navData = data.nav;
      const currentEpisode = getEpisode(episodeInput);
      // Update previous button based on navigation data.
      if (navData && navData[0] && navData[0].episode) {
        prevButton.disabled = currentEpisode === Number(navData[0].episode);
        if (prevButton.disabled) {
          prevButton.classList.add("btn-disable");
        } else {
          prevButton.classList.remove("btn-disable");
        }
      } else {
        prevButton.disabled = true;
        prevButton.classList.add("btn-disable");
      }
      // Update next button based on navigation data.
      if (navData && navData[2] && navData[2].episode) {
        nextButton.disabled = currentEpisode === Number(navData[2].episode);
        if (nextButton.disabled) {
          nextButton.classList.add("btn-disable");
        } else {
          nextButton.classList.remove("btn-disable");
        }
      } else {
        nextButton.disabled = true;
        nextButton.classList.add("btn-disable");
      }
    });
  });

  // Attach event listeners to clean up the player on navigation or page unload.
  window.addEventListener("beforeunload", destroyPlayer);
  window.addEventListener("pagehide", destroyPlayer);
  window.addEventListener("popstate", destroyPlayer);
  document.addEventListener("astro:route-change-start", destroyPlayer);

  // Set up click handlers for previous and next episode buttons.
  prevButton.addEventListener("click", () => {
    if (
      navData &&
      navData[0] &&
      navData[0].episode &&
      getEpisode(episodeInput) !== Number(navData[0].episode)
    ) {
      updateEpisode(
        navData[0].episode,
        episodeInput,
        prevButton,
        nextButton,
        currentEpButton,
        playerInfo,
        playerContainer,
      );
    }
  });

  nextButton.addEventListener("click", () => {
    if (
      navData &&
      navData[2] &&
      navData[2].episode &&
      getEpisode(episodeInput) !== Number(navData[2].episode)
    ) {
      updateEpisode(
        navData[2].episode,
        episodeInput,
        prevButton,
        nextButton,
        currentEpButton,
        playerInfo,
        playerContainer,
      );
    }
  });
}

// Note: There might be a bug where the video player continues playing in the background
// after leaving the watch page. This is related to Astro view transitions. Removing the transition
// prevents the bug, but it also affects the loading animation. The destroyPlayer function is intended
// to help reduce or eliminate this issue.
