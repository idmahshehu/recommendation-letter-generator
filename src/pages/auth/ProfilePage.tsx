import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/layout/Navigation';

interface ProfileData {
  firstName: string;
  lastName: string;
  fullname: string,
  email: string;
  institution?: string;
  department?: string;
  title?: string;
  city?: string;
  state?: string;
  university_logo_url?: string;
}

interface Alert {
  message: string;
  type: 'success' | 'error' | 'info';
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    fullname: '',
    email: '',
    institution: '',
    department: '',
    title: '',
    city: '',
    state: '',
    university_logo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);


  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/profile');
      const userData = response.data;
      setProfile({
        ...userData,
        fullname: `${userData.firstName} ${userData.lastName}`
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      showAlert('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please upload an image file', 'error');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Image must be smaller than 2MB', 'error');
      return;
    }

    setLogoPreview(URL.createObjectURL(file));

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await api.post('/users/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({ ...profile, university_logo_url: response.data.logo_url });
      showAlert('Logo uploaded successfully', 'success');
    } catch (error) {
      console.error('Failed to upload logo:', error);
      showAlert('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/users/profile', profile);
      showAlert('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showAlert('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'referee') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. This page is only for referees.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
            Dashboard
          </button>
          <span>›</span>
          <span>Profile</span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`rounded-lg p-4 mb-6 ${alert.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : alert.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
            {alert.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                <p className="text-sm text-gray-600 mt-1">This information will be used in your recommendation letters</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={profile.fullname}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dr. John Smith"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={profile.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Associate Professor of Computer Science"
                  />
                </div>

                {/* University */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University/Institution <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={profile.institution}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Massachusetts Institute of Technology"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Department of Computer Science and Engineering"
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={profile.city}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cambridge"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={profile.state}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="MA"
                    />
                  </div>
                </div>

                {/* University Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University Logo (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingLogo && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Max 2MB. Supported formats: PNG, JPG, GIF</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Profile'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-8">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Letter Header Preview</h3>
                <p className="text-xs text-gray-600 mt-1">How your info will appear in letters</p>
              </div>
              <div className="p-4 text-sm space-y-1 font-mono text-gray-700 bg-gray-50">
                <div>{profile.institution || '[University]'}</div>
                <div>{profile.department || '[Department]'}</div>
                <div>{profile.title || '[Your Title]'}</div>
                <div>{profile.fullname || '[Your Name]'}</div>
                <div>{profile.city && profile.state ? `${profile.city}, ${profile.state}` : '[City, State]'}</div>
                <div>{profile.email}</div>
                <div>{new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                </div>
                {(logoPreview || profile.university_logo_url) && (
                  <img
                    src={logoPreview || profile.university_logo_url}
                    alt="University Logo"
                    className="mt-2 h-auto w-auto object-contain border border-gray-200 rounded"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;