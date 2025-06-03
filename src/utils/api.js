const API_BASE_URL = "https://api-kura.animez.my.id/api";

/**
 * Fetch data from the given endpoint
 * @param {string} endpoint - API endpoint (e.g., "home" or "ongoing")
 * @param {number} [page] - Optional page number for pagination
 * @returns {Promise<object>} - Fetched JSON data
 */
export async function fetchData(endpoint, page = null) {
  try {
    const url = page
      ? `${API_BASE_URL}/${endpoint}?page=${page}`
      : `${API_BASE_URL}/${endpoint}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

/**
 * Fetch anime data by ID and slug.
 * @param {string} id - Anime ID.
 * @param {string} slug - Anime slug.
 * @returns {Promise<object|null>}
 */
export async function fetchAnimeData(id, slug) {
  try {
    const url = `${API_BASE_URL}/anime?id=${id}&slug=${slug}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Anime not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching anime data:", error);
    return null;
  }
}

/**
 * Fetch watch data (video dan navigasi) untuk episode tertentu.
 * @param {string} id - Anime ID.
 * @param {string} slug - Anime slug.
 * @param {number|string} episode - Episode number.
 * @returns {Promise<object|null>}
 */
export async function fetchWatchData(id, slug, episode) {
  try {
    const url = `${API_BASE_URL}/watch?id=${id}&slug=${slug}&episode=${episode}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Video not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching watch data:", error);
    return null;
  }
}
