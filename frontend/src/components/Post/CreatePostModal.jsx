import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import { VALIDATION } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const CreatePostModal = ({ onClose, onSubmit }) => {
  const { isFaculty } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isFacultyPost, setIsFacultyPost] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isExamRelated, setIsExamRelated] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newMediaFiles = [...mediaFiles, ...files];
    const newPreviews = [...previews];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: reader.result,
          file: file
        });
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setMediaFiles(newMediaFiles);
    setError('');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = canvas.toDataURL('image/jpeg');
      
      setMediaFiles([...mediaFiles, file]);
      setPreviews([...previews, { type: 'image', url, file }]);
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const removeMedia = (index) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setMediaFiles(newMediaFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!caption.trim() && mediaFiles.length === 0) {
      setError('Please add a caption or media');
      return;
    }

    if (caption.length > VALIDATION.MAX_CAPTION_LENGTH) {
      setError(`Caption must be less than ${VALIDATION.MAX_CAPTION_LENGTH} characters`);
      return;
    }

    if (isFaculty && isBroadcast && !broadcastTarget) {
      setError('Please select broadcast target');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postData = {
        caption,
        media: mediaFiles,
        isFacultyPost,
        pollOptions: pollOptions.filter(opt => opt.trim()),
        isBroadcast,
        broadcastTarget,
        isImportant,
        isExamRelated,
      };
      await onSubmit(postData);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      const errorMsg = err.message || 'Failed to create post';
      setError(errorMsg);
      // Don't close modal on error so user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create Post</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Caption Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows="3"
              maxLength={VALIDATION.MAX_CAPTION_LENGTH}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {caption.length}/{VALIDATION.MAX_CAPTION_LENGTH}
            </p>
          </div>

          {/* Camera View */}
          {showCamera && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover rounded-lg bg-black"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={capturePhoto}
                  className="p-4 bg-white text-purple-600 rounded-full hover:bg-gray-100 transition shadow-lg"
                >
                  <Camera size={24} />
                </button>
                <button
                  onClick={stopCamera}
                  className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Media Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  {preview.type === 'video' ? (
                    <video
                      src={preview.url}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                    {preview.type === 'video' ? 'Video' : 'Image'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Options */}
          {!showCamera && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Upload Photos</span>
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <Video size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Upload Videos</span>
              </button>

              <button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <Camera size={20} className="text-blue-400" />
                <span className="text-sm font-medium text-blue-600">Take Photo</span>
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Faculty Options */}
          {isFaculty && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="facultyPost"
                  checked={isFacultyPost}
                  onChange={(e) => setIsFacultyPost(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="facultyPost" className="text-sm font-medium text-gray-700">
                  Mark as Faculty Post (pinned and highlighted)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="important" className="text-sm font-medium text-gray-700">
                  Mark as Important
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="examRelated"
                  checked={isExamRelated}
                  onChange={(e) => setIsExamRelated(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="examRelated" className="text-sm font-medium text-gray-700">
                  Mark as Exam Related
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="broadcast"
                  checked={isBroadcast}
                  onChange={(e) => setIsBroadcast(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="broadcast" className="text-sm font-medium text-gray-700">
                  Broadcast Message
                </label>
              </div>

              {isBroadcast && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Broadcast Target
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select target</option>
                    <option value="class">Class</option>
                    <option value="department">Department</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📊 Academic Poll (optional - Faculty only)
                </label>
                <p className="text-xs text-gray-500 mb-3">Create a poll for student feedback and voting</p>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => {
                          const newOptions = pollOptions.filter((_, i) => i !== index);
                          setPollOptions(newOptions);
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 You can upload multiple photos and videos. No size limit!
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || (!caption.trim() && mediaFiles.length === 0)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Posting...
              </span>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;