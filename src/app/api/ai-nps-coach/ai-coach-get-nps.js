// pages/api/ai-coach.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { radarId, purpose, context } = req.body;
  
      try {
        // Call Mistral API with the purpose
        const response = await callMistralPurposeVisionMission(purpose, context);
  
        // Return the response
        res.status(200).json({
          success: true,
          data: response,
        });
      } catch (error) {
        console.error('Error calling Mistral:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to call Mistral API.',
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }

  // Function to call Mistral API using fetch
  async function callMistral(purpose, context) {
    const prompt = `Assess the following purpose based on the context of the organisation - its activities and goals - and provide:
  1. An NPS rating between 0 to 5.
  2. Evaluations on the purpose:: Evaluation Criteria (please do rate each of these 5 sections of them 0 to 5- do not reuse numbering)
    2.1 Inspiration and Motivation:
    - Does the purpose statement inspire and motivate both employees and customers?
    - How emotionally engaging is the statement?
    2.2 Customer Focus:
    - Does it emphasize learning from customers and meeting their evolving needs?
    - How well does it prioritize customer satisfaction and loyalty?
    2.3 Growth and Improvement:
    -Does it highlight continuous improvement, innovation, or skill development?
    - How does it encourage a culture of learning and adaptation?
    2.4 Uniqueness and Differentiation:
    - Does it differentiate the organization from competitors?
    - How unique and memorable is the statement?
    2.5 Alignment with Values:
    - Does it align with the organization's core values and mission?
    - How well does it reflect the organization's identity and goals?
  3. If the NPS is below 4.5, provide 3 suggestions to improve the purpose. If the NPS is 4.5 or above, return "Job done". Suggestions have to better examples of the purpose.
  
  **Purpose:** ${purpose}

  **Context:** ${context}
  
  **Response Format:**
  - And please do stick to this format as I am parsing your response:
  - 1. NPS Rating: [Rating between 0 and 5] - Please ensure you do give a rating between 0 and 5
  - 2. Evaluation Criteria: [Your feedback on the purpose, including emotional impact and focus]
  - 3. Suggestions: propoose alternative purposes the user could consider to use [3 suggestions of a purpose if NPS < 4.5, otherwise "Job done"]

Please, in addition to your full answer above, return also a valid JSON object enclosed in triple backticks with the following keys:
{
  "nps": [number between 0 and 5],
  "evaluations": "[text of section 2]",
  "suggestions": "[text of section 3]"
}
Make sure the JSON is valid and properly enclosed between triple backticks.
`

  
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-medium', // Use the appropriate Mistral model
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
  
    if (!mistralResponse.ok) {
      const errorResponse = await mistralResponse.json();
      console.error('Mistral API Error:', errorResponse);
      throw new Error(`Mistral API error! Status: ${mistralResponse.status}`);
    }
  
    const responseData = await mistralResponse.json();
  
    // Parse the Mistral response
    const responseText = responseData.choices[0].message.content;

    console.log("AI response in full is: ", responseText);
  
  // Extract NPS, evaluations, and suggestions from the response
  // Extract NPS Rating
  const npsMatch = responseText.match(/1. NPS Rating:\s*(\d+(\.\d+)?)/);
  const npsRating = npsMatch ? npsMatch[1] : null;

  // Extract Evaluation Criteria (evaluations)
  const evaluationsMatch = responseText.match(/2. Evaluation Criteria:([\s\S]*?)(?=\n3. Suggestions:|$)/);
  const evaluations = evaluationsMatch ? evaluationsMatch[1].trim() : null;

  // Extract Suggestions
  const suggestionsMatch = responseText.match(/3. Suggestions:\s*([\s\S]*)/);
  const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : null;

  console.log("AI evaluations response in full is: ", evaluationsMatch);
  
    return {
      potentialNPS: npsRating,
      evaluations,
      suggestions,
    };
  }

  async function callMistralPurposeVisionMission(purpose, context) {
    const prompt = `Assess the following purpose, vision and mission based on the context of the organisation - its activities and goals - and provide:
  1. An NPS rating between 0 to 5. Please ensure you do give a rating between 0 and 5.
    - You MUST include this exact line in your answer:  
   - NPS Rating: [a number between 0 and 5]"  
   - The NPS value must be numeric only (e.g., "1. NPS Rating: 4.7").  
   - Do not write words like "four point five" or any text before or after the number.
  2. Evaluations on the purpose:: Evaluation Criteria (please do rate each of these 5 sections of them 0 to 5- do not reuse numbering)
    2.1 Inspiration and Motivation:
    - Does the purpose statement inspire and motivate both employees and customers?
    - How emotionally engaging is the statement?
    2.2 Customer Focus:
    - Does it emphasize learning from customers and meeting their evolving needs?
    - How well does it prioritize customer satisfaction and loyalty?
    2.3 Growth and Improvement:
    -Does it highlight continuous improvement, innovation, or skill development?
    - How does it encourage a culture of learning and adaptation?
    2.4 Uniqueness and Differentiation:
    - Does it differentiate the organization from competitors?
    - How unique and memorable is the statement?
    2.5 Alignment with Values:
    - Does it align with the organization's core values and mission?
    - How well does it reflect the organization's identity and goals?
    2.6 Vision and Mission:
    - Does it clearly articulate the organization's long-term vision and mission?
  3. If the NPS is below 4.5, provide 3 suggestions to improve the purpose. If the NPS is 4.5 or above, return "Job done". Suggestions have to better examples of the purpose.
  
  **Purpose:** ${purpose}

  **Context:** ${context}
  
  **Response Format:**
  - And please do stick to this format as I am parsing your response:
  - 1. NPS Rating: [Rating between 0 and 5]
  - 2. Evaluation Criteria: [Your feedback on the purpose, including emotional impact and focus as well as be educational and informative]
  - 3. Suggestions: [1 suggestion on Purpose, 1 suggestion on Vision, 1 suggestion on Mission if NPS < 4.5, otherwise "Job done"]

Please, in addition to your full answer above, return also a valid JSON object enclosed in triple backticks with the following keys:
{
  "nps": [number between 0 and 5],
  "evaluations": "[text of section 2]",
  "suggestions": "[text of section 3]"
}
Make sure the JSON is valid and properly enclosed between triple backticks.
`

  
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-medium', // Use the appropriate Mistral model
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
  
    if (!mistralResponse.ok) {
      const errorResponse = await mistralResponse.json();
      console.error('Mistral API Error:', errorResponse);
      throw new Error(`Mistral API error! Status: ${mistralResponse.status}`);
    }
  
    const responseData = await mistralResponse.json();
  
    // Parse the Mistral response
    const responseText = responseData.choices[0].message.content;

    console.log("AI response in full is: ", responseText);
  
  // Extract NPS, evaluations, and suggestions from the response
  // Extract NPS Rating
  const npsMatch = responseText.match(/1[\).]?\s*NPS\s*Rating\s*:\s*(\d+(\.\d+)?)/i);
  const npsRating = npsMatch ? npsMatch[1] : null;

  // Extract Evaluation Criteria (evaluations)
  const evaluationsMatch = responseText.match(/2. Evaluation Criteria:([\s\S]*?)(?=\n3. Suggestions:|$)/);
  const evaluations = evaluationsMatch ? evaluationsMatch[1].trim() : null;

  // Extract Suggestions
  const suggestionsMatch = responseText.match(/3. Suggestions:\s*([\s\S]*)/);
  const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : null;

  console.log("AI evaluations response in full is: ", evaluationsMatch);
  
    return {
      potentialNPS: npsRating,
      evaluations,
      suggestions,
    };
  }
