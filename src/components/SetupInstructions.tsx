import { useState } from "react";
import { CheckCircle, Circle, ExternalLink, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
  link?: {
    url: string;
    text: string;
  };
}

const SETUP_STEPS: Step[] = [
  {
    id: 1,
    title: "Create a Facebook Developer Account",
    description: "Sign up for a Meta Developer account if you don't have one.",
    details: [
      "Go to developers.facebook.com",
      "Click 'Get Started' and log in with your Facebook account",
      "Complete the verification process"
    ],
    link: {
      url: "https://developers.facebook.com/",
      text: "Open Facebook Developers"
    }
  },
  {
    id: 2,
    title: "Create a New App",
    description: "Set up a new app for WhatsApp integration.",
    details: [
      "In the Meta Developer dashboard, click 'Create App'",
      "Select 'Business' as the app type",
      "Fill in your app name and contact email",
      "Click 'Create App'"
    ]
  },
  {
    id: 3,
    title: "Add WhatsApp Product",
    description: "Enable WhatsApp Cloud API for your app.",
    details: [
      "In your app dashboard, find 'Add Products to Your App'",
      "Click 'Set Up' on WhatsApp",
      "Complete the onboarding wizard"
    ]
  },
  {
    id: 4,
    title: "Get Your Access Token",
    description: "Generate a temporary or permanent access token.",
    details: [
      "Go to WhatsApp > API Setup in your app",
      "Copy the 'Temporary access token' for testing",
      "For production, create a System User and generate a permanent token",
      "Save this as WHATSAPP_ACCESS_TOKEN in your Lovable Cloud secrets"
    ]
  },
  {
    id: 5,
    title: "Get Your Phone Number ID",
    description: "Find your WhatsApp Business phone number ID.",
    details: [
      "In WhatsApp > API Setup, find 'Phone number ID'",
      "Copy this value",
      "Save this as WHATSAPP_PHONE_NUMBER_ID in your secrets"
    ]
  },
  {
    id: 6,
    title: "Add Test Phone Number",
    description: "Add your phone number to receive test messages.",
    details: [
      "In WhatsApp > API Setup, find 'To' section",
      "Click 'Add phone number'",
      "Enter your phone number and verify with SMS code",
      "You can now send test messages to this number"
    ]
  },
  {
    id: 7,
    title: "Configure Webhook",
    description: "Set up the webhook to receive incoming messages.",
    details: [
      "Go to WhatsApp > Configuration",
      "Click 'Edit' next to Webhook",
      "Enter your webhook URL (see below)",
      "Enter your verify token (save as WHATSAPP_VERIFY_TOKEN)",
      "Click 'Verify and Save'"
    ]
  },
  {
    id: 8,
    title: "Subscribe to Messages",
    description: "Enable message notifications for your webhook.",
    details: [
      "In WhatsApp > Configuration > Webhook fields",
      "Click 'Manage'",
      "Subscribe to 'messages' field",
      "You're now ready to receive messages!"
    ]
  }
];

const SetupInstructions = () => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState(false);

  const toggleStep = (stepId: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;
  
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL");
    }
  };

  return (
    <div className="space-y-6">
      {/* Webhook URL Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-display text-lg">Your Webhook URL</CardTitle>
          <CardDescription>
            Use this URL when configuring the webhook in Facebook Developer Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyWebhookUrl}
              className="flex-shrink-0"
            >
              {copiedUrl ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {SETUP_STEPS.map((step) => (
          <Card
            key={step.id}
            className={`cursor-pointer transition-all duration-200 ${
              completedSteps.has(step.id)
                ? "bg-primary/5 border-primary/20"
                : "hover:shadow-soft"
            }`}
            onClick={() => toggleStep(step.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <span className="text-muted-foreground font-normal">Step {step.id}:</span>
                    {step.title}
                  </CardTitle>
                  <CardDescription className="mt-1">{step.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pl-14">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {step.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
              {step.link && (
                <Button
                  variant="link"
                  className="mt-3 p-0 h-auto text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(step.link?.url, "_blank");
                  }}
                >
                  {step.link.text}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Endpoint */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="font-display text-lg">Test Your Setup</CardTitle>
          <CardDescription>
            Use this endpoint to test sending messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
            {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wa-test?to=YOUR_PHONE&text=Hello`}
          </code>
          <p className="text-sm text-muted-foreground mt-3">
            Replace <code className="bg-muted px-1 rounded">YOUR_PHONE</code> with your verified phone number (with country code, e.g., 5511999999999).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupInstructions;
