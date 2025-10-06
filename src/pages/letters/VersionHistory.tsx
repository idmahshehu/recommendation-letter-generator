import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ReasonModal from '../ReasonModal'; 

interface HistoryEntry {
  version: number;
  model_used: string;
  selected_model: string;
  created_at: string;
  tokens_used: number;
  content_preview: string;
}

interface VersionHistoryProps {
  letterId: string;
  currentVersion: number;
  onVersionRestored: (newContent: string, version: number) => void;
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  letterId,
  currentVersion,
  onVersionRestored,
  showAlert
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | ''>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [letterId]);

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/letters/${letterId}/history`);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleVersionSelect = async (version: string) => {
    if (!version) {
      setSelectedVersion('');
      setShowPreview(false);
      return;
    }

    const versionNum = parseInt(version);
    setSelectedVersion(versionNum);
    setLoading(true);

    try {
      const response = await api.get(`/letters/${letterId}/history/${versionNum}`);
      setPreviewContent(response.data.content);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to fetch version:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    setRestoring(true);

    try {
      const response = await api.post(`/letters/${letterId}/restore/${selectedVersion}`);
      onVersionRestored(response.data.letter.content, response.data.letter.version);
      setSelectedVersion('');
      setShowPreview(false);
      await fetchHistory();
    } catch (error) {
      console.error('Failed to restore version:', error);
      showAlert('Failed to restore version', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all version history? The current version will be kept as Version 1.')) return;
    setClearing(true);

    try {
      await api.delete(`/letters/${letterId}/history`);
      await fetchHistory();
      showAlert('Version history cleared', 'success');
    } catch (error) {
      console.error('Failed to clear history:', error);
      showAlert('Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleCancelLetter = async (reason?: string) => {
    setCanceling(true);
    try {
      await api.post(`/letters/${letterId}/cancel`, { reason }); // ✅ fixed endpoint
      showAlert('Letter canceled successfully', 'success');
      window.location.href = '/letters';
    } catch (error) {
      console.error('Failed to cancel letter:', error);
      showAlert('Failed to cancel letter', 'error');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
        <div className="bg-purple-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">Version History</h3>
            <p className="text-xs text-gray-600 mt-1">Current: Version {currentVersion}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              {clearing ? 'Clearing...' : 'Clear History'}
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={canceling}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {canceling ? 'Canceling...' : 'Cancel Letter'}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Version Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Previous Version
            </label>
            <select
              value={selectedVersion}
              onChange={(e) => handleVersionSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading || restoring}
            >
              <option value="">Select version...</option>
              {history.map((entry) => (
                <option key={entry.version} value={entry.version}>
                  Version {entry.version} - {entry.selected_model} ({formatDate(entry.created_at)})
                </option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          )}

          {/* Preview + Restore */}
          {showPreview && !loading && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-md p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Preview:</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {previewContent.substring(0, 300)}...
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedVersion('');
                    setShowPreview(false);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  disabled={restoring}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {restoring ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="border-t border-gray-200 pt-3">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Total versions:</span>
                <span>{history.length + 1}</span>
              </div>
              <div className="flex justify-between">
                <span>Total tokens used:</span>
                <span>{history.reduce((sum, entry) => sum + (entry.tokens_used || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <ReasonModal
        isOpen={showCancelModal}
        title="Cancel Letter"
        description="Why are you canceling this letter? This message will be visible to the applicant (optional)."
        confirmLabel="Confirm Cancel"
        confirmColor="red"
        onClose={() => setShowCancelModal(false)}
        onConfirm={(reason) => handleCancelLetter(reason)}
      />
    </>
  );
};

export default VersionHistory;
