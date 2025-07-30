// const axios = require("axios");

// const GEMINI_API_KEY = 'AIzaSyAgBqheH0TA41WQfpz0lhkfHNaCGSkqLSs'; 

// const generateLetterGemini = async (prompt) => {
//   try {
//     const res = await axios.post(
//       `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }]
//       },
//       {
//         headers: { "Content-Type": "application/json" }
//       }
//     );

//     const response = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
//     console.log(response);
//     return response;
//   } catch (err) {
//     console.error("Gemini API Error:", err.response?.data || err.message);
//     return "Error generating letter.";
//   }
// };

// // ✅ Run it
// generateLetterGemini("Please write a short academic recommendation letter for a master's student.");

// // const generateLetterGemini = async (prompt) => {
// //   const res = await axios.post(
// //     `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
// //     {
// //       contents: [{ parts: [{ text: "Please generate a short academic recommendation letter." }] }]
// //     },
// //     {
// //       headers: { "Content-Type": "application/json" }
// //     }
// //   );

// //   const response = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
// //   console.log(response)
// //   return response;
// // };

// // generateLetterGemini("Please generate a short academic recommendation letter.");

// // generateLetterGemini(res)

// // module.exports = { generateLetterGemini };

// // const axios = require('axios');

// // const API_KEY = 'AIzaSyDvK-IEJzVfuTHBjfoitwtmWMnePFuwrTo'; 
// // const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;

// // axios
// //   .post(
// //     URL,
// //     {
// //       contents: [
// //         {
// //           parts: [
// //             { text: "Please generate a short academic recommendation letter." }
// //           ]
// //         }
// //       ]
// //     },
// //     {
// //       headers: {
// //         "Content-Type": "application/json"
// //       }
// //     }
// //   )
// //   .then(res => {
// //     const output = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No output";
// //     console.log("✅ Gemini Response:\n", output);
// //   })
// //   .catch(err => {
// //     console.error("❌ Error:", err.response?.data || err.message);
// //   });