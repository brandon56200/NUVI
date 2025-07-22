import React, { useRef, useEffect, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import ControlTray from './ControlTray';
import toast from 'react-hot-toast';

// AI Therapist Pulsing Border Component with Easing and Consistent Border Radius
const AIPulsingBorder: React.FC<{ volume: number; isActive: boolean }> = ({ volume, isActive }) => {
  const borderRef = useRef<HTMLDivElement>(null);
  // Animated values
  const anim = useRef({ borderWidth: 4, opacity: 0.0 });
  const target = useRef({ borderWidth: 4, opacity: 0.0 });
  const animationFrame = useRef<number | null>(null);

  // Easing function (springy, with smooth fade-out)
  function animate() {
    // Spring parameters
    const stiffness = 0.08; // Lower = slower, more easing
    // Animate borderWidth and opacity
    anim.current.borderWidth += (target.current.borderWidth - anim.current.borderWidth) * stiffness;
    anim.current.opacity += (target.current.opacity - anim.current.opacity) * stiffness;

    // Apply to DOM
    if (borderRef.current) {
      borderRef.current.style.borderWidth = `${anim.current.borderWidth}px`;
      borderRef.current.style.opacity = `${anim.current.opacity}`;
    }

    // Continue animating if not close to target
    if (
      Math.abs(anim.current.borderWidth - target.current.borderWidth) > 0.03 ||
      Math.abs(anim.current.opacity - target.current.opacity) > 0.005
    ) {
      animationFrame.current = requestAnimationFrame(animate);
    } else {
      // Snap to target
      anim.current.borderWidth = target.current.borderWidth;
      anim.current.opacity = target.current.opacity;
      if (borderRef.current) {
        borderRef.current.style.borderWidth = `${anim.current.borderWidth}px`;
        borderRef.current.style.opacity = `${anim.current.opacity}`;
      }
      animationFrame.current = null;
    }
  }

  useEffect(() => {
    // When isActive is false, animate to zero opacity and minimum width for smooth fade-out
    if (!isActive) {
      target.current.borderWidth = 4; // Thicker minimum border
      target.current.opacity = 0.0;
      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(animate);
      }
      return;
    }
    // Set new target values based on volume - thicker border for better visibility
    target.current.borderWidth = 4 + (volume * 8); // 4px to 12px (thicker range)
    target.current.opacity = 0.4 + (volume * 0.5); // 0.4 to 0.9 (more visible)
    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(animate);
    }
    // Cleanup
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [volume, isActive]);

  if (!isActive && anim.current.opacity < 0.01) return null;

  // Use a fixed border radius for perfect alignment (20px = rounded-[20px])
  // The border will smoothly fade out and shrink when AI stops talking
  return (
    <div
      ref={borderRef}
      className="absolute inset-0 rounded-[20px] border-indigo-600 transition-all duration-100 ease-out pointer-events-none"
      style={{
        borderWidth: '4px',
        opacity: 0.0,
      }}
    />
  );
};

export interface ConversationViewProps {
  selectedTopics: string[];
  onBackToTopics: () => void;
  onStartConversation: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  externalVideoRef: React.RefObject<HTMLVideoElement | null>;
  onVideoStreamChange: (stream: MediaStream | null) => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ 
  selectedTopics, 
  onBackToTopics,
  onStartConversation,
  isConnected,
  isConnecting,
  externalVideoRef,
  onVideoStreamChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const { volume } = useLiveAPIContext();

  // Tap into the video stream from ControlTray
  const handleVideoStreamChange = (stream: MediaStream | null) => {
    setLocalVideoStream(stream);
    onVideoStreamChange(stream);
  };

  // Set up video stream for left panel
  useEffect(() => {
    if (videoRef.current && localVideoStream) {
      videoRef.current.srcObject = localVideoStream;
    }
  }, [localVideoStream]);

  // Show success toast when connection is established
  useEffect(() => {
    if (isConnected) {
      toast.success("Connection Successful— Say Hi!");
    }
  }, [isConnected]);

  // Stop camera when going back to topics
  const handleBackToTopics = () => {
    // Stop the camera by clearing the stream
    if (localVideoStream) {
      localVideoStream.getTracks().forEach(track => track.stop());
      setLocalVideoStream(null);
      onVideoStreamChange(null);
    }
    onBackToTopics();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {!isConnected ? (
        // Pre-confirm view
        <div className="flex flex-col">
          {/* Row 1: Back Button */}
          <div className="flex-shrink-0 p-4">
            <button 
              onClick={handleBackToTopics}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Topics
            </button>
          </div>

          {/* Row 2: Video Conference Panels */}
          <div className="flex items-center justify-center px-4 py-8">
            <div className="flex gap-4">
              {/* Left Panel: Webcam Feed */}
              <div className="w-[600px] h-[338px] bg-white rounded-[20px] shadow-lg overflow-hidden border border-gray-100">
                <div className="w-full h-full bg-gray-900 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!localVideoStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-800">
                      <svg className="w-20 h-20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium">Camera Disabled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Topics Summary Card */}
              <div className="w-[600px] h-[338px] bg-white rounded-[20px] shadow-lg border border-gray-100">
                <div className="w-full h-full p-4 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Session Summary</h2>
                    <div className="mb-4">
                      <h3 className="text-base font-medium text-gray-700 mb-2">Selected Topics</h3>
                      <div className="space-y-1.5">
                        {selectedTopics.map((topic, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2 text-sm">What to Expect</h4>
                      <ul className="text-xs text-blue-700 space-y-0.5">
                        <li>• Real-time video analysis for emotional cues</li>
                        <li>• Personalized conversation based on your topics</li>
                        <li>• Safe, confidential AI therapy session</li>
                        <li>• Professional therapeutic guidance</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Start Session Button */}
                  <button 
                    onClick={onStartConversation}
                    disabled={isConnecting}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 mt-4"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Therapy Session</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Control Tray */}
          <div className="flex-shrink-0 p-8">
            <div className="flex justify-center">
              <ControlTray 
                videoRef={externalVideoRef}
                supportsVideo={true}
                onVideoStreamChange={handleVideoStreamChange}
              />
            </div>
          </div>
        </div>
      ) : (
        // Connected view - same layout but right panel shows AI therapist
        <div className="flex flex-col">
          {/* Row 1: Back Button */}
          <div className="flex-shrink-0 p-4">
            <button 
              onClick={handleBackToTopics}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Topics
            </button>
          </div>

          {/* Row 2: Video Conference Panels */}
          <div className="flex items-center justify-center px-4 py-8">
            <div className="flex gap-4">
              {/* Left Panel: Webcam Feed */}
              <div className="w-[600px] h-[338px] bg-white rounded-[20px] shadow-2xl overflow-hidden border border-gray-100">
                <div className="w-full h-full bg-gray-900 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!localVideoStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-800">
                      <svg className="w-20 h-20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium">Camera Disabled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: AI Therapist (Grey Person Silhouette) */}
              <div className="w-[600px] h-[338px] rounded-[20px] shadow-lg border border-gray-100 relative overflow-hidden">
                {/* Pulsing Border when AI is speaking */}
                <AIPulsingBorder volume={volume} isActive={isConnected && volume > 0.01} />
                
                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-[20px]">
                  <svg className="w-32 h-32 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-500 font-medium">AI Therapist</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Control Tray */}
          <div className="flex-shrink-0 p-8">
            <div className="flex justify-center">
              <ControlTray 
                videoRef={externalVideoRef}
                supportsVideo={true}
                onVideoStreamChange={handleVideoStreamChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 