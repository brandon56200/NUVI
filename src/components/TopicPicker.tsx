import React, { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface TopicCategory {
  id: string;
  title: string;
  topics: string[];
}

export interface TopicPickerProps {
  onTopicsSelected: (topics: string[]) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'mental-emotional',
    title: 'Mental & Emotional Health',
    topics: [
      'Anxiety or panic attacks',
      'Depression or persistent sadness',
      'Chronic stress or overwhelm',
      'Emotional numbness or instability',
      'Low self-esteem or inner critic'
    ]
  },
  {
    id: 'relationships-social',
    title: 'Relationships & Social',
    topics: [
      'Romantic relationship challenges',
      'Family conflict or boundaries',
      'Friendship issues or isolation',
      'Social anxiety or fear of rejection',
      'Attachment styles or codependency'
    ]
  },
  {
    id: 'work-school-ambition',
    title: 'Work, School & Ambition',
    topics: [
      'Career direction or dissatisfaction',
      'Burnout or overwork',
      'Procrastination or motivation struggles',
      'Imposter syndrome',
      'Workplace or academic conflict'
    ]
  },
  {
    id: 'self-discovery-identity',
    title: 'Self-Discovery & Identity',
    topics: [
      'Personal values and life purpose',
      'Identity exploration (gender, sexuality, culture)',
      'Recognizing behavior patterns',
      'Self-worth and self-image',
      'Inner child or past self-reflection'
    ]
  },
  {
    id: 'trauma-grief-transitions',
    title: 'Trauma, Grief & Transitions',
    topics: [
      'Processing past trauma',
      'Grieving loss or change',
      'Navigating major life transitions',
      'Fear of the future or uncertainty',
      'Coping with emotional triggers'
    ]
  },
  {
    id: 'habits-health-daily',
    title: 'Habits, Health & Daily Life',
    topics: [
      'Building healthy routines',
      'Sleep or fatigue issues',
      'Substance use or compulsive habits',
      'Body image or eating concerns',
      'Time management and balance'
    ]
  }
];

export const TopicPicker: React.FC<TopicPickerProps> = ({ onTopicsSelected, onContinue, isLoading = false }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        // Limit to 5 topics maximum
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, topic];
      }
    });
  };

  const handleContinue = () => {
    if (selectedTopics.length > 0) {
      onTopicsSelected(selectedTopics);
      onContinue();
    }
  };

  const isTopicSelected = (topic: string) => selectedTopics.includes(topic);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-7xl flex flex-col space-y-8">
        {/* Row 1: Title and Instructions */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Choose Your Focus Areas
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
            Select some topics you'd like to discuss in your therapy session. This helps your AI therapist provide more personalized support.
          </p>
        </div>

        {/* Row 2: Topic Tracker and Carousel */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Topic Tracker */}
          <div className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            {selectedTopics.length}/5 topics selected
          </div>

          {/* Carousel */}
          <div className="w-full max-w-6xl pb-4">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {TOPIC_CATEGORIES.map((category) => (
                  <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4 pb-4">
                    <Card className="h-full border border-indigo-100 bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {category.topics.map((topic) => (
                          <label key={topic} className="flex items-start space-x-3 cursor-pointer group">
                            <div className="relative flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                checked={isTopicSelected(topic)}
                                onChange={() => handleTopicToggle(topic)}
                                disabled={(!isTopicSelected(topic) && selectedTopics.length >= 5) || isLoading}
                                className="sr-only"
                              />
                              <div className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                                ${isTopicSelected(topic) 
                                  ? 'bg-indigo-500 border-indigo-500' 
                                  : 'border-indigo-100 group-hover:border-indigo-400'
                                }
                                ${(!isTopicSelected(topic) && selectedTopics.length >= 5) || isLoading
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'cursor-pointer'
                                }
                              `}>
                                {isTopicSelected(topic) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>
                            <span className={`
                              text-sm leading-relaxed transition-colors duration-200
                              ${isTopicSelected(topic) 
                                ? 'text-indigo-700 font-medium' 
                                : 'text-gray-700 group-hover:text-gray-900'
                              }
                              ${(!isTopicSelected(topic) && selectedTopics.length >= 5) || isLoading
                                ? 'opacity-50'
                                : ''
                              }
                            `}>
                              {topic}
                            </span>
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>

        {/* Row 3: Continue Button */}
        <div className="flex-1 flex items-center justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={selectedTopics.length === 0 || isLoading}
            className={`
              px-8 py-4 text-lg font-semibold transition-all duration-200 transform
              ${selectedTopics.length > 0 && !isLoading
                ? 'hover:scale-105'
                : ''
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Connecting...
              </>
            ) : (
              <>
                Continue to Session
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </Button>
        </div>

        {/* Helper text */}
        <div className="h-6 flex items-center justify-center">
          {selectedTopics.length === 0 && (
            <p className="text-gray-500 text-sm text-center">
              Please select at least one topic to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 