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
    const storedOrgsString = localStorage.getItem("organizations");
    if (!storedOrgsString) return [];
    
    const allOrgs = JSON.parse(storedOrgsString);
    const org = allOrgs.find((o: any) => o.id === radarId);

    return org?.radar || [];
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
    const storedOrgsString = localStorage.getItem("organizations");
    if (!storedOrgsString) return 'No name available';
    
    const allOrgs = JSON.parse(storedOrgsString);
    const org = allOrgs.find((o: any) => o.id === radarId);

    return org?.name || 'No name available';
  } catch (err) {
    console.error('Unexpected error in GetRadarName:', err);
    return 'Error fetching organisation';
  }
}
