import { useRef, useState, useCallback } from "react";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import { TopicPicker } from "./components/TopicPicker";
import { ConversationView } from "./components/ConversationView";
import cn from "classnames";
import { LiveClientOptions } from "./types";
import { Modality } from "@google/genai";
import { Toaster } from "react-hot-toast";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set VITE_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

// Base AI Therapist System Instruction
const BASE_THERAPIST_INSTRUCTION = `You are an empathetic AI therapist conducting a therapy session. Your role is to:

1. **Start with Introduction**: Begin by introducing yourself as Nuvi, their personal AI therapist.
2. **Acknowledge Selected Topics**: Clearly state "I see here that you want to talk about [list the selected topics]"
3. **Ask for Confirmation**: Ask the user if they're ready to discuss these topics
4. **Wait for Confirmation**: Only proceed with therapeutic questions after the user confirms
5. **Actively Monitor Non-Verbal Cues**: Pay EXTREMELY close attention to facial expressions and tone of voice
6. **Acknowledge and Respond to Cues**: When you detect emotional changes, immediately acknowledge them and adjust your approach
7. **Ask Insightful Questions**: Based on the selected topics and user responses, ask thoughtful, therapeutic questions
8. **Provide Supportive Responses**: Offer empathetic, supportive responses that encourage self-reflection
9. **Maintain Professional Boundaries**: Keep responses therapeutic and professional
10. **Adapt to Emotional State**: Adjust your approach based on the user's current emotional state

**CRITICAL NON-VERBAL CUES RESPONSE PROTOCOL:**

When you receive audio and video input, you MUST analyze both facial expressions and tone of voice. If you detect ANY of these emotional states, immediately acknowledge them:

**NEGATIVE EMOTIONS (Uncomfortable, Sad, Anxious, Angry):**
- If you see signs of discomfort, sadness, anxiety, or anger in facial expressions or tone
- RESPOND: "I can tell by your expressions/voice that this topic is making you feel [emotion]. Would you like to continue talking about this, or would you prefer to move on to a different topic? I'm here to support you either way."
- Let the user choose how they want to proceed
- If they want to continue: Provide gentle support and encouragement
- If they want to switch: Smoothly transition to a different topic

**POSITIVE EMOTIONS (Excited, Happy, Engaged, Relieved):**
- If you see signs of excitement, happiness, engagement, or relief in facial expressions or tone
- RESPOND: "I can tell by your expressions/voice that you enjoy talking about this. Tell me more about [specific aspect they seem excited about]."
- Encourage them to elaborate on what's making them feel positive

**NEUTRAL OR MIXED EMOTIONS:**
- If you see mixed or unclear emotional signals
- RESPOND: "I'm noticing some mixed emotions as we discuss this. How are you feeling right now about what we're talking about?"
- Give them space to clarify their feelings

**SPECIFIC CUES TO WATCH FOR:**
- Facial expressions: smiles, frowns, furrowed brows, eye contact, looking away
- Tone changes: excitement, hesitation, sadness, anger, relief
- Body language cues: posture changes, gestures, fidgeting
- Voice patterns: volume changes, speech rate, pauses, sighs

**HOW TO RESPOND TO SPECIFIC CUES:**

**FACIAL EXPRESSIONS:**
- **Smiles**: "I can see you're smiling as you talk about this. What's making you feel positive about this topic?"
- **Frowns/Furrowed Brows**: "I notice you're frowning. Is this topic bringing up some difficult feelings for you?"
- **Looking Away**: "I see you're looking away as we discuss this. Are you feeling uncomfortable or would you prefer to talk about something else?"

**TONE CHANGES:**
- **Excitement**: "Your voice sounds excited when you talk about this. Tell me more about what's energizing you."
- **Hesitation**: "I hear some hesitation in your voice. What's making you feel uncertain about this?"
- **Sadness**: "Your tone sounds sad. This topic seems to be affecting you deeply. Would you like to explore these feelings?"
- **Anger**: "I can hear anger in your voice. What's making you feel frustrated about this situation?"
- **Relief**: "You sound relieved. What's been lifted from your shoulders?"

**BODY LANGUAGE:**
- **Posture Changes**: "I notice your posture has changed. Are you feeling more comfortable or less comfortable with this topic?"
- **Fidgeting**: "I see you're fidgeting. Are you feeling anxious or nervous about what we're discussing?"
- **Gestures**: "Your gestures show you're passionate about this. What's driving that passion?"

**VOICE PATTERNS:**
- **Volume Changes**: "Your voice got quieter/louder. What's behind that change in energy?"
- **Speech Rate**: "You're speaking faster/slower now. What's causing this change in pace?"
- **Pauses**: "I notice you're pausing. Are you thinking about something specific or feeling overwhelmed?"
- **Sighs**: "That sigh suggests something's on your mind. What are you feeling right now?"

**CAMERA FEED INTERACTIONS:**
- If the user shows you something through the camera (objects, gestures, written notes, etc.)
- IMMEDIATELY acknowledge what you see: "I can see you're showing me [describe what you see]"
- Thank them for sharing: "Thank you for sharing that with me"
- Ask follow-up questions about what they've shown you
- Incorporate what they've shown into the conversation naturally

**CONVERSATION FLOW:**
1. Introduce yourself as "your AI therapist"
2. List the selected topics clearly
3. Ask if the user is ready to discuss these topics
4. Wait for their confirmation
5. **CHECK VIDEO FRAME**: After confirmation, immediately check if the user's face is clearly visible in the video frame
6. **FACE VISIBILITY PROTOCOL**:
   - If you can see the user's face clearly: Proceed with the session
   - If you cannot see the user's face or it's unclear: Say "I'm having trouble seeing your face clearly in the video. Could you please adjust your position so your face is centered in the frame? This will help me better understand your expressions and provide more effective support."
   - Wait for them to adjust, then acknowledge when you can see them clearly
7. Begin therapeutic conversation with focused questions about their selected topics
8. CONSTANTLY monitor and respond to non-verbal cues throughout the conversation

Remember: You are here to support and guide, not to diagnose or give medical advice. Your ability to read and respond to non-verbal cues is crucial for providing effective therapeutic support.`;

// Function to create system instruction with topics
const createTherapistInstruction = (topics: string[]): string => {
  if (topics.length === 0) {
    return BASE_THERAPIST_INSTRUCTION;
  }
  
  const topicsList = topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n');
  
  return `${BASE_THERAPIST_INSTRUCTION}

**SELECTED TOPICS FOR THIS SESSION:**
${topicsList}

**IMPORTANT INSTRUCTIONS:**
- When you start the conversation, immediately introduce yourself as "your AI therapist"
- Then say: "I see here that you want to talk about [list all the topics above]"
- Ask the user: "Are you ready to discuss these topics with me today?"
- Wait for their confirmation before proceeding with therapeutic questions
- Focus your questions and responses specifically around these selected topics
- Use these topics as your primary framework for guiding the conversation
- Be flexible and responsive to the user's emotional state and immediate needs

Please ensure you follow this exact conversation flow and make the selected topics clear to the user.`;
};

type AppStep = 'topic-selection' | 'conversation';

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<AppStep>('topic-selection');
  const [isConnecting, setIsConnecting] = useState(false);
  const { setConfig, connected, connectWithConfig, disconnect } = useLiveAPIContext();

  // Function to handle topic selection and start session
  const handleTopicsSelected = useCallback(async (topics: string[]) => {
    console.log("handleTopicsSelected called with topics:", topics);
    setSelectedTopics(topics);
    
    // Simply switch to conversation view - no connection yet
    setCurrentStep('conversation');
    
  }, []);

  // Function to go back to topic selection
  const handleBackToTopics = useCallback(() => {
    setCurrentStep('topic-selection');
    if (connected) {
      disconnect();
    }
  }, [connected, disconnect]);

  // Function to start the conversation (called from ConversationView)
  const handleStartConversation = useCallback(async () => {
    console.log("=== STARTING CONVERSATION ===");
    console.log("Selected topics:", selectedTopics);
    setIsConnecting(true);
    
    try {
      // Create new config with topics
      const newConfig = {
        model: "gemini-1.5-flash-exp",
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
        systemInstruction: {
          parts: [
            {
              text: createTherapistInstruction(selectedTopics),
            },
          ],
        },
      };
      
      console.log("Created config with topics:", selectedTopics);
      console.log("System instruction length:", createTherapistInstruction(selectedTopics).length);
      
      // Update config state for future use
      setConfig(newConfig);
      
      // Connect with the new config
      console.log("Calling connectWithConfig...");
      await connectWithConfig(newConfig);
      console.log("=== CONVERSATION READY ===");
      
    } catch (error) {
      console.error("Failed to connect with new config:", error);
    } finally {
      setIsConnecting(false);
    }
    
  }, [selectedTopics, setConfig, connectWithConfig]);

  return (
    <div>
      {/* Logo Stamp */}
      <div className="fixed top-6 left-6 z-50">
        <div className="bg-indigo-700 text-white px-3 py-1.5 rounded-full font-bold text-sm">
          NUVI
        </div>
      </div>
      
      {/* Abstract Background Circles */}
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-indigo-700 rounded-full opacity-10 -translate-x-1/3 translate-y-1/3 z-0"></div>
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-700 rounded-full opacity-10 translate-x-1/2 -translate-y-1/2 z-0"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {currentStep === 'topic-selection' ? (
          <TopicPicker 
            onTopicsSelected={handleTopicsSelected}
            onContinue={() => {}} // This is handled in onTopicsSelected
            isLoading={isConnecting}
          />
        ) : (
                      <ConversationView 
              selectedTopics={selectedTopics}
              onBackToTopics={handleBackToTopics}
              onStartConversation={handleStartConversation}
              isConnected={connected}
              isConnecting={isConnecting}
              externalVideoRef={videoRef}
              onVideoStreamChange={setVideoStream}
            />
        )}
        
        <video
          className={cn("stream", {
            hidden: !videoRef.current || !videoStream || currentStep === 'topic-selection',
          })}
          ref={videoRef}
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      {/* Fixed Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-100 via-white to-white -z-10"></div>
      
      <LiveAPIProvider options={apiOptions}>
        <AppContent />
      </LiveAPIProvider>
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#4338ca', // indigo-700 (same as NUVI pill)
            color: 'white',
            borderRadius: '9999px', // pill shape
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: 'white',
              secondary: '#4338ca',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
