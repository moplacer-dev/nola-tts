'use client';

import { useState, useEffect } from 'react';

interface ComponentTemplate {
  id: string;
  component_key: string;
  subject: string;
  display_name: string;
  default_duration_days: number;
  color: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  user_id: string | null;
}

interface EditComponentModalProps {
  component: ComponentTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditComponentModal({ component, onClose, onSuccess }: EditComponentModalProps) {
  const [formData, setFormData] = useState({
    display_name: component.display_name,
    default_duration_days: component.default_duration_days,
    color: component.color,
    description: component.description || '',
    category: component.category || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Fetch existing categories when modal opens
  useEffect(() => {
    fetchExistingCategories();
  }, []);

  const fetchExistingCategories = async () => {
    try {
      const response = await fetch('/api/v2/admin/component-templates');
      if (response.ok) {
        const data = await response.json();
        // Extract unique, non-null categories
        const categories = Array.from(
          new Set(
            data.templates
              .map((t: any) => t.category)
              .filter((c: any) => c != null && c.trim() !== '')
          )
        ).sort() as string[];
        setExistingCategories(categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/v2/admin/component-templates/${component.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update component');
      }
    } catch (err) {
      setError('Failed to update component');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border-2 border-gray-300 pointer-events-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Component Template</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Read-only info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component Key (Read-only)
              </label>
              <input
                type="text"
                value={component.component_key}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject (Read-only)
              </label>
              <input
                type="text"
                value={component.subject.replace('_', ' ').toUpperCase()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 capitalize"
                disabled
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component Name *
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Duration (days) *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.default_duration_days}
                onChange={(e) => setFormData({ ...formData, default_duration_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                required
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                rows={3}
              />
            </div>

            {/* Category (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>

              {/* Existing categories as buttons */}
              {existingCategories.length > 0 && !showCustomCategory && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {existingCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          formData.category === cat
                            ? 'bg-[#9333EA] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(true);
                    }}
                    className="text-sm text-[#9333EA] hover:text-[#7928CA] font-medium"
                  >
                    + Add new category
                  </button>
                </div>
              )}

              {/* Custom category input */}
              {(showCustomCategory || existingCategories.length === 0) && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] text-gray-900"
                    placeholder="Enter category name"
                  />
                  {existingCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategory(false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      ← Back to existing categories
                    </button>
                  )}
                </div>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Used for grouping in the component library
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#9333EA] hover:bg-[#7928CA] text-white text-sm font-medium rounded-md disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
