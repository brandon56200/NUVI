import React from 'react';
import { useAudioCheck } from '../hooks/use-audio-check';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Gauge, Volume2, Mic, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';

interface AudioCheckViewProps {
  onAudioCheckPassed: () => void;
  onBackToTopics: () => void;
  selectedTopics: string[];
}

export function AudioCheckView({ onAudioCheckPassed, onBackToTopics, selectedTopics }: AudioCheckViewProps) {
  const {
    runAllTests,
    runIndividualTest,
    init,
    isInitialized,
    isRunning,
    progress,
    results,
    error,
    cleanup
  } = useAudioCheck({
    echoTestDuration: 3,
    micTestDuration: 2,
    minMicLevel: 0.001,      // Minimum microphone sensitivity
    maxBackgroundNoise: 0.005, // Maximum allowed background noise
    echoThreshold: 0.05,     // Echo detection threshold  
    targetSampleRate: 24000
  });

  // Initialize once when component mounts
  React.useEffect(() => {
    init();
    
    // Cleanup when component unmounts
    return () => {
      cleanup();
    };
  }, [init, cleanup]);

  const handleRunAllTests = async () => {
    if (!isInitialized) {
      console.warn('Audio system not initialized yet');
      return;
    }
    
    const testResults = await runAllTests();
    if (testResults) {
      console.log('Audio check completed:', testResults);
      
      // If all tests passed, proceed to conversation
      if (testResults.overallPassed) {
        onAudioCheckPassed();
      }
    }
  };

  const handleRunIndividualTest = async (test: 'sample-rate' | 'echo-test' | 'mic-test') => {
    if (!isInitialized) {
      console.warn('Audio system not initialized yet');
      return;
    }
    
    const result = await runIndividualTest(test);
    console.log(`${test} result:`, result);
  };

  const getStageIcon = (stage: string) => {
    const iconClass = "w-6 h-6 text-indigo-700";
    switch (stage) {
      case 'init': return <Settings className={iconClass} />;
      case 'sample-rate': return <Gauge className={iconClass} />;
      case 'echo-test': return <Volume2 className={iconClass} />;
      case 'mic-test': return <Mic className={iconClass} />;
      case 'complete': return <CheckCircle className={iconClass} />;
      case 'error': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Settings className={iconClass} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Audio System Check</h1>
        <p className="text-gray-600">
          Before we begin your therapy session, let's make sure your audio setup is optimized for the best experience.
        </p>
        
        {/* Back Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={onBackToTopics}
            className="mr-4"
          >
            ← Back to Topics
          </Button>
        </div>
      </div>
      
      {/* Initialization Status */}
      {!isInitialized && !error && (
        <Card className="p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-700" />
            <div>
              <h3 className="font-semibold text-indigo-800">Initializing Audio System</h3>
              <p className="text-sm text-indigo-600">
                Please allow microphone access when prompted...
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Audio Tests</h2>
        
        <div className="space-y-4">
          {/* Full Test Suite */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Complete Audio Check</h3>
              <p className="text-sm text-gray-600">
                Run all tests: sample rate, echo test, and microphone check
              </p>
            </div>
            <Button 
              onClick={handleRunAllTests}
              disabled={isRunning || !isInitialized}
              className="ml-4 bg-indigo-700 hover:bg-indigo-800 text-white"
            >
              {!isInitialized ? 'Initializing...' : isRunning ? 'Running...' : 'Run All Tests'}
            </Button>
          </div>

          {/* Individual Tests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-indigo-700" />
                <h4 className="font-medium">Sample Rate Check</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Verify 24kHz+ support</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRunIndividualTest('sample-rate')}
                disabled={isRunning || !isInitialized}
              >
                Test Sample Rate
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-indigo-700" />
                <h4 className="font-medium">Echo Test</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Detect audio feedback</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRunIndividualTest('echo-test')}
                disabled={isRunning || !isInitialized}
              >
                Run Echo Test
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-5 h-5 text-indigo-700" />
                <h4 className="font-medium">Microphone Test</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Check input levels & noise</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRunIndividualTest('mic-test')}
                disabled={isRunning || !isInitialized}
              >
                Test Microphone
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Display */}
      {(progress || isRunning) && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Test Progress</h3>
          
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStageIcon(progress.stage)}
                <div className="flex-1">
                  <p className="font-medium">{progress.message}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{progress.progress}% complete</p>
                </div>
              </div>
              
              {/* Partial Results */}
              {progress.results && Object.keys(progress.results).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-medium text-sm mb-2">Partial Results:</h4>
                  <div className="text-sm space-y-1">
                    {progress.results.sampleRate && (
                      <p>Sample Rate: {progress.results.sampleRate}Hz</p>
                    )}
                    {progress.results.echoTest && (
                      <p>Echo Test: {progress.results.echoTest.passed ? 'Passed' : 'Failed'} 
                         (level: {progress.results.echoTest.echoLevel.toFixed(3)})</p>
                    )}
                    {progress.results.microphoneTest && (
                      <p>Microphone: Level {progress.results.microphoneTest.level.toFixed(3)}, 
                         Noise {progress.results.microphoneTest.noise.toFixed(3)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-indigo-800">Error</h3>
          </div>
          <p className="text-indigo-700">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={cleanup}
            className="mt-3"
          >
            Clear Error
          </Button>
        </Card>
      )}

      {/* Final Results */}
      {results && (
        <Card className="p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-800">Test Results</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">System Check</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  Sample Rate: {results.sampleRate}Hz 
                  {results.sampleRate >= 24000 ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                </li>
                <li className="flex items-center gap-2">
                  Overall: {results.overallPassed ? 'Passed' : 'Issues detected'}
                  {results.overallPassed ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  }
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Audio Quality</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  Echo Test: {results.echoTest.passed ? 'Passed' : 'Failed'} 
                  (level: {results.echoTest.echoLevel.toFixed(3)})
                  {results.echoTest.passed ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                </li>
                <li>Mic Level: {results.microphoneTest.level.toFixed(3)}</li>
                <li>Background Noise: {results.microphoneTest.noise.toFixed(3)}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-sm mb-3">
              <strong>Recommendation:</strong>{' '}
              {results.overallPassed 
                ? 'Your audio setup is ready for high-quality conversations!' 
                : results.echoTest.passed 
                  ? 'Audio setup is mostly good. Consider using headphones for best experience.'
                  : 'Please use headphones to prevent echo and improve audio quality.'
              }
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {results.overallPassed ? (
                <Button 
                  onClick={onAudioCheckPassed}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Continue to Session
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Fix Setup & Retry
                  </Button>
                  <Button 
                    onClick={onAudioCheckPassed}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white"
                  >
                    <AlertCircle className="w-4 h-4 mr-2 text-white" />
                    Proceed Anyway
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 