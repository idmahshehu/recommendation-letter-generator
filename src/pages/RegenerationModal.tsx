import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface AIModel {
  id: string;
  name: string;
  description: string;
  pricing: string;
}

interface RegenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  letterId: string;
  onRegenerated: (newContent: string, metadata: any) => void;
  currentContent: string;
}

const RegenerationModal: React.FC<RegenerationModalProps> = ({
  isOpen,
  onClose,
  letterId,
  onRegenerated,
  currentContent
}) => {
  const [step, setStep] = useState<'options' | 'confirm' | 'generating'>('options');
  const [selectedOption, setSelectedOption] = useState<'same' | 'new_model' | 'full'>('same');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [newContext, setNewContext] = useState({
    relationship: '',
    duration: '',
    strengths: '',
    specific_examples: '',
    additional_context: ''
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableModels();
      setStep('options');
      setError('');
    }
  }, [isOpen]);

  const fetchAvailableModels = async () => {
    try {
      const response = await api.get('/letters/available-models');
      setAvailableModels(response.data.models);
      if (response.data.models.length > 0) {
        setSelectedModel(response.data.models[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setError('Failed to load available models');
    }
  };

  const handleOptionSelect = (option: 'same' | 'new_model' | 'full') => {
    setSelectedOption(option);
    setError('');
  };

  const handleRegenerate = async () => {
    setStep('generating');
    setError('');

    try {
      let requestData: any = { type: 'same_settings' };

      switch (selectedOption) {
        case 'same':
          requestData = { type: 'same_settings' };
          break;
        case 'new_model':
          if (!selectedModel) {
            setError('Please select a model');
            setStep('options');
            return;
          }
          requestData = { type: 'new_model', selected_model: selectedModel };
          break;
        case 'full':
          // Validate required fields for full regeneration
          if (!newContext.relationship || !newContext.duration || !newContext.strengths) {
            setError('Please fill in relationship, duration, and strengths');
            setStep('options');
            return;
          }
          requestData = { type: 'new_context', extra_context: newContext };
          break;
      }

      const response = await api.post(`/letters/${letterId}/regenerate`, requestData);
      onRegenerated(response.data.letter.content, response.data.letter);
      onClose();
    } catch (error: any) {
      console.error('Regeneration failed:', error);
      setError(error.response?.data?.error || 'Failed to regenerate letter');
      setStep('options');
    }
  };

  const handleConfirm = () => {
    setStep('confirm');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'options' && 'Regenerate Letter'}
            {step === 'confirm' && 'Confirm Regeneration'}
            {step === 'generating' && 'Generating...'}
          </h2>
          <button
            onClick={onClose}
            disabled={step === 'generating'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Options Step */}
          {step === 'options' && (
            <div className="space-y-6">
              <p className="text-gray-600">Choose how you'd like to regenerate the letter:</p>
              
              {/* Quick Regenerate */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'same' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOptionSelect('same')}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    checked={selectedOption === 'same'}
                    onChange={() => handleOptionSelect('same')}
                    className="mt-1"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">Use Same Settings</h3>
                    <p className="text-sm text-gray-600">Regenerate with the exact same parameters as before</p>
                  </div>
                </div>
              </div>

              {/* Model Change */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'new_model' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOptionSelect('new_model')}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    checked={selectedOption === 'new_model'}
                    onChange={() => handleOptionSelect('new_model')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Try Different AI Model</h3>
                    <p className="text-sm text-gray-600 mb-3">Keep the same context but use a different AI model</p>
                    
                    {selectedOption === 'new_model' && (
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.pricing}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Regeneration */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'full' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOptionSelect('full')}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    checked={selectedOption === 'full'}
                    onChange={() => handleOptionSelect('full')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">New Context & Information</h3>
                    <p className="text-sm text-gray-600 mb-3">Provide new context information for regeneration</p>
                    
                    {selectedOption === 'full' && (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Relationship <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newContext.relationship}
                            onChange={(e) => setNewContext({...newContext, relationship: e.target.value})}
                            placeholder="e.g., student in my Advanced AI course"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Duration <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newContext.duration}
                              onChange={(e) => setNewContext({...newContext, duration: e.target.value})}
                              placeholder="e.g., 2 years"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Key Strengths <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newContext.strengths}
                              onChange={(e) => setNewContext({...newContext, strengths: e.target.value})}
                              placeholder="e.g., leadership, analytical thinking"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Specific Examples</label>
                          <textarea
                            value={newContext.specific_examples}
                            onChange={(e) => setNewContext({...newContext, specific_examples: e.target.value})}
                            placeholder="Specific achievements or examples to highlight..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Current content will be replaced</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your current letter will be saved in history, but the main content will be replaced with the new generation.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                {selectedOption === 'same' && 'Regenerating with the same settings as before.'}
                {selectedOption === 'new_model' && `Regenerating with ${availableModels.find(m => m.id === selectedModel)?.name || selectedModel} model.`}
                {selectedOption === 'full' && 'Regenerating with new context information.'}
              </p>
            </div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Regenerating your letter...</p>
                <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'generating' && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            {step === 'options' && (
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Continue
              </button>
            )}
            
            {step === 'confirm' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('options')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Regenerate Letter
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegenerationModal;