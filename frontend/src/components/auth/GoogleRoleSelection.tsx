import React, { useState } from 'react';
import { User, Shield, UserCheck, BarChart3, ArrowRight, Building2, ArrowLeft, Phone } from 'lucide-react';

interface GoogleRoleSelectionProps {
  onRoleSelected: (role: 'user' | 'agent' | 'admin' | 'analytics', organization?: string, phoneNumber?: string) => void;
  onCancel: () => void;
  userInfo: {
    name: string;
    email: string;
  };
}

export function GoogleRoleSelection({ onRoleSelected, onCancel, userInfo }: GoogleRoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'agent' | 'admin' | 'analytics'>('user');
  const [organization, setOrganization] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'user' as const,
      title: 'Customer / User',
      description: 'Submit and track your complaints',
      icon: User,
      color: 'blue',
      requiresOrg: false,
    },
    {
      id: 'agent' as const,
      title: 'Support Agent',
      description: 'Handle and resolve customer complaints',
      icon: UserCheck,
      color: 'green',
      requiresOrg: true,
    },
    {
      id: 'admin' as const,
      title: 'Administrator',
      description: 'Manage teams and system settings',
      icon: Shield,
      color: 'purple',
      requiresOrg: true,
    },
    {
      id: 'analytics' as const,
      title: 'Analytics Manager',
      description: 'View reports and analyze data',
      icon: BarChart3,
      color: 'orange',
      requiresOrg: true,
    },
  ];

  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const requiresOrganization = selectedRoleData?.requiresOrg || false;
  const requiresPhoneNumber = selectedRole === 'user'; // Only users need phone number for WhatsApp

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate organization field if required
    if (requiresOrganization && !organization.trim()) {
      setError('Organization name is required for this role');
      return;
    }
    
    // Validate phone number (required only for 'user' role)
    if (requiresPhoneNumber && !phoneNumber.trim()) {
      setError('Phone number is required for WhatsApp notifications');
      return;
    }

    setLoading(true);
    try {
      await onRoleSelected(
        selectedRole, 
        requiresOrganization ? organization.trim() : undefined, 
        requiresPhoneNumber ? phoneNumber.trim() : undefined
      );
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected 
        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
      green: isSelected 
        ? 'border-green-500 bg-green-50 ring-2 ring-green-500' 
        : 'border-gray-200 hover:border-green-300 hover:bg-green-50',
      purple: isSelected 
        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500' 
        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50',
      orange: isSelected 
        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500' 
        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Image and branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-400 rounded-full"></div>
        </div>
        
        {/* Back button in left panel */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-8 left-8 text-white hover:text-blue-200 transition-all duration-200 flex items-center gap-2 font-medium text-lg z-20"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sign Up
        </button>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Join <span className="text-[#77BEF0]">QuickFix</span>
            </h1>
            <p className="text-xl text-blue-100">
              Choose your role to get started with intelligent customer service automation
            </p>
          </div>
          
          {/* Role Selection Image */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src="/Signup.webp"
                alt="QuickFix Role Selection"
                className="w-full max-w-lg h-auto rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Role Selection Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-2">
              Welcome, <span className="font-semibold text-blue-600">{userInfo.name}</span>
            </p>
            <p className="text-sm text-gray-500">
              {userInfo.email}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${getColorClasses(role.color, isSelected)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white' : 'bg-gray-50'}`}>
                          <Icon className={`w-5 h-5 ${getIconColor(role.color)}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {role.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Organization Field (conditional) */}
            {requiresOrganization && (
              <div className="animate-fadeIn">
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="organization"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your organization name"
                    required={requiresOrganization}
                  />
                </div>
              </div>
            )}

            {/* Phone Number Field (required only for 'user' role) */}
            {requiresPhoneNumber && (
              <div className="animate-fadeIn">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., +1 555 638 2998"
                    required={requiresPhoneNumber}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">We'll send WhatsApp notifications about your complaints</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
