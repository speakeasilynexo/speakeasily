import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageCircle, BookOpen, Target, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface UserData {
  wa_id: string;
  name: string | null;
  level: string | null;
  subscription_status: string;
  created_at: string;
}

interface StateData {
  step: string;
  data: {
    progress?: {
      current_day: number;
      total_lessons_completed: number;
      exercises_completed: number;
      mistake_tags?: Array<{ tag: string; count: number; last_seen: string }>;
      trial?: {
        trial_started_at: string;
        lessons_completed: number;
        trial_status: string;
      };
      goal?: string;
    };
  };
}

interface EventData {
  id: string;
  created_at: string;
  event_type: string;
  metadata: Record<string, unknown>;
}

const LEVEL_NAMES: Record<string, string> = {
  beginner: "Principiante (A1) 🌱",
  elementary: "Elemental (A2) 📗",
  pre_intermediate: "Pre-Intermedio (B1) 📘",
  intermediate: "Intermedio (B2) 📙",
  upper_intermediate: "Intermedio-Alto (C1) 📕",
  advanced: "Avanzado (C2) 🎓",
};

const GOAL_NAMES: Record<string, string> = {
  work: "🏢 Profesional",
  travel: "✈️ Viajes",
  conversation: "💬 Conversación",
  general: "📚 General",
};

const EVENT_ICONS: Record<string, typeof BookOpen> = {
  lesson_completed: CheckCircle2,
  lesson_started: BookOpen,
  exercise_answered: Target,
  checkpoint_passed: CheckCircle2,
  checkpoint_failed: AlertCircle,
  placement_completed: TrendingUp,
  message_received: MessageCircle,
  message_sent: MessageCircle,
};

export default function StudentProgress() {
  const { waId } = useParams<{ waId: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [state, setState] = useState<StateData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!waId) {
        setError("ID de usuario no proporcionado");
        setLoading(false);
        return;
      }

      try {
        // Fetch user
        const { data: userData, error: userError } = await supabase
          .from("wa_users")
          .select("*")
          .eq("wa_id", waId)
          .maybeSingle();

        if (userError) throw userError;
        if (!userData) {
          setError("Usuario no encontrado");
          setLoading(false);
          return;
        }
        setUser(userData as UserData);

        // Fetch state
        const { data: stateData, error: stateError } = await supabase
          .from("wa_state")
          .select("step, data")
          .eq("wa_id", waId)
          .maybeSingle();

        if (stateError) throw stateError;
        setState(stateData as StateData);

        // Fetch recent events
        const { data: eventsData, error: eventsError } = await supabase
          .from("wa_events")
          .select("*")
          .eq("wa_id", waId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (eventsError) throw eventsError;
        setEvents(eventsData as EventData[]);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [waId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando progreso...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "Usuario no encontrado"}</p>
            <Link to="/" className="mt-4 inline-block">
              <Button variant="outline">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = state?.data?.progress;
  const trial = progress?.trial;
  const mistakeTags = progress?.mistake_tags || [];
  const topMistakes = [...mistakeTags].sort((a, b) => b.count - a.count).slice(0, 5);

  const dayProgress = progress ? Math.round((progress.current_day / 7) * 100) : 0;
  const trialDaysLeft = trial ? Math.max(0, 7 - Math.floor((Date.now() - new Date(trial.trial_started_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const trialLessonsLeft = trial ? Math.max(0, 20 - trial.lessons_completed) : 0;

  const relevantEvents = events.filter(e => 
    ["lesson_completed", "lesson_started", "exercise_answered", "checkpoint_passed", 
     "checkpoint_failed", "placement_completed", "production_submitted", "review_completed"].includes(e.event_type)
  ).slice(0, 10);

  const whatsappLink = "https://wa.me/34657100100?text=NEXT";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">📊 Tu Progreso</h1>
              <p className="text-muted-foreground">
                {user.name || "Estudiante"} • SpeakEasily
              </p>
            </div>
            <a href={whatsappLink}>
              <Button className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Volver al WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Nivel</CardDescription>
              <CardTitle className="text-lg">
                {user.level ? LEVEL_NAMES[user.level] || user.level : "Sin evaluar"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Día Actual</CardDescription>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {progress?.current_day || 1} / 7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={dayProgress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lecciones Completadas</CardDescription>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {progress?.total_lessons_completed || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Objetivo</CardDescription>
              <CardTitle className="text-lg">
                {progress?.goal ? GOAL_NAMES[progress.goal] || progress.goal : "General"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Trial Status */}
        {trial && trial.trial_status === "active" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Prueba Gratuita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Días restantes</p>
                  <p className="text-2xl font-bold">{trialDaysLeft}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lecciones restantes</p>
                  <p className="text-2xl font-bold">{trialLessonsLeft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="mistakes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mistakes">Errores Frecuentes</TabsTrigger>
            <TabsTrigger value="events">Actividad Reciente</TabsTrigger>
          </TabsList>

          <TabsContent value="mistakes">
            <Card>
              <CardHeader>
                <CardTitle>📝 Áreas de Mejora</CardTitle>
                <CardDescription>
                  Los temas donde más necesitas practicar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topMistakes.length > 0 ? (
                  <div className="space-y-3">
                    {topMistakes.map((mistake, index) => (
                      <div key={mistake.tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">
                            {index + 1}.
                          </span>
                          <span className="capitalize">
                            {mistake.tag.replace(/_/g, " ")}
                          </span>
                        </div>
                        <Badge variant={mistake.count > 3 ? "destructive" : "secondary"}>
                          {mistake.count} {mistake.count === 1 ? "error" : "errores"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    ✨ ¡No tienes errores registrados! Sigue así.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>📅 Actividad Reciente</CardTitle>
                <CardDescription>
                  Tus últimas interacciones con el bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                {relevantEvents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Detalles</TableHead>
                        <TableHead className="text-right">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relevantEvents.map((event) => {
                        const Icon = EVENT_ICONS[event.event_type] || BookOpen;
                        const metadata = event.metadata || {};
                        
                        let details = "";
                        if (event.event_type === "lesson_completed") {
                          details = `Día ${metadata.day || "?"} - ${metadata.score || 0} aciertos`;
                        } else if (event.event_type === "exercise_answered") {
                          details = metadata.correct ? "✅ Correcto" : "❌ Incorrecto";
                        } else if (event.event_type === "placement_completed") {
                          details = `Nivel: ${metadata.level || "?"}`;
                        } else if (event.event_type === "checkpoint_passed") {
                          details = "✅ Aprobado";
                        } else if (event.event_type === "checkpoint_failed") {
                          details = "❌ Necesita repaso";
                        }

                        return (
                          <TableRow key={event.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize">
                                  {event.event_type.replace(/_/g, " ")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {details}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {new Date(event.created_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay actividad registrada aún.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-bold mb-2">¿Listo para continuar?</h2>
            <p className="text-muted-foreground mb-4">
              Vuelve al WhatsApp y escribe <strong>NEXT</strong> para tu próxima lección.
            </p>
            <a href={whatsappLink}>
              <Button size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                Abrir WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          SpeakEasily • Tu coach de inglés por WhatsApp
        </div>
      </footer>
    </div>
  );
}
