import { useState, useRef } from 'react';
import { Modal, Button } from './ui';
import { Camera, Upload, Trash2, Check, Image as ImageIcon, Link2, AlertCircle } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  username: string;
  onSaveAvatar: (url: string) => void;
}

export const PRESET_AVATARS = [
  {
    id: 'athlete-1',
    name: 'Iron Focus',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'athlete-2',
    name: 'Barbell Warrior',
    url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'athlete-3',
    name: 'Dumbbell Power',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'athlete-4',
    name: 'Heavy Lifter',
    url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'athlete-5',
    name: 'Conditioning',
    url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'athlete-6',
    name: 'Gym Titan',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80',
  },
];

/**
 * Resizes an image file to a maximum dimension using an offscreen canvas
 * to keep localStorage payload compact (~30-60KB).
 */
async function processAndResizeImage(file: File, maxDim = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG with 0.82 quality to ensure compact size
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  username,
  onSaveAvatar,
}: AvatarPickerModalProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatar || '');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const dataUrl = await processAndResizeImage(file);
      setSelectedUrl(dataUrl);
    } catch (err: any) {
      setError(err?.message || 'Error processing image.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    setSelectedUrl(trimmed);
    setCustomUrlInput('');
  };

  const handleSave = () => {
    onSaveAvatar(selectedUrl);
    onClose();
  };

  const handleRemove = () => {
    setSelectedUrl('');
    onSaveAvatar('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Profile Picture" maxWidth="max-w-lg">
      <div className="space-y-6 font-mono-stat">
        {/* Current / Staged Avatar Preview */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-[#121214] border border-[#27272a]">
          <div className="relative w-24 h-24 rounded-2xl bg-[#1c1c20] border-2 border-[#dc2626] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xl">
            {selectedUrl ? (
              <img
                src={selectedUrl}
                alt={username}
                className="w-full h-full object-cover"
                onError={() => {
                  setError('Failed to load image preview. Please check the URL.');
                }}
              />
            ) : (
              <span className="text-4xl font-black text-white">
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              {username || 'Athlete'}
            </h4>
            <p className="text-xs text-neutral-400 font-sans">
              {selectedUrl
                ? 'Previewing selected profile picture.'
                : 'Default initial avatar is currently active.'}
            </p>

            <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload size={14} /> Upload Device File
              </Button>

              {selectedUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-400 hover:text-red-300 border-red-900/40 hover:border-red-700/60"
                >
                  <Trash2 size={14} /> Remove Photo
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Option 2: Preset Fitness Avatars */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <ImageIcon size={14} className="text-[#dc2626]" />
            Or Choose a Fitness Preset Avatar
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {PRESET_AVATARS.map((preset) => {
              const isSelected = selectedUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedUrl(preset.url);
                    setError(null);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-[#dc2626] ring-2 ring-[#dc2626]/40 scale-95'
                      : 'border-[#27272a] hover:border-neutral-500 opacity-75 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#dc2626]/30 flex items-center justify-center">
                      <div className="p-1 rounded-full bg-[#dc2626] text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Option 3: Image URL Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Link2 size={14} className="text-[#dc2626]" />
            Or Paste Online Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="flex-1 bg-[#0a0a0c] border border-[#27272a] px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#dc2626] font-mono-stat"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleApplyCustomUrl}
              disabled={!customUrlInput.trim()}
            >
              Preview
            </Button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#262626] flex items-center justify-between gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isProcessing}
            className="min-w-[140px]"
          >
            <Check size={16} /> Save Picture
          </Button>
        </div>
      </div>
    </Modal>
  );
}
