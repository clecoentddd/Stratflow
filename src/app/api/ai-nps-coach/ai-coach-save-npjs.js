import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle POST request (save data)
    console.log('ai-coach-saving-nps : Request Body:', req.body); // Log the request body

    const { radarId, potentialNPS, evaluations, suggestions } = req.body;

    // Validate the request body
    if (!radarId || !potentialNPS || !evaluations || !suggestions) {
      console.log("ai-coach-saving-nps : Found empty values for radarId:", radarId);
      return res.status(400).json({
        success: false,
        message: 'ai-coach-saving-nps : ai-coach-saving-nps Missing required fields: radarId, potentialNPS, evaluations, or suggestions.',
      });
    }

    try {
      // Save the data to Supabase
      const { data, error } = await supabase
        .from('ai_purpose_rating')
        .insert([
          {
            radarId: radarId,
            potentialNPS: potentialNPS,
            evaluations: evaluations,
            suggestions: suggestions,
          },
        ])
        .select();

      if (error) {
        console.error('ai-coach-saving-nps : Error saving to Supabase:', error.message);
        throw error;
      }

        // Update radars with NPS
        const { data: NPSdata, error: NPSerror } = await supabase
        .from('projection_organisation_list')
        .update({
            potentialNPS: potentialNPS, // Update potentialNPS
            updated_at: new Date().toISOString(), // Update updated_at
        })
        .match({ id: radarId }) // Match the row with the given radarId
        .select('*'); // Return the updated row

        if (NPSerror) {
            console.error('Error updating radars:', NPSerror.message);
        } 

        console.log('Updated radars table:', NPSdata);

      // Return success response
      res.status(200).json({
        success: true,
        message: 'ai-coach-saving-nps - Data saved successfully.',
        data: data,
      });
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'ai-coach-saving-nps : Failed to save data to Supabase.',
      });
    }

  // handling GET 
  } else if (req.method === 'GET') {
    // Handle GET request (retrieve latest entry for a radarId)
    const { radarId } = req.query; // Get radarId from query parameters

    // Validate the radarId
    if (!radarId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: radarId.',
      });
    }

    try {
      // Fetch the latest entry for the given radarId
      const { data, error } = await supabase
        .from('ai_purpose_rating')
        .select('radarId, potentialNPS, evaluations, suggestions, created_at')
        .eq('radarId', radarId) // Filter by radarId
        .order('created_at', { ascending: false }) // Sort by created_at in descending order
        .limit(1); // Limit to 1 result (latest entry)


      if (error) {
        console.error('Error fetching from Supabase:', error.message);
        throw error;
      } else {
        console.log("AI NPS related data found for:", radarId);
      }
      
      // Return success response with the fetched data
      res.status(200).json({
        success: true,
        message: 'Latest data retrieved successfully.',
        data: data.length > 0 ? data[0] : null, // Return the first (and only) entry
      });
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data from Supabase.',
      });
    }
  } else {
    // Handle unsupported methods
    res.status(405).json({ message: 'Method not allowed' });
  }
}