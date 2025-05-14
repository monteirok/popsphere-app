import { Switch, Route } from "wouter";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Collection from "./pages/collection";
import Trades from "./pages/trades";
import Community from "./pages/community";
import Profile from "./pages/profile";
import AuthPage from "./pages/auth-page";
import Header from "./components/layout/Header";
import MobileNavigation from "./components/layout/MobileNavigation";
import { useAuth } from "./hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function App() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-pop-pink" />
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="bg-gray-50 min-h-screen flex flex-col">
          {user ? (
            // Authenticated layout
            <>
              <Header />
              <main className="container mx-auto px-4 py-6 flex-grow">
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/collection" component={Collection} />
                  <Route path="/trades" component={Trades} />
                  <Route path="/community" component={Community} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/profile/:username" component={Profile} />
                  <Route component={NotFound} />
                </Switch>
              </main>
              <MobileNavigation />
            </>
          ) : (
            // Unauthenticated layout
            <Switch>
              <Route path="/auth" component={AuthPage} />
              <Route>
                <AuthPage />
              </Route>
            </Switch>
          )}
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
