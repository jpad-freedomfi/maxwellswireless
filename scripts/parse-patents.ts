import * as fs from "fs";
import * as path from "path";

// ── Types ──────────────────────────────────────────────────────────────────

interface Patent {
  title: string;
  number: string;
  type: "grant" | "pending";
  abstract: string;
  filed: string;
  granted?: string;
  published?: string;
  assignee: string;
  inventors: string[];
  topic: string;
  topicLabel: string;
}

// ── Topic mapping ──────────────────────────────────────────────────────────

const TOPIC_MAP: Record<string, { topic: string; topicLabel: string }> = {};

// Helper to add multiple title patterns → topic
function mapTitles(
  titles: string[],
  topic: string,
  topicLabel: string,
): void {
  for (const t of titles) {
    TOPIC_MAP[t.toLowerCase()] = { topic, topicLabel };
  }
}

// 17 grant topics
mapTitles(["Network traffic prioritization"], "network-traffic-prioritization", "Network Traffic Prioritization");

mapTitles(
  ["Capacity sharing between wireless systems"],
  "capacity-sharing",
  "Capacity Sharing / Mobile Central Office",
);

mapTitles(
  ["Multiple-input multiple-output (MIMO) communication system"],
  "mimo",
  "MIMO Communication Systems",
);

mapTitles(
  ["Predictive management of a network buffer"],
  "predictive-buffer",
  "Predictive Network Buffer Management",
);

mapTitles(
  ["Target access point recommendation"],
  "target-ap",
  "Target Access Point Recommendation",
);

mapTitles(
  [
    "Systems and methods for wireless coexistence in an unlicensed spectrum",
    "Systems and methods for wireless coexistence of OFDM technologies",
  ],
  "wireless-coexistence",
  "Wireless Coexistence",
);

mapTitles(
  ["System and methods for centralized network node digitization"],
  "vran",
  "Centralized Network Node Digitization / vRAN",
);

mapTitles(
  ["Systems and methods for joint wireless transmission and joint wireless reception"],
  "comp",
  "Joint Wireless Transmission & Reception / CoMP",
);

mapTitles(
  ["Methods and systems for communicating between base stations of two different wireless communication networks"],
  "base-station-interop",
  "Base Station Inter-Network Communication",
);

mapTitles(
  ["Systems and methods for mitigating delay in availability of data in a communication network"],
  "data-availability",
  "Data Availability & Latency Mitigation",
);

mapTitles(
  ["Systems and methods for latency reduction using map staggering"],
  "map-staggering",
  "Latency Reduction via MAP Staggering",
);

mapTitles(
  ["Systems and methods for packet segmentation in standalone small cell"],
  "packet-segmentation",
  "Packet Segmentation in Standalone Small Cell",
);

mapTitles(["Smart taps"], "smart-taps", "Smart Taps / Noise Mitigation");

mapTitles(
  ["Systems and methods for reducing communication network performance degradation using in-band telemetry data"],
  "in-band-telemetry",
  "In-Band Telemetry for Network Performance",
);

mapTitles(
  ["Dimensioning approach for data networks"],
  "docsis-dimensioning",
  "DOCSIS Network Dimensioning",
);

mapTitles(
  ["Local communications network"],
  "local-comms",
  "Local Communications Network",
);

mapTitles(
  ["Handovers for a user equipment using a mobility status"],
  "handovers",
  "Handovers Using Mobility Status",
);

// 5 pending application topics
mapTitles(
  ["Systems and Methods for Settlement Interfaces in Cellular Networks Using Blockchain Technology"],
  "blockchain-settlement",
  "Blockchain Settlement Interfaces",
);

mapTitles(
  ["Mobile Hotspot Solution"],
  "blockchain-hotspot",
  "Mobile Hotspot Solution",
);

mapTitles(
  ["Automated Usage Informed User Cost Optimizer"],
  "mvno-optimizer",
  "Automated MVNO Cost Optimizer",
);

mapTitles(
  ["Highly Secure Wireless Network Discovery and Configuration System"],
  "network-discovery",
  "Secure Wireless Network Discovery",
);

mapTitles(
  ["SYSTEM AND METHOD FOR SECURING A MOBILE SERVICES ACCOUNT"],
  "blockchain-security",
  "Blockchain Mobile Services Security",
);

// ── Date parsing ───────────────────────────────────────────────────────────

function parseDate(dateStr: string): string {
  // Accepts formats like "November 19, 2023" or "December 23, 2025"
  const d = new Date(dateStr.trim());
  if (isNaN(d.getTime())) {
    console.warn(`  WARNING: Could not parse date "${dateStr}"`);
    return dateStr.trim();
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ── Normalize title for matching ───────────────────────────────────────────

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

// ── Look up topic by title ─────────────────────────────────────────────────

function lookupTopic(title: string): { topic: string; topicLabel: string } {
  const key = normalizeTitle(title);
  if (TOPIC_MAP[key]) return TOPIC_MAP[key];

  // Fuzzy fallback: try substring matching
  for (const [mapKey, value] of Object.entries(TOPIC_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      return value;
    }
  }

  console.warn(`  WARNING: No topic match for "${title}"`);
  return { topic: "unknown", topicLabel: "Unknown" };
}

// ── Parse inventors ────────────────────────────────────────────────────────

function parseInventors(raw: string): string[] {
  // The raw field value after "Inventors: " or "Inventor: "
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((name) => {
      // Normalize ALL-CAPS names to Title Case
      if (name === name.toUpperCase() && name.length > 3) {
        return name
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      }
      return name;
    });
}

// ── Main parsing ───────────────────────────────────────────────────────────

interface RawEntry {
  title: string;
  number: string;
  abstract: string;
  entryType: "Grant" | "Application";
  filed: string;
  dateOfPatent?: string;
  publicationDate?: string;
  assignee: string;
  inventors: string[];
}

function parsePatentFile(filePath: string): RawEntry[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");

  const entries: RawEntry[] = [];

  // Skip header lines and the duplicate header
  const headerPatterns = [
    "patents by inventor joseph padden",
    "patents by inventor joey padden",
    "joseph padden has filed for patents",
    "joey padden has filed for patents",
  ];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip blank lines and header lines
    if (
      line === "" ||
      headerPatterns.some((h) => line.toLowerCase().startsWith(h))
    ) {
      i++;
      continue;
    }

    // This should be a title line. Check if the next line is "Patent number:" or "Publication number:"
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
    if (
      !nextLine.startsWith("Patent number:") &&
      !nextLine.startsWith("Publication number:")
    ) {
      // Not a patent entry start, skip
      i++;
      continue;
    }

    const title = line;
    i++;

    // Parse the structured fields
    let number = "";
    let abstract_ = "";
    let entryType: "Grant" | "Application" = "Grant";
    let filed = "";
    let dateOfPatent = "";
    let publicationDate = "";
    let assignee = "";
    let inventors: string[] = [];

    while (i < lines.length) {
      const fieldLine = lines[i].trim();

      if (fieldLine.startsWith("Patent number:")) {
        number = fieldLine.replace("Patent number:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Publication number:")) {
        number = fieldLine.replace("Publication number:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Abstract:")) {
        abstract_ = fieldLine.replace("Abstract:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Type:")) {
        const typeStr = fieldLine.replace("Type:", "").trim();
        entryType = typeStr === "Grant" ? "Grant" : "Application";
        i++;
      } else if (fieldLine.startsWith("Filed:")) {
        filed = fieldLine.replace("Filed:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Date of Patent:")) {
        dateOfPatent = fieldLine.replace("Date of Patent:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Publication date:")) {
        publicationDate = fieldLine.replace("Publication date:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Assignee:")) {
        assignee = fieldLine.replace("Assignee:", "").trim();
        i++;
      } else if (fieldLine.startsWith("Applicant:")) {
        assignee = fieldLine.replace("Applicant:", "").trim();
        i++;
      } else if (
        fieldLine.startsWith("Inventors:") ||
        fieldLine.startsWith("Inventor:")
      ) {
        const rawInventors = fieldLine
          .replace("Inventors:", "")
          .replace("Inventor:", "")
          .trim();
        inventors = parseInventors(rawInventors);
        i++;
        // After inventors, this entry is done
        break;
      } else {
        // Probably the start of the next entry or an unrecognized field
        break;
      }
    }

    entries.push({
      title,
      number,
      abstract: abstract_,
      entryType,
      filed,
      dateOfPatent: dateOfPatent || undefined,
      publicationDate: publicationDate || undefined,
      assignee,
      inventors,
    });
  }

  return entries;
}

// ── Deduplication logic ────────────────────────────────────────────────────

function deduplicateEntries(entries: RawEntry[]): RawEntry[] {
  // Group by normalized title
  const byTitle = new Map<string, RawEntry[]>();

  for (const entry of entries) {
    const key = normalizeTitle(entry.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(entry);
  }

  const result: RawEntry[] = [];

  for (const [_title, group] of byTitle) {
    const grants = group.filter((e) => e.entryType === "Grant");
    const applications = group.filter((e) => e.entryType === "Application");

    if (grants.length > 0) {
      // Keep all grants (they are separate patent numbers for the same title)
      for (const g of grants) {
        result.push(g);
      }
      // Drop applications — they have corresponding grants
    } else {
      // Only applications, no grants — check if these are the 5 pending apps
      // Keep the one with the latest publication date (most recent filing)
      // Actually, for pending apps, each application with a unique pub number is kept
      // But we should still deduplicate if same pub number appears multiple times
      const seenNumbers = new Set<string>();
      for (const app of applications) {
        if (!seenNumbers.has(app.number)) {
          seenNumbers.add(app.number);
          result.push(app);
        }
      }
    }
  }

  return result;
}

// ── Convert to Patent and generate markdown ────────────────────────────────

function toPatent(entry: RawEntry): Patent {
  const { topic, topicLabel } = lookupTopic(entry.title);

  const patent: Patent = {
    title: entry.title
      .split(/\s+/)
      .map((word) => {
        // Normalize ALL-CAPS titles to Title Case if the whole title is uppercase
        if (entry.title === entry.title.toUpperCase()) {
          // Small words to keep lowercase (unless first word)
          const smallWords = [
            "a", "an", "the", "and", "but", "or", "for", "nor",
            "on", "at", "to", "from", "by", "in", "of", "with", "via",
          ];
          const lower = word.toLowerCase();
          if (smallWords.includes(lower)) return lower;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
      })
      .join(" "),
    number: entry.number,
    type: entry.entryType === "Grant" ? "grant" : "pending",
    abstract: entry.abstract,
    filed: parseDate(entry.filed),
    assignee: entry.assignee || "Cable Television Laboratories, Inc.",
    inventors: entry.inventors,
    topic,
    topicLabel,
  };

  // Fix title case: ensure first word is capitalized
  if (patent.title.length > 0) {
    patent.title = patent.title.charAt(0).toUpperCase() + patent.title.slice(1);
  }

  if (entry.entryType === "Grant" && entry.dateOfPatent) {
    patent.granted = parseDate(entry.dateOfPatent);
  }

  if (entry.entryType === "Application" && entry.publicationDate) {
    patent.published = parseDate(entry.publicationDate);
  }

  return patent;
}

function escapeYaml(str: string): string {
  // Escape YAML string values that contain special characters
  if (
    str.includes(":") ||
    str.includes("#") ||
    str.includes("'") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.startsWith("{") ||
    str.startsWith("[") ||
    str.startsWith("*") ||
    str.startsWith("&")
  ) {
    // Use double quotes and escape internal double quotes
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `"${str}"`;
}

function generateMarkdown(patent: Patent): string {
  const lines: string[] = ["---"];
  lines.push(`title: ${escapeYaml(patent.title)}`);
  lines.push(`number: "${patent.number}"`);
  lines.push(`type: "${patent.type}"`);
  lines.push(`filed: "${patent.filed}"`);

  if (patent.granted) {
    lines.push(`granted: "${patent.granted}"`);
  }
  if (patent.published) {
    lines.push(`published: "${patent.published}"`);
  }

  lines.push(`assignee: ${escapeYaml(patent.assignee)}`);

  const inventorList = patent.inventors
    .map((inv) => `  - "${inv}"`)
    .join("\n");
  lines.push(`inventors:\n${inventorList}`);

  lines.push(`topic: "${patent.topic}"`);
  lines.push(`topicLabel: ${escapeYaml(patent.topicLabel)}`);
  lines.push("---");
  lines.push("");
  lines.push(patent.abstract);
  lines.push("");

  return lines.join("\n");
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const inputFile = path.resolve(
    __dirname,
    "../../Patents_by_Inventor_Joseph_Padden.txt",
  );
  const outputDir = path.resolve(
    __dirname,
    "../src/content/patents",
  );

  console.log(`Reading patents from: ${inputFile}`);
  console.log(`Output directory: ${outputDir}`);

  // Parse
  const rawEntries = parsePatentFile(inputFile);
  console.log(`\nParsed ${rawEntries.length} total entries from file`);

  const grants = rawEntries.filter((e) => e.entryType === "Grant");
  const applications = rawEntries.filter((e) => e.entryType === "Application");
  console.log(`  Grants: ${grants.length}`);
  console.log(`  Applications: ${applications.length}`);

  // Deduplicate
  const deduplicated = deduplicateEntries(rawEntries);
  console.log(`\nAfter deduplication: ${deduplicated.length} entries`);

  const dedupGrants = deduplicated.filter((e) => e.entryType === "Grant");
  const dedupApps = deduplicated.filter((e) => e.entryType === "Application");
  console.log(`  Grants: ${dedupGrants.length}`);
  console.log(`  Pending applications: ${dedupApps.length}`);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Clear existing files
  const existing = fs.readdirSync(outputDir).filter((f) => f.endsWith(".md"));
  for (const f of existing) {
    fs.unlinkSync(path.join(outputDir, f));
  }

  // Convert and write
  const patents = deduplicated.map(toPatent);
  const topicCounts: Record<string, number> = {};

  for (const patent of patents) {
    const filename = `${patent.number}.md`;
    const filepath = path.join(outputDir, filename);
    const markdown = generateMarkdown(patent);
    fs.writeFileSync(filepath, markdown, "utf-8");

    topicCounts[patent.topic] = (topicCounts[patent.topic] || 0) + 1;
  }

  console.log(`\nWrote ${patents.length} markdown files to ${outputDir}`);

  // Topic summary
  console.log("\nTopic distribution:");
  const sortedTopics = Object.entries(topicCounts).sort(
    ([, a], [, b]) => b - a,
  );
  for (const [topic, count] of sortedTopics) {
    console.log(`  ${topic}: ${count}`);
  }

  // Verify
  const outputFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith(".md"));
  console.log(`\nVerification: ${outputFiles.length} .md files in output directory`);
}

main();
