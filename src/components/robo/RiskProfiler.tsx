import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const questions = [
  {
    id: 1,
    question: "What is your investment experience?",
    options: [
      { value: "beginner", label: "Beginner (0-2 years)", score: 1 },
      { value: "intermediate", label: "Intermediate (2-5 years)", score: 2 },
      { value: "experienced", label: "Experienced (5-10 years)", score: 3 },
      { value: "expert", label: "Expert (10+ years)", score: 4 }
    ]
  },
  {
    id: 2,
    question: "What percentage of your income can you invest?",
    options: [
      { value: "low", label: "Less than 10%", score: 1 },
      { value: "moderate", label: "10-25%", score: 2 },
      { value: "high", label: "25-50%", score: 3 },
      { value: "very-high", label: "More than 50%", score: 4 }
    ]
  },
  {
    id: 3,
    question: "How would you react to a 20% portfolio loss?",
    options: [
      { value: "panic", label: "Sell everything immediately", score: 1 },
      { value: "worried", label: "Consider selling some positions", score: 2 },
      { value: "calm", label: "Hold and wait for recovery", score: 3 },
      { value: "opportunistic", label: "Buy more at lower prices", score: 4 }
    ]
  },
  {
    id: 4,
    question: "What is your investment goal?",
    options: [
      { value: "preservation", label: "Capital preservation", score: 1 },
      { value: "income", label: "Steady income", score: 2 },
      { value: "growth", label: "Long-term growth", score: 3 },
      { value: "aggressive", label: "Maximum returns", score: 4 }
    ]
  },
  {
    id: 5,
    question: "What is your investment timeline?",
    options: [
      { value: "short", label: "Less than 1 year", score: 1 },
      { value: "medium", label: "1-3 years", score: 2 },
      { value: "long", label: "3-10 years", score: 3 },
      { value: "very-long", label: "More than 10 years", score: 4 }
    ]
  }
];

export function RiskProfiler({ onComplete }: { onComplete?: (profile: any) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [profile, setProfile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnswer = (value: string) => {
    const question = questions[currentQuestion];
    const selectedOption = question.options.find(opt => opt.value === value);
    
    setAnswers({ ...answers, [question.id]: value });
    
    if (selectedOption) {
      setScore(score + selectedOption.score);
    }
  };

  const handleNext = () => {
    if (!answers[questions[currentQuestion].id]) {
      toast({
        title: "Please select an answer",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateProfile();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateProfile = () => {
    const avgScore = score / questions.length;
    let riskProfile = '';
    
    if (avgScore <= 1.5) {
      riskProfile = 'Conservative';
    } else if (avgScore <= 2.5) {
      riskProfile = 'Moderate';
    } else if (avgScore <= 3.5) {
      riskProfile = 'Aggressive';
    } else {
      riskProfile = 'Very Aggressive';
    }

    setProfile(riskProfile);
    
    if (onComplete) {
      onComplete({
        profile: riskProfile,
        score: avgScore,
        answers
      });
    }

    toast({
      title: "Risk Profile Complete",
      description: `Your risk profile is: ${riskProfile}`,
    });
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (profile) {
    return (
      <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Your Risk Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
              profile === 'Conservative' ? 'bg-blue-500/20 text-blue-500' :
              profile === 'Moderate' ? 'bg-green-500/20 text-green-500' :
              profile === 'Aggressive' ? 'bg-orange-500/20 text-orange-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              <TrendingUp className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{profile} Investor</h3>
            <p className="text-muted-foreground">
              {profile === 'Conservative' && "You prefer stable, low-risk investments with predictable returns."}
              {profile === 'Moderate' && "You seek a balance between growth and stability."}
              {profile === 'Aggressive' && "You're comfortable with higher risk for potentially higher returns."}
              {profile === 'Very Aggressive' && "You actively seek high-risk, high-reward opportunities."}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Recommended Allocation</h4>
              <div className="space-y-2">
                {profile === 'Conservative' && (
                  <>
                    <div className="flex justify-between">
                      <span>Bonds & Fixed Income</span>
                      <span className="font-bold">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stocks</span>
                      <span className="font-bold">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alternative Assets</span>
                      <span className="font-bold">10%</span>
                    </div>
                  </>
                )}
                {profile === 'Moderate' && (
                  <>
                    <div className="flex justify-between">
                      <span>Stocks</span>
                      <span className="font-bold">50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonds & Fixed Income</span>
                      <span className="font-bold">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alternative Assets</span>
                      <span className="font-bold">15%</span>
                    </div>
                  </>
                )}
                {(profile === 'Aggressive' || profile === 'Very Aggressive') && (
                  <>
                    <div className="flex justify-between">
                      <span>Stocks</span>
                      <span className="font-bold">{profile === 'Aggressive' ? '70%' : '80%'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alternative Assets</span>
                      <span className="font-bold">{profile === 'Aggressive' ? '20%' : '15%'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonds & Fixed Income</span>
                      <span className="font-bold">{profile === 'Aggressive' ? '10%' : '5%'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers({});
              setScore(0);
              setProfile(null);
            }}
            variant="outline"
            className="w-full"
          >
            Retake Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background/95 via-background/98 to-background border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          Risk Assessment
        </CardTitle>
        <CardDescription>
          Question {currentQuestion + 1} of {questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="h-2" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {questions[currentQuestion].question}
          </h3>

          <RadioGroup
            value={answers[questions[currentQuestion].id] || ''}
            onValueChange={handleAnswer}
          >
            {questions[currentQuestion].options.map(option => (
              <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-background/50">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button onClick={handleNext}>
            {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}