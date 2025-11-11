import { Message } from "@shared/schema";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function FormattedBotMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const summary = lines[0];
  const bullets = lines.slice(1).filter(line => line.trim().match(/^\d+\./));

  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold leading-snug text-foreground">
        {summary}
      </p>
      {bullets.length > 0 && (
        <ul className="space-y-2 text-base leading-7">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="text-muted-foreground flex-shrink-0">•</span>
              <span>{bullet.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isBot = message.role === "assistant";

  return (
    <div
      className={`flex gap-4 ${isBot ? "justify-start" : "justify-end"}`}
      data-testid={`message-${message.role}-${message.id}`}
    >
      {isBot && (
        <Avatar className="h-8 w-8 flex-shrink-0" data-testid="avatar-bot">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col gap-2 max-w-2xl ${isBot ? "" : "items-end"}`}>
        <div
          className={`rounded-2xl px-6 py-4 ${
            isBot
              ? "bg-card border border-card-border"
              : "bg-primary text-primary-foreground"
          }`}
          data-testid={`bubble-${message.role}`}
        >
          {isBot ? (
            <FormattedBotMessage content={message.content} />
          ) : (
            <div className="text-base leading-relaxed font-medium">
              {message.content}
            </div>
          )}
          
          {isBot && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">Sources:</p>
              <div className="flex flex-col gap-1">
                {message.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline decoration-dotted inline-flex items-start gap-1"
                    data-testid={`source-link-${idx}`}
                  >
                    <span className="opacity-70">{idx + 1}.</span>
                    <span>{source.title} — {new URL(source.url).hostname}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <time className="text-xs text-muted-foreground px-2" data-testid="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </time>
      </div>

      {!isBot && (
        <Avatar className="h-8 w-8 flex-shrink-0" data-testid="avatar-user">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
