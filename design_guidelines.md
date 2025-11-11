# MITS Assistant - Design Guidelines

## Design Approach

**System-Based Approach**: Modern educational SaaS interface inspired by Linear's clarity and Notion's approachability. Prioritizing readability, information hierarchy, and efficient interaction patterns suitable for information-dense chat content.

**Core Principles**:
- Clean, distraction-free reading experience for chat responses
- Clear visual distinction between user queries and bot responses
- Professional credibility with campus-friendly warmth
- Efficient information scanning with structured formatting

---

## Layout System

**Spacing Framework**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm (p-4, gap-6, mt-8, py-12, etc.)

**Chat Container**:
- Max-width of `max-w-4xl` centered for optimal reading (chat messages)
- Full-height viewport layout with fixed header and input area
- Main chat area: scrollable with `pb-24` to prevent input overlap
- Message bubbles: `max-w-2xl` for readability, left-aligned for bot, right-aligned for user

**Responsive Breakpoints**:
- Mobile (base): Single column, full-width messages with px-4 padding
- Desktop (lg:): Centered container with generous side margins

---

## Typography

**Font Stack**:
- **Primary**: Inter (Google Fonts) - body text, UI elements, chat messages
- **Accent**: Space Grotesk (Google Fonts) - headings, MITS branding

**Hierarchy**:
- **Header/Branding**: text-2xl, font-bold (Space Grotesk)
- **Chat Messages - Bot**: text-base, leading-relaxed (Inter)
- **Chat Messages - User**: text-base, font-medium (Inter)
- **Source Citations**: text-sm, underline decoration-dotted
- **Bullet Points**: text-base, leading-7 for scanability
- **Input Field**: text-base
- **Helper Text**: text-sm, opacity-70

---

## Component Library

### Header
- Fixed top header with MITS branding (logo + name)
- Optional tagline: "Ask me anything about MITS"
- Height: h-16, with shadow-sm for subtle separation

### Chat Interface
**Message Bubbles**:
- Bot messages: Rounded containers (rounded-2xl) with generous padding (p-4 to p-6)
- User messages: Slightly smaller padding (p-3 to p-4), rounded-2xl
- Avatar indicators: Small circular avatars (w-8 h-8) - bot icon and user initial
- Spacing between messages: space-y-6

**Content Formatting**:
- **One-line Summary**: Bold, slightly larger (text-lg font-semibold)
- **Key Bullets**: Structured list with appropriate markers, space-y-2
- **Source Citations**: Inline links with subtle underline, hover state with increased opacity
- **Code/Technical Info**: Monospace treatment if needed (font-mono, rounded-lg background)

### Input Area
- Fixed bottom position with backdrop blur effect
- Input field: Rounded-full or rounded-2xl, height h-12 to h-14
- Send button: Integrated within input (absolute right positioning) or adjacent
- Placeholder text: "Ask about admissions, courses, events..."
- Bottom padding: pb-6 with safe-area-inset for mobile

### Empty State
- Centered content when no messages exist
- MITS logo/icon at larger scale
- Welcome message: "Hi! I'm your MITS assistant"
- Example questions as clickable cards (3-4 suggestions in grid, rounded-xl, p-4)

### Loading State
- Typing indicator: Three animated dots within bot message bubble
- Subtle pulse animation

### Error/Not Found Messages
- Distinct visual treatment (subtle border or icon)
- Helpful suggestions clearly formatted as action items

---

## Visual Patterns

**Depth & Elevation**:
- Cards/Messages: Subtle shadows (shadow-sm to shadow-md)
- Header: shadow-sm for gentle separation
- Input area: shadow-lg for prominence

**Borders & Radius**:
- Message bubbles: rounded-2xl for modern feel
- Input field: rounded-full for approachability
- Cards: rounded-xl
- Avoid sharp corners throughout

**Icons**:
- Use Heroicons (outline style) via CDN
- Bot avatar: Academic cap or sparkles icon
- Send button: Paper airplane or arrow icon
- Examples/suggestions: Lightbulb, question mark icons

---

## Images

**Hero/Branding**:
- Small MITS logo in header (h-8 to h-10)
- Optional: Welcome screen background - subtle MITS campus image with overlay (30-40% opacity) for brand connection without distraction

**Avatar System**:
- Bot: MITS logo or academic-themed icon
- User: Initials in circle or generic user icon

**No large hero image needed** - focus is on chat functionality

---

## Accessibility & Interactions

- High contrast ratios for all text (WCAG AA minimum)
- Focus states: visible ring-2 ring-offset-2 for keyboard navigation
- Input field: Clear focus indicator, proper labels
- Clickable elements: Minimum 44x44px touch targets
- Smooth scroll behavior for new messages appearing
- Auto-scroll to latest message on new response

**Animations**:
- Message appearance: Gentle fade-in with slight y-translation (100ms ease)
- Typing indicator: Smooth pulse
- No distracting scroll animations
- Button hover: Subtle opacity/scale changes

---

## Layout Notes

- **Viewport**: Full-height application (h-screen) with fixed header/footer, scrollable middle
- **No multi-column layouts** - single conversation thread
- **Consistent padding**: px-4 md:px-6 lg:px-8 for container edges
- **Message spacing**: Generous vertical rhythm (space-y-6 to space-y-8) prevents cramped feeling