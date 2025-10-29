// utils/GetRadarData.js
/**
 * Fetches radar data from localStorage and returns it as JSON.
 * This function abstracts away the data logic so components
 * only deal with plain JSON data.
 *
 * @param {string} radarId - The ID of the radar or organisation to fetch.
 * @returns {Promise<Object[]>} - Returns an array of radar items.
 */
export async function GetRadarData(radarId: string) {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(radarId)}/radar`, { cache: 'no-store' });
    if (!res.ok) return [];
    const team = await res.json();
    return team?.radar || [];
  } catch (err) {
    console.error('Unexpected error in GetRadarData:', err);
    return [];
  }
}

/**
 * Optional helper for fetching a radar/organisation name
 * (used for zoom-in details in tooltips)
 */
export async function GetRadarName(radarId: string) {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(radarId)}/radar`, { cache: 'no-store' });
    if (!res.ok) return 'Organization Not Found';
    const team = await res.json();
    return team?.name || 'Unknown Organization';
  } catch (err) {
    console.error('Unexpected error in GetRadarName:', err);
    return 'Error fetching organisation';
  }
}