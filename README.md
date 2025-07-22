# 🧠 NUVI - AI Therapy Assistant

NUVI is an innovative AI-powered therapy application that provides real-time, empathetic conversations with advanced non-verbal cue detection. Built with cutting-edge technology, NUVI offers a safe, confidential space for therapeutic dialogue enhanced by facial expression and tone analysis.

![NUVI Demo](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Vite](https://img.shields.io/badge/Vite-7.0.4-purple)

## ✨ Features

- **🎯 Topic-Based Therapy**: Select from predefined therapy topics for focused sessions
- **🎥 Real-Time Video Analysis**: Advanced facial expression and body language detection
- **🎤 Audio Processing**: Tone analysis for emotional state recognition
- **🤖 AI-Powered Responses**: Empathetic, context-aware therapeutic conversations
- **🎨 Modern UI**: Beautiful, responsive interface with smooth animations
- **🔒 Privacy-First**: Local processing with secure API communication
- **📱 Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 Get Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nuvi
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file in the root directory
   echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env
   ```
   
   **Note**: Replace `your_api_key_here` with your actual Google Gemini API key.

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to start using NUVI!

### Production Build

1. **Build the application**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Preview the production build**
   ```bash
   npm run preview
   # or
   yarn preview
   ```

3. **Deploy**
   The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 🔧 Technical Details

### 🛠️ Technology Stack

**Frontend Framework**
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.0.4** - Fast build tool and dev server

**Styling & UI**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Elegant notifications

**AI & Communication**
- **Google GenAI SDK 0.14.0** - Gemini API integration
- **WebRTC** - Real-time audio/video streaming
- **Web Audio API** - Audio processing and analysis

**State Management & Utilities**
- **Zustand 5.0.1** - Lightweight state management
- **EventEmitter3** - Event handling
- **Lodash** - Utility functions

**Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

### 🤖 Gemini AI Integration

NUVI leverages Google's Gemini 1.5 Flash model for:
- **Real-time conversation**: Low-latency, natural dialogue
- **Context awareness**: Remembers session context and user preferences
- **Emotional intelligence**: Responds to detected emotional states
- **Therapeutic guidance**: Provides supportive, professional responses

**Key Features:**
- **Multimodal input**: Processes both audio and video streams
- **Non-verbal cue detection**: Analyzes facial expressions and tone
- **Adaptive responses**: Adjusts communication style based on user state
- **Topic focus**: Maintains conversation around selected therapy topics

### 🎥 Real-Time Processing

**Video Analysis**
- Facial expression detection (smiles, frowns, eye contact)
- Body language analysis (posture, gestures, fidgeting)
- Real-time frame processing at 60fps

**Audio Processing**
- Tone analysis (excitement, hesitation, sadness, anger)
- Voice pattern recognition (volume, speech rate, pauses)
- PCM16 audio streaming for high-quality analysis

### 🏗️ Architecture

```
src/
├── components/          # React components
│   ├── ConversationView.tsx    # Main therapy interface
│   ├── TopicPicker.tsx         # Topic selection
│   ├── ControlTray.tsx         # Audio/video controls
│   └── ...
├── contexts/            # React contexts
│   └── LiveAPIContext.tsx      # Gemini API context
├── hooks/               # Custom React hooks
│   ├── use-live-api.ts         # API integration
│   ├── use-webcam.ts           # Camera management
│   └── ...
├── lib/                 # Core libraries
│   ├── genai-live-client.ts    # Gemini client
│   ├── audio-recorder.ts       # Audio processing
│   ├── audio-streamer.ts       # Audio playback
│   └── ...
└── types.ts             # TypeScript definitions
```

## 🎯 Usage Guide

### Starting a Session

1. **Select Topics**: Choose 1-5 therapy topics that resonate with you
2. **Enable Camera**: Allow camera access for facial expression analysis
3. **Enable Microphone**: Allow microphone access for voice analysis
4. **Start Session**: Click "Start Therapy Session" to begin
5. **Begin Conversation**: Start talking naturally - NUVI will respond empathetically

### Understanding the Interface

- **Left Panel**: Your video feed with real-time analysis
- **Right Panel**: AI therapist with pulsing border indicating active speech
- **Control Tray**: Camera, microphone, and session controls
- **Topic Summary**: Review selected topics before starting

### Best Practices

- **Good Lighting**: Ensure your face is well-lit for better expression detection
- **Clear Audio**: Use a quiet environment for optimal voice analysis
- **Eye Contact**: Maintain natural eye contact with the camera
- **Open Communication**: Be honest and open for the most effective sessions

## 🔒 Privacy & Security

- **Local Processing**: Video and audio analysis happens locally
- **Secure API**: All communication with Gemini API is encrypted
- **No Data Storage**: Conversations are not stored or logged
- **User Control**: Full control over camera and microphone access

## 🐛 Troubleshooting

### Common Issues

**Camera Not Working**
- Check browser permissions
- Ensure no other applications are using the camera
- Try refreshing the page

**Audio Issues**
- Check microphone permissions
- Ensure system audio is working
- Verify browser supports Web Audio API

**API Connection Problems**
- Verify your Gemini API key is correct
- Check internet connection
- Ensure API key has proper permissions

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile Browsers**: Limited support (desktop recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini Team** for the powerful AI capabilities
- **React Community** for the excellent framework
- **Tailwind CSS** for the beautiful styling system
- **Open Source Contributors** for the amazing libraries

---

**Made with ❤️ for better mental health support**
