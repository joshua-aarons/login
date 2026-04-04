/**
 * LangChain-native Knowledge Base Loader.
 * Uses TextLoader and CharacterTextSplitter to process client-navigation.txt.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";

const __dirname = dirname(fileURLToPath(import.meta.url));

function findDocPath() {
  const candidates = [
    resolve(__dirname, "../Docs/client-navigation.txt"),
    resolve(process.cwd(), "Docs/client-navigation.txt"),
  ];
  for (const p of candidates) {
    try {
      if (readFileSync(p, "utf-8").trim().length > 0) return p;
    } catch {
      /* skip */
    }
  }
  return null;
}

/** Section markers for splitting, in order of appearance */
export const SECTION_MARKERS = [
  "Sign-in & Navigating the console",
  "Licences and how to pay for a Squidly account",
  "Adding team members and setting their role",
  "Scheduling a session",
  "Navigating the Squidly session",
  "Editing & using an AAC board",
  "Editing & using a quiz",
  "Using the eye-gaze / settings for eye-gaze",
  "Selecting and using a game in apps",
  "Settings / configuring settings for a participant",
  "Sharing content / file",
  "Client feedback / post-session survey",
];

/**
 * Loads and splits the knowledge base document.
 * @returns {Promise<import("@langchain/core/documents").Document[]>}
 */
export async function loadKnowledgeDocuments() {
  const docPath = findDocPath();
  if (!docPath) {
    console.warn("Knowledge base document not found.");
    return [];
  }

  const loader = new TextLoader(docPath);
  const docs = await loader.load();

  // Split by section markers to keep sections intact
  const splitter = new CharacterTextSplitter({
    separator: "\n", // We'll do a more granular split or keep it by sections if preferred
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  return await splitter.splitDocuments(docs);
}
