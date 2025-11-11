import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai, generateChatResponse } from "./lib/openai";
import { scrapePage, findRelevantContent, NetworkError } from "./lib/scraper";
import { z } from "zod";
import { randomUUID } from "crypto";
import type { ChatRequest, ChatResponse, Message } from "@shared/schema";

const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin-key-12345";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminKey = req.headers["x-admin-key"];
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  
  next();
}

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
});

const scrapeRequestSchema = z.object({
  url: z.string().url(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      console.log("[Chat API] Received message:", req.body.message);
      const { message, sessionId } = chatRequestSchema.parse(req.body);

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const newSession = await storage.createSession();
        currentSessionId = newSession.id;
      }

      const userMessageId = randomUUID();
      await storage.createMessage({
        sessionId: currentSessionId,
        role: "user",
        content: message,
      });

      const allContent = await storage.getAllScrapedContent();

      if (allContent.length === 0) {
        const errorMessage: Message = {
          id: randomUUID(),
          role: "assistant",
          content: "I don't have any information about MITS yet. The knowledge base needs to be populated first. Please contact the administrator to set up the content.",
          timestamp: new Date(),
        };
        
        await storage.createMessage({
          sessionId: currentSessionId,
          role: "assistant",
          content: errorMessage.content,
        });
        
        return res.json({ 
          message: errorMessage,
          sessionId: currentSessionId 
        } as ChatResponse);
      }

      const relevantContent = findRelevantContent(
        allContent.map(item => ({
          url: item.url,
          title: item.title,
          content: item.content
        })),
        message
      );

      let contextText = "";
      const sources: Array<{ title: string; url: string }> = [];

      if (relevantContent.length > 0) {
        contextText = relevantContent
          .map((item, idx) => `[Source ${idx + 1}: ${item.title} - ${item.url}]\n${item.content}`)
          .join('\n\n---\n\n');
        
        sources.push(...relevantContent.map(item => ({
          title: item.title,
          url: item.url
        })));
      }

      console.log("[Chat API] Found", relevantContent.length, "relevant content pieces");
      const structuredResponse = await generateChatResponse(message, contextText);
      console.log("[Chat API] Structured response:", structuredResponse);

      let formattedContent = structuredResponse.summary;
      
      if (structuredResponse.bullets.length > 0) {
        formattedContent += '\n\n';
        structuredResponse.bullets.forEach((bullet, idx) => {
          formattedContent += `${idx + 1}. ${bullet}\n`;
        });
      }

      const assistantMessage: Message = {
        id: randomUUID(),
        role: "assistant",
        content: formattedContent.trim(),
        timestamp: new Date(),
        sources: structuredResponse.hasAnswer && sources.length > 0 ? sources : undefined,
      };

      await storage.createMessage({
        sessionId: currentSessionId,
        role: "assistant",
        content: assistantMessage.content,
        sources: assistantMessage.sources as any,
      });

      res.json({ 
        message: assistantMessage,
        sessionId: currentSessionId 
      } as ChatResponse);
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process chat message" 
      });
    }
  });

  app.post("/api/scrape", requireAdmin, async (req, res) => {
    try {
      const { url } = scrapeRequestSchema.parse(req.body);

      const result = await scrapePage(url);

      const existing = await storage.getScrapedContent(url);
      
      let savedContent;
      if (existing) {
        savedContent = await storage.updateScrapedContent(url, {
          url: result.url,
          title: result.title,
          content: result.content,
        });
      } else {
        savedContent = await storage.createScrapedContent({
          url: result.url,
          title: result.title,
          content: result.content,
        });
      }

      res.json(savedContent);
    } catch (error: any) {
      console.error("Scrape error:", error);
      
      if (error instanceof NetworkError) {
        return res.status(503).json({ 
          error: error.message,
          type: "network_error"
        });
      }
      
      res.status(500).json({ 
        error: error.message || "Failed to scrape page" 
      });
    }
  });

  app.post("/api/scrape/refresh", requireAdmin, async (req, res) => {
    try {
      const { url } = scrapeRequestSchema.parse(req.body);

      const existing = await storage.getScrapedContent(url);
      if (!existing) {
        return res.status(404).json({ error: "URL not found in content library" });
      }

      const result = await scrapePage(url);

      const updatedContent = await storage.updateScrapedContent(url, {
        url: result.url,
        title: result.title,
        content: result.content,
      });

      res.json(updatedContent);
    } catch (error: any) {
      console.error("Refresh error:", error);
      
      if (error instanceof NetworkError) {
        return res.status(503).json({ 
          error: error.message,
          type: "network_error"
        });
      }
      
      res.status(500).json({ 
        error: error.message || "Failed to refresh page content" 
      });
    }
  });

  app.get("/api/content", requireAdmin, async (_req, res) => {
    try {
      const allContent = await storage.getAllScrapedContent();
      res.json(allContent);
    } catch (error: any) {
      console.error("Get content error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to get content" 
      });
    }
  });

  app.get("/api/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getSessionMessages(sessionId);
      
      const formattedMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp,
        sources: msg.sources as Array<{ title: string; url: string }> | undefined,
      }));
      
      res.json(formattedMessages);
    } catch (error: any) {
      console.error("Get history error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to get conversation history" 
      });
    }
  });

  const httpServer = createServer(app);

  await seedInitialContent();

  return httpServer;
}

