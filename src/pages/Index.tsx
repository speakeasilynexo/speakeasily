import { MessageCircle, BookOpen, Trophy, CheckCircle, ArrowRight, Smartphone, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SetupInstructions from "@/components/SetupInstructions";

const Index = () => {
  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">SpeakEasily</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#setup" className="text-muted-foreground hover:text-foreground transition-colors">
              Setup
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>WhatsApp-powered English Learning</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
              Learn English
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Where You Already Chat
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance">
              An intelligent chatbot that helps you improve your English skills through WhatsApp. 
              Get personalized lessons, practice exercises, and instant feedback.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-hero text-lg px-8 py-6 shadow-elevated">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Learning
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Documentation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="mt-16 relative max-w-sm mx-auto">
            <div className="absolute inset-0 gradient-hero opacity-20 blur-3xl rounded-full" />
            <div className="relative bg-card rounded-3xl shadow-elevated border border-border p-4">
              <div className="bg-muted rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full gradient-hero flex-shrink-0" />
                  <div className="bg-card rounded-2xl rounded-tl-sm p-3 shadow-soft max-w-[80%]">
                    <p className="text-sm">🎓 Welcome to SpeakEasily! I'm your English learning assistant.</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                    <p className="text-sm">Hi! I want to learn English.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full gradient-hero flex-shrink-0" />
                  <div className="bg-card rounded-2xl rounded-tl-sm p-3 shadow-soft max-w-[80%]">
                    <p className="text-sm">Perfect! Let's start with a quick assessment to find your level. 🚀</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Learn
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete learning experience delivered through the app you already use every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-soft hover:shadow-elevated transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="font-display">Level Assessment</CardTitle>
                <CardDescription>
                  Quick 3-question test to determine your current English level and personalize your learning path.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-elevated transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="font-display">Daily Lessons</CardTitle>
                <CardDescription>
                  Bite-sized grammar lessons and vocabulary practice tailored to your level.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-elevated transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="font-display">Exercises & Feedback</CardTitle>
                <CardDescription>
                  Interactive exercises with instant feedback to reinforce your learning.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in minutes with our simple setup process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">1. Connect WhatsApp</h3>
              <p className="text-muted-foreground">
                Set up your WhatsApp Business API and connect it to our webhook.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">2. Take Assessment</h3>
              <p className="text-muted-foreground">
                Send a message to start the level assessment and get your personalized learning path.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">3. Start Learning</h3>
              <p className="text-muted-foreground">
                Receive daily lessons and exercises right in your WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Instructions */}
      <section id="setup" className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Setup Guide
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Follow these steps to configure your WhatsApp Cloud API integration.
            </p>
          </div>

          <SetupInstructions />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold">SpeakEasily</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SpeakEasily. Powered by WhatsApp Cloud API.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
