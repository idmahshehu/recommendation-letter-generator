import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface SignatureSectionProps {
  currentSignature: string | null;
  onSave: (signatureData: string) => Promise<void>;
}

const SignatureSection: React.FC<SignatureSectionProps> = ({ currentSignature, onSave }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token } = useAuth();

  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsDrawing(false);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (1MB max for signatures)
    if (file.size > 1 * 1024 * 1024) {
      alert('Image must be smaller than 1MB');
      return;
    }

    // Preview only
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

//   const saveSignature = async () => {
//     setSaving(true);

//     try {
//       if (mode === 'draw') {
//         if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
//           alert('Please draw your signature first');
//           return;
//         }
//         const signatureData = sigCanvas.current.toDataURL('image/png');

//         // send base64 JSON
//         const res = await fetch('/api/users/upload-signature', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ signature: signatureData }),
//         });
//         const data = await res.json();
//         await onSave(data.signature_url);
//         setIsDrawing(false);

//       } else if (mode === 'upload') {
//         if (!fileInputRef.current?.files?.[0]) {
//           alert('Please upload a signature image first');
//           return;
//         }
//         const file = fileInputRef.current.files[0];
//         const formData = new FormData();
//         formData.append('signature', file);

//         // send as multipart/form-data
//         const res = await fetch('/api/users/upload-signature-file', {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           body: formData,
//         });
//         const data = await res.json();
//         await onSave(data.signature_url);
//       }
//     } catch (error) {
//       console.error('Failed to save signature:', error);
//       alert('Failed to save signature. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const removeSignature = async () => {
//     if (!window.confirm('Are you sure you want to remove your signature?')) {
//       return;
//     }
//     setSaving(true);
//     try {
//       const res = await fetch('/api/users/upload-signature', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ signature: '' }),
//       });
//       const data = await res.json();
//       await onSave(data.signature_url);
//       clearSignature();
//     } catch (error) {
//       console.error('Failed to remove signature:', error);
//     } finally {
//       setSaving(false);
//     }
//   };

// In SignatureSection.tsx, update the saveSignature function:

const saveSignature = async () => {
  setSaving(true);

  try {
    if (mode === 'draw') {
      if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
        alert('Please draw your signature first');
        setSaving(false);
        return;
      }
      const signatureData = sigCanvas.current.toDataURL('image/png');
      
      const response = await api.post('/users/upload-signature', { signature: signatureData });
      await onSave(response.data.signature_url);
      setIsDrawing(false);

    } else if (mode === 'upload') {
      if (!fileInputRef.current?.files?.[0]) {
        alert('Please upload a signature image first');
        setSaving(false);
        return;
      }
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('signature', file);

      const response = await api.post('/users/upload-signature-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await onSave(response.data.signature_url);
    }
  } catch (error) {
    console.error('Failed to save signature:', error);
    alert('Failed to save signature. Please try again.');
  } finally {
    setSaving(false);
  }
};
const removeSignature = async () => {
  if (!window.confirm('Are you sure you want to remove your signature?')) {
    return;
  }
  setSaving(true);
  try {
    // Use full backend URL
    const res = await api.post('/users/upload-signature', { signature: '' });
    const data = res.data;

    if (onSave) {
      await onSave(data.signature_url || null);
    }
    
    clearSignature();
  } catch (error) {
    console.error('Failed to remove signature:', error);
  } finally {
    setSaving(false);
  }
};
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Digital Signature (Optional)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add your signature to recommendation letters
          </p>
        </div>
        {currentSignature && (
          <button
            type="button"
            onClick={removeSignature}
            disabled={saving}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {/* Current Signature Preview */}
      {currentSignature && !isDrawing && !uploadPreview && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Current Signature:</p>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <img src={currentSignature} alt="Current signature" className="max-h-24 mx-auto" />
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            setMode('draw');
            setUploadPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
            mode === 'draw'
              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Draw Signature
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('upload');
            clearSignature();
          }}
          className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
            mode === 'upload'
              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Upload Image
        </button>
      </div>

      {/* Draw Mode */}
      {mode === 'draw' && (
        <div>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-40',
                style: { touchAction: 'none' },
              }}
              backgroundColor="white"
              onBegin={() => setIsDrawing(true)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Draw your signature using your mouse or touchscreen
          </p>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                       file:rounded-lg file:border-0 file:text-sm file:font-medium 
                       file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload a PNG or JPG image of your signature (max 1MB)
          </p>
          {uploadPreview && (
            <div className="mt-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img src={uploadPreview} alt="Signature preview" className="max-h-24 mx-auto" />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={clearSignature}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : currentSignature ? 'Update Signature' : 'Save Signature'}
        </button>
      </div>
    </div>
  );
};

export default SignatureSection;
