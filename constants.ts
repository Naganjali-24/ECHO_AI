
import { IncidentPost, TriageLevel } from "./types";

export const MOCK_INCIDENTS: IncidentPost[] = [
  {
    id: "inc-101",
    author: "@sarah_h",
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    text: "The water is coming through the windows! We are trapped on the second floor. Please help!",
    status: TriageLevel.RED,
    riskScore: 95,
    reasoning: "Explicit statement of being trapped and water entering living space.",
    recommendedAction: "Deploy high-water rescue team immediately.",
    location: "2nd Floor, Downtown",
    source: 'Manual'
  },
  {
    id: "inc-102",
    author: "Local News Daily",
    timestamp: Date.now() - 1000 * 60 * 15,
    text: "Mayor announces emergency shelter at the high school is open. Bring blankets.",
    status: TriageLevel.GREEN,
    riskScore: 5,
    reasoning: "Informational update about shelters. No immediate threat detected.",
    recommendedAction: "Log for information dissemination.",
    imageUrl: "https://picsum.photos/400/300?random=1",
    source: 'WebScraper'
  },
  {
    id: "inc-103",
    author: "@mike_r",
    timestamp: Date.now() - 1000 * 60 * 30,
    text: "Power just went out on Oak Street. We have food for 2 days but no heat.",
    status: TriageLevel.YELLOW,
    riskScore: 45,
    reasoning: "Loss of utilities reported. Subjects are currently safe but will need assistance.",
    recommendedAction: "Flag for supply drop when accessible.",
    location: "Oak Street",
    source: 'Manual'
  }
];
