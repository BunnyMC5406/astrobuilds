import { Switch, Route, useLocation } from "wouter";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import AuthPage from "@/pages/AuthPage";
import BuildDetails from "@/pages/BuildDetails";
import ProfilePage from "@/pages/ProfilePage";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import NavigationBar from "@/components/NavigationBar";
import { useUser } from "@/hooks/use-user";

function App() {
  const { user, isLoading } = useUser();
  const [location, setLocation] = useLocation();

  // Redirect non-admin users trying to access /admin
  if (!isLoading && location === "/admin" && (!user || user.username !== "BunnyMC5406")) {
    setLocation("/");
    return null;
  }

  return (
    <>
      <NavigationBar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/build/:id" component={BuildDetails} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/auth" component={AuthPage} />
        {user?.username === "BunnyMC5406" && (
          <Route path="/admin" component={Admin} />
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
