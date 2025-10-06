import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

// Simple Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
    type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
      'bg-red-50 border-red-200 text-red-800';

  return (
    <div className={`fixed top-4 right-4 z-50 rounded-lg border ${bgColor} p-4 shadow-lg max-w-md animate-slide-in`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const LetterRequest: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form data
  const [refereeemail, setRefereeemail] = useState("");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [program, setProgram] = useState("");
  const [goal, setGoal] = useState("");
  const [achievementsText, setAchievementsText] = useState("");
  const [deadline, setDeadline] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Email validation state
  const [emailValidation, setEmailValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid' | 'duplicate';
    message: string;
    refereeName: string;
  }>({
    status: 'idle',
    message: '',
    refereeName: ''
  });

  // Live email validation with backend check
  useEffect(() => {
    const validateRefereeEmail = async () => {
      const emailValue = refereeemail.trim();

      if (!emailValue) {
        setEmailValidation({ status: 'idle', message: '', refereeName: '' });
        return;
      }

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        setEmailValidation({
          status: 'invalid',
          message: 'Invalid email format',
          refereeName: ''
        });
        return;
      }

      setEmailValidation({ status: 'checking', message: 'Checking...', refereeName: '' });

      try {
        const response = await api.post('letters/referees/validate',
          { email: emailValue.toLowerCase() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.exists) {
          if (response.data.hasPendingRequest) {
            setEmailValidation({
              status: 'duplicate',
              message: 'You already have a pending request with this referee',
              refereeName: response.data.name
            });
          } else {
            setEmailValidation({
              status: 'valid',
              message: `✓ ${response.data.name}`,
              refereeName: response.data.name
            });
          }
        } else {
          setEmailValidation({
            status: 'invalid',
            message: 'Referee not found in system',
            refereeName: ''
          });
        }
      } catch (error: any) {
        setEmailValidation({
          status: 'invalid',
          message: error?.response?.data?.message || 'Unable to validate referee',
          refereeName: ''
        });
      }
    };

    const debounceTimer = setTimeout(validateRefereeEmail, 600);
    return () => clearTimeout(debounceTimer);
  }, [refereeemail, token]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!refereeemail.trim()) {
        newErrors.refereeemail = "Referee email is required";
      } else if (emailValidation.status === 'checking') {
        newErrors.refereeemail = "Please wait while we validate the email";
      } else if (emailValidation.status !== 'valid') {
        newErrors.refereeemail = "Please enter a valid referee email that exists in the system";
      }

      if (!firstName.trim()) newErrors.firstName = "First name is required";
      if (!lastName.trim()) newErrors.lastName = "Last name is required";
      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Enter a valid email";
      }
    }

    if (step === 2) {
      if (!program.trim()) newErrors.program = "Program is required";
      if (!goal.trim()) newErrors.goal = "Goal is required";

      const ach = achievementsText.split("\n").map(s => s.trim()).filter(Boolean);
      if (ach.length === 0) {
        newErrors.achievementsText = "Please add at least one achievement";
      }
    }

    if (step === 3) {
      if (!deadline) {
        newErrors.deadline = "Deadline is required";
      } else if (new Date(deadline) <= new Date(new Date().toDateString())) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setErrors({});
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    const achievements = achievementsText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      referee_email: refereeemail.trim(),
      applicant_data: {
        firstName,
        lastName,
        email,
        program,
        goal,
        achievements,
      },
      preferences: {
        deadline,
      },
    };

    setSubmitting(true);
    try {
      const response = await api.post("/letters/request", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToast({
        message: response.data.message || 'Letter request submitted successfully!',
        type: 'success'
      });

      setTimeout(() => {
        navigate("/letters");
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || "Failed to submit request.";
      const status = err?.response?.status;

      if (status === 409) {
        setToast({
          message: 'You already have a pending letter request with this referee',
          type: 'warning'
        });
      } else if (status === 404) {
        setToast({
          message: 'Referee not found. Please check the email address.',
          type: 'error'
        });
        setCurrentStep(1);
        setErrors({ refereeemail: 'Referee not found in system' });
      } else {
        setToast({
          message: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Email validation icon
  const EmailValidationIcon = () => {
    switch (emailValidation.status) {
      case 'checking':
        return (
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'valid':
        return (
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'invalid':
      case 'duplicate':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold transition-all ${step < currentStep
            ? 'bg-green-500 border-green-500 text-white'
            : step === currentStep
              ? 'bg-black border-black text-white'
              : 'border-gray-300 text-gray-400'
            }`}>
            {step < currentStep ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              step
            )}
          </div>
          {step < totalSteps && (
            <div className={`w-16 h-0.5 mx-2 transition-all ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Request Recommendation Letter
            </h1>
            <p className="text-gray-600">
              Step {currentStep} of {totalSteps}: {
                currentStep === 1 ? 'Referee & Personal Information' :
                  currentStep === 2 ? 'Application Details' :
                    'Review & Submit'
              }
            </p>
          </div>

          <StepIndicator />

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Step 1: Referee & Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Referee Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referee Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={refereeemail}
                      onChange={(e) => {
                        setRefereeemail(e.target.value);
                        if (errors.refereeemail) setErrors(prev => ({ ...prev, refereeemail: '' }));
                      }}
                      placeholder="referee@york.citycollege.eu"
                      className={`w-full rounded-lg border px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.refereeemail ? 'border-red-500' :
                        emailValidation.status === 'valid' ? 'border-green-500' :
                          emailValidation.status === 'invalid' || emailValidation.status === 'duplicate' ? 'border-red-500' :
                            'border-gray-300'
                        }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <EmailValidationIcon />
                    </div>
                  </div>
                  {emailValidation.message && !errors.refereeemail && (
                    <p className={`mt-2 text-sm flex items-center gap-2 ${emailValidation.status === 'valid' ? 'text-green-600 font-medium' :
                      emailValidation.status === 'duplicate' ? 'text-orange-600' :
                        emailValidation.status === 'checking' ? 'text-blue-600' :
                          'text-red-600'
                      }`}>
                      {emailValidation.status === 'duplicate' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                      {emailValidation.message}
                    </p>
                  )}
                  {errors.refereeemail && (
                    <p className="mt-2 text-sm text-red-600">{errors.refereeemail}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the email address of your referee. They must be registered in the system.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                        }}
                        className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                        }}
                        className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Application Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
                    <input
                      type="text"
                      value={program}
                      onChange={(e) => {
                        setProgram(e.target.value);
                        if (errors.program) setErrors(prev => ({ ...prev, program: '' }));
                      }}
                      placeholder="MSc in Computer Science"
                      className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.program ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.program && (
                      <p className="mt-1 text-sm text-red-600">{errors.program}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal *</label>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        setGoal(e.target.value);
                        if (errors.goal) setErrors(prev => ({ ...prev, goal: '' }));
                      }}
                      placeholder="Apply to graduate school"
                      className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.goal ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.goal && (
                      <p className="mt-1 text-sm text-red-600">{errors.goal}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achievements *
                  </label>
                  <textarea
                    value={achievementsText}
                    onChange={(e) => {
                      setAchievementsText(e.target.value);
                      if (errors.achievementsText) setErrors(prev => ({ ...prev, achievementsText: '' }));
                    }}
                    rows={6}
                    placeholder="One per line, e.g.&#10;• Top 10% of class&#10;• Led research project on AI&#10;• Teaching assistant in Algorithms"
                    className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black font-sans transition ${errors.achievementsText ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Add each achievement on a new line</p>
                  {errors.achievementsText && (
                    <p className="mt-1 text-sm text-red-600">{errors.achievementsText}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Deadline */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      if (errors.deadline) setErrors(prev => ({ ...prev, deadline: '' }));
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition ${errors.deadline ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.deadline && (
                    <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4">Request Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Referee:</span>
                      <span className="text-gray-900">{emailValidation.refereeName || refereeemail}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Applicant:</span>
                      <span className="text-gray-900">{firstName} {lastName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Email:</span>
                      <span className="text-gray-900">{email}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Program:</span>
                      <span className="text-gray-900">{program}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Goal:</span>
                      <span className="text-gray-900">{goal}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Achievements:</span>
                      <span className="text-gray-900">
                        {Array.isArray(achievementsText)
                          ? achievementsText.join(', ')
                          : achievementsText
                            .split('\n')
                            .map(s => s.trim())
                            .filter(Boolean)
                            .join(', ')}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Deadline:</span>
                      <span className="text-gray-900">{deadline ? new Date(deadline).toLocaleDateString() : 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Previous
                </button>
              )}

              <div className={currentStep === 1 ? 'ml-auto' : ''}>
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LetterRequest;