'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AutoPopulateRequest, ScienceOptions, SocialStudiesOptions, MathOptions, ELAOptions } from '@/lib/auto-populate/types';
import { getDefaultScienceOptions } from '@/lib/auto-populate/science';
import { getDefaultSocialStudiesOptions } from '@/lib/auto-populate/social-studies';
import { getDefaultMathOptions } from '@/lib/auto-populate/math';
import { getDefaultELAOptions } from '@/lib/auto-populate/ela';
import ScienceConfig from './ScienceConfig';
import SocialStudiesConfig from './SocialStudiesConfig';
import MathConfig from './MathConfig';
import ELAConfig from './ELAConfig';

interface AutoPopulateStepProps {
  guideId: string;
  firstDay: string;
  onBack: () => void;
}

export default function AutoPopulateStep({ guideId, firstDay, onBack }: AutoPopulateStepProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize configurations with smart defaults
  const [scienceConfig, setScienceConfig] = useState<ScienceOptions>(
    getDefaultScienceOptions(firstDay)
  );
  const [socialStudiesConfig, setSocialStudiesConfig] = useState<SocialStudiesOptions>(
    getDefaultSocialStudiesOptions(firstDay, 'through_modern_times')
  );
  const [mathConfig, setMathConfig] = useState<MathOptions>(
    getDefaultMathOptions(firstDay)
  );
  const [elaConfig, setElaConfig] = useState<ELAOptions>(
    getDefaultELAOptions(firstDay)
  );

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Build request body
      const requestBody: AutoPopulateRequest = {};

      if (scienceConfig.enabled) {
        requestBody.science = scienceConfig;
      }
      if (socialStudiesConfig.enabled) {
        requestBody.socialStudies = socialStudiesConfig;
      }
      if (mathConfig.enabled) {
        requestBody.math = mathConfig;
      }
      if (elaConfig.enabled) {
        requestBody.ela = elaConfig;
      }

      // Check if at least one subject is enabled
      if (Object.keys(requestBody).length === 0) {
        setError('Please enable at least one subject to auto-populate, or skip this step.');
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const response = await fetch(`/api/pacing-guides/${guideId}/auto-populate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok && response.status !== 207) {
        // Full failure
        throw new Error(result.error || 'Failed to auto-populate pacing guide');
      }

      // Success or partial success (207 Multi-Status)
      const totalPlaced =
        (result.placedComponents?.science || 0) +
        (result.placedComponents?.socialStudies || 0) +
        (result.placedComponents?.math || 0) +
        (result.placedComponents?.ela || 0);

      if (result.errors && result.errors.length > 0) {
        // Partial success
        setError(`Some subjects had errors:\n${result.errors.join('\n')}`);
        setSuccessMessage(`Successfully placed ${totalPlaced} components for enabled subjects.`);
      } else {
        // Full success
        setSuccessMessage(`Successfully placed ${totalPlaced} components!`);
      }

      // Wait 2 seconds to show success message, then redirect
      setTimeout(() => {
        router.push(`/dashboard/guides/${guideId}`);
        router.refresh();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push(`/dashboard/guides/${guideId}`);
    router.refresh();
  };

  const anyEnabled = scienceConfig.enabled || socialStudiesConfig.enabled || mathConfig.enabled || elaConfig.enabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Auto-Populate Curricula (Optional)
        </h3>
        <p className="text-gray-600">
          Automatically place curriculum components on your subject calendars based on validated patterns from real schools.
          You can enable any combination of subjects, or skip this step and build manually.
        </p>
      </div>

      {/* Subject Configuration Forms */}
      <div className="space-y-4">
        <ScienceConfig
          config={scienceConfig}
          onChange={setScienceConfig}
          defaultStartDate={firstDay}
        />

        <SocialStudiesConfig
          config={socialStudiesConfig}
          onChange={setSocialStudiesConfig}
          defaultStartDate={firstDay}
        />

        <MathConfig
          config={mathConfig}
          onChange={setMathConfig}
          defaultStartDate={firstDay}
        />

        <ELAConfig
          config={elaConfig}
          onChange={setElaConfig}
          defaultStartDate={firstDay}
        />
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !anyEnabled}
            className="px-6 py-2.5 bg-[#9333EA] hover:bg-[#7c2bc9] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Auto-Populating...
              </span>
            ) : (
              'Auto-Populate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
