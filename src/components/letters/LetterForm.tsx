// import React, { useState } from 'react';
// import { generateLetter } from '../../services/api';
// import { useAuth } from '../../context/AuthContext';

// const LetterForm = () => {
//     const [letterId, setLetterId] = useState('');
//     const [prompt, setPrompt] = useState('');
//     const [result, setResult] = useState('');
//     const { token } = useAuth(); 

//     const handleGenerate = async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!token) {
//             alert('You must be logged in first');
//             return;
//         }
//         console.log(token);

//         try {
//             const res = await generateLetter(letterId, prompt, token);
//             setResult(res.data.letter_content);
//             console.log(res.data.letter_content);
//         } catch (err: any) {
//             alert(err?.response?.data?.error || 'Something went wrong');
//         }
//     };

//     return (
//         <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded-xl">
//             <h2 className="text-2xl font-bold mb-4">Generate Letter</h2>
//             <form onSubmit={handleGenerate} className="space-y-4">
//                 <input
//                     type="text"
//                     value={letterId}
//                     onChange={(e) => setLetterId(e.target.value)}
//                     placeholder="Letter ID"
//                     className="w-full border border-gray-300 rounded p-2"
//                 />
//                 <textarea
//                     value={prompt}
//                     onChange={(e) => setPrompt(e.target.value)}
//                     placeholder="Enter prompt"
//                     rows={4}
//                     className="w-full border border-gray-300 rounded p-2"
//                 />
//                 <button
//                     type="submit"
//                     className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//                 >
//                     Generate
//                 </button>
//             </form>

//             {result && (
//                 <div className="mt-6 p-4 bg-gray-100 rounded">
//                     <h3 className="font-semibold">Generated Letter:</h3>
//                     <p>{result}</p>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default LetterForm;
