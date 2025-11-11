import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { ScrapedContent } from "@shared/schema";
import { RefreshCw, Plus, Link as LinkIcon, Calendar, ExternalLink, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Label } from "@/components/ui/label";

const ADMIN_KEY_STORAGE = "mits_admin_key";

function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_KEY_STORAGE);
}

function setAdminKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
  }
}

function clearAdminKey() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
  }
}

async function apiRequestWithAdmin(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const adminKey = getAdminKey();
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(adminKey ? { "x-admin-key": adminKey } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}

export default function AdminPage() {
  const [newUrl, setNewUrl] = useState("");
  const [adminKey, setAdminKeyState] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = getAdminKey();
    if (savedKey) {
      setAdminKeyState(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["/api/content"],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await apiRequestWithAdmin("GET", "/api/content");
        return res.json();
      } catch (err: any) {
        if (err.message?.includes("403")) {
          clearAdminKey();
          setIsAuthenticated(false);
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Please log in again",
          });
        }
        throw err;
      }
    },
  });

  useEffect(() => {
    if (error) {
      clearAdminKey();
      setIsAuthenticated(false);
    }
  }, [error]);

  const scrapeMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequestWithAdmin("POST", "/api/scrape", { url });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setNewUrl("");
      toast({
        title: "Success",
        description: "Content scraped successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to scrape content",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequestWithAdmin("POST", "/api/scrape/refresh", { url });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Success",
        description: "Content refreshed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to refresh content",
      });
    },
  });

  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      scrapeMutation.mutate(newUrl.trim());
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch("/api/content", {
        method: "GET",
        headers: {
          "x-admin-key": key,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(text);
      }

      return res.json();
    },
    onSuccess: () => {
      setAdminKey(adminKey.trim());
      setIsAuthenticated(true);
      toast({
        title: "Authenticated",
        description: "You can now manage content",
      });
    },
    onError: (error: Error) => {
      clearAdminKey();
      setAdminKeyState("");
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid admin key. Please try again.",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      loginMutation.mutate(adminKey.trim());
    }
  };

  const handleLogout = () => {
    clearAdminKey();
    setAdminKeyState("");
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "Admin key cleared",
    });
  };

  const contentArray = content as ScrapedContent[] | undefined;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-6 h-6 text-primary" />
              <CardTitle>Admin Access Required</CardTitle>
            </div>
            <CardDescription>
              Enter the admin key to manage content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-key">Admin Key</Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKeyState(e.target.value)}
                  data-testid="input-admin-key"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Authenticating..." : "Authenticate"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                For development: use "dev-admin-key-12345"
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-serif text-foreground">
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage scraped content for the MITS Assistant chatbot
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Content</CardTitle>
            <CardDescription>
              Scrape a new page from the MITS website to add to the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddContent} className="flex gap-2">
              <Input
                type="url"
                placeholder="https://www.mitsgwalior.ac.in/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1"
                data-testid="input-new-url"
              />
              <Button
                type="submit"
                disabled={scrapeMutation.isPending}
                data-testid="button-scrape-new"
              >
                <Plus className="w-4 h-4 mr-2" />
                {scrapeMutation.isPending ? "Scraping..." : "Add Content"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Library</CardTitle>
            <CardDescription>
              {contentArray?.length || 0} pages in the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading content...
              </div>
            ) : contentArray && contentArray.length > 0 ? (
              <div className="space-y-3">
                {contentArray.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`content-item-${item.id}`}
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start gap-2">
                        <LinkIcon className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground leading-snug">
                            {item.title}
                          </h3>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            {item.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Last updated {formatDistanceToNow(new Date(item.scrapedAt), { addSuffix: true })}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {Math.round(item.content.length / 1000)}k chars
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshMutation.mutate(item.url)}
                      disabled={refreshMutation.isPending}
                      data-testid={`button-refresh-${item.id}`}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No content found. Add some pages to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