async function seedInitialContent() {
  try {
    const existingContent = await storage.getAllScrapedContent();
    if (existingContent.length > 0) {
      console.log("Content already seeded, skipping...");
      return;
    }

    console.log("Seeding initial MITS content...");

    const seedData = [
      {
        url: "https://www.mitsgwalior.ac.in/about",
        title: "About MITS - Madhav Institute of Technology & Science",
        content: `Madhav Institute of Technology & Science (MITS), Gwalior, is a premier technical institution established in 1984. MITS is affiliated to Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV), Bhopal and approved by AICTE, New Delhi.

The institute offers undergraduate (B.Tech) programs in Computer Science & Engineering, Electronics & Communication Engineering, Mechanical Engineering, Civil Engineering, and Electrical Engineering. It also offers postgraduate (M.Tech) programs in various specializations.

MITS has state-of-the-art laboratories, a well-stocked library with over 50,000 books and journals, modern classrooms with ICT facilities, and excellent sports infrastructure. The campus is spread over 42 acres with hostels for both boys and girls.

The institute is known for its excellent placement record with leading companies like TCS, Infosys, Wipro, Accenture, Amazon, and many others recruiting students every year. MITS also has strong industry collaborations and organizes regular workshops, seminars, and technical festivals.`
      },
      {
        url: "https://www.mitsgwalior.ac.in/admissions",
        title: "Admissions - MITS Gwalior",
        content: `MITS Gwalior offers admissions to B.Tech and M.Tech programs.

B.Tech Admission Process:
1. Candidates must have passed 10+2 with Physics, Chemistry, and Mathematics with minimum 50% marks (45% for SC/ST)
2. Valid JEE Main score is required
3. Admissions are through MP DTE (Directorate of Technical Education) counseling
4. Fill the online application form during the counseling period
5. Attend document verification and counseling as per schedule
6. Pay the admission fee to confirm your seat

Important Documents Required:
- 10th and 12th mark sheets and certificates
- JEE Main scorecard and admit card
- Transfer certificate and migration certificate
- Category certificate (if applicable)
- Domicile certificate
- Aadhar card and photographs

M.Tech Admission:
Admissions are based on GATE scores through MP DTE counseling.

Contact Admission Cell:
Phone: 0751-2409201
Email: admissions@mitsgwalior.in

Important Dates:
Application Period: June-July (for academic year starting in August)
Counseling: July-August
Classes Begin: August

Fee Structure:
B.Tech: Approximately Rs. 60,000 per year (subject to revision)
Hostel: Rs. 15,000 per year (approximately)`
      },
      {
        url: "https://www.mitsgwalior.ac.in/departments",
        title: "Departments and Courses - MITS",
        content: `MITS offers the following undergraduate (B.Tech) programs:

1. Computer Science & Engineering (CSE)
   - Focus on programming, algorithms, database systems, AI, machine learning
   - 120 seats per year
   - Well-equipped labs with latest software and hardware

2. Electronics & Communication Engineering (ECE)
   - Digital electronics, VLSI, embedded systems, communication systems
   - 60 seats per year
   - Advanced labs for signal processing and communication

3. Mechanical Engineering (ME)
   - Thermodynamics, manufacturing, CAD/CAM, robotics
   - 90 seats per year
   - Modern workshops and testing facilities

4. Civil Engineering (CE)
   - Structural engineering, environmental engineering, transportation
   - 60 seats per year
   - Survey lab, CAD lab, and material testing lab

5. Electrical Engineering (EE)
   - Power systems, control systems, electrical machines
   - 60 seats per year
   - High voltage lab and power electronics lab

M.Tech Programs offered:
- Computer Science & Engineering
- Electronics & Communication Engineering
- Mechanical Engineering (Design, Thermal)
- Digital Communication
- Power Systems

All departments have highly qualified faculty with PhDs from premier institutions like IITs and NITs. Faculty members are actively involved in research and consultancy projects.`
      },
      {
        url: "https://www.mitsgwalior.ac.in/facilities",
        title: "Campus Facilities - MITS Gwalior",
        content: `MITS Gwalior provides world-class facilities to students:

Library:
- Central library with over 50,000 books and 200+ journals
- Digital library with e-resources and online databases
- Reading rooms with capacity for 300 students
- Open from 8 AM to 8 PM on weekdays

Laboratories:
- Advanced computer labs with 500+ systems
- Specialized labs for each department
- Research labs for M.Tech students
- Internet facility with 100 Mbps connectivity

Hostels:
- Separate hostels for boys and girls
- Capacity for 800 students
- 24/7 security and warden supervision
- Mess facility providing nutritious meals
- Wi-Fi enabled rooms
- Common rooms with TV and indoor games

Sports Facilities:
- Football and cricket grounds
- Basketball and volleyball courts
- Indoor badminton hall
- Table tennis and chess facilities
- Annual sports fest and inter-college tournaments

Medical Facilities:
- Health center with qualified doctor
- First aid available 24/7
- Tie-up with nearby hospitals for emergencies

Transportation:
- Bus facility from major city points
- Parking for students with vehicles

Other Facilities:
- Bank ATM on campus
- Cafeteria and food courts
- Stationery shop
- Wi-Fi throughout campus
- Auditorium with 500 seating capacity
- Seminar halls and conference rooms`
      },
      {
        url: "https://www.mitsgwalior.ac.in/contact",
        title: "Contact Information - MITS Gwalior",
        content: `Madhav Institute of Technology & Science (MITS)
Gola Ka Mandir, Gwalior - 474005, Madhya Pradesh, India

Contact Numbers:
Main Office: +91-751-2409201, 2409202
Admission Office: +91-751-2409203
Placement Cell: +91-751-2409204
Principal's Office: +91-751-2409205

Email Addresses:
General Enquiries: info@mitsgwalior.in
Admissions: admissions@mitsgwalior.in
Placements: placements@mitsgwalior.in
Principal: principal@mitsgwalior.in

Office Hours:
Monday to Friday: 9:00 AM - 5:00 PM
Saturday: 9:00 AM - 1:00 PM
Sunday: Closed

How to Reach:
By Air: Gwalior Airport (12 km from campus)
By Train: Gwalior Railway Station (6 km from campus)
By Road: Well connected by state and national highways

Campus Address for Navigation:
MITS Campus, Gola Ka Mandir Road
Near Birla Temple, Gwalior
Madhya Pradesh - 474005

For specific department enquiries, please visit the college during office hours or email the respective department.

Social Media:
Website: www.mitsgwalior.ac.in
Facebook: MITS Gwalior Official
LinkedIn: MITS Gwalior
Twitter: @MITSGwalior

For urgent matters outside office hours, please contact the security office: +91-751-2409299`
      },
      {
        url: "https://www.mitsgwalior.ac.in/placements",
        title: "Placements and Career - MITS Gwalior",
        content: `MITS has an excellent placement record with top companies recruiting from campus every year.

Placement Statistics (2023-24):
- Overall Placement: 85%
- Highest Package: Rs. 28 LPA
- Average Package: Rs. 5.2 LPA
- Total Companies Visited: 120+

Top Recruiters:
IT Sector: TCS, Infosys, Wipro, Accenture, Cognizant, Tech Mahindra, HCL, Capgemini
Product Companies: Amazon, Microsoft, Google, Samsung, Oracle, Adobe
Core Engineering: L&T, Tata Motors, Mahindra, Bosch, ABB
Consulting: Deloitte, EY, KPMG

Placement Process:
1. Pre-placement training from 3rd year onwards
2. Resume building and mock interviews
3. Aptitude and technical training
4. Soft skills development
5. On-campus drives throughout final year
6. Pool campus opportunities with other institutes

Training Programs:
- Communication skills workshops
- Technical certification programs
- Coding competitions and hackathons
- Industry expert sessions
- Internship opportunities in summer

For placement enquiries:
Training & Placement Officer: Dr. R.K. Sharma
Email: placements@mitsgwalior.in
Phone: +91-751-2409204

Students are encouraged to participate in internships, projects, and technical events to enhance their employability.`
      }
    ];

    for (const data of seedData) {
      await storage.createScrapedContent(data);
      console.log(`Seeded: ${data.title}`);
    }

    console.log("Initial content seeded successfully!");
  } catch (error) {
    console.error("Error seeding content:", error);
  }
}
