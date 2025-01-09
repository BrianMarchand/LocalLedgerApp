export const fetchAddressSuggestions = async (input) => {
  const apiKey = "AIzaSyDmSc-yiLqGrZfO1UJo0xpEFt6v4co8TAg"; // Replace with your Google API key
  const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=address&key=${apiKey}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Extract suggestions
    if (data && data.predictions) {
      return data.predictions.map((prediction) => prediction.description); // Extract addresses
    }

    return [];
  } catch (error) {
    console.error("Google Places API Error:", error);
    return [];
  }
};
