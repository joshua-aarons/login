/**
 * Agent Page - Full page chat, accessible from the sidebar ✨, consistent with other Console pages.
 * The frontend is only responsible for interaction and display; intent and tools are determined by the backend.
 */

import { SvgPlus, UserDataComponent } from "../../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../../Utilities/template.js";
import { executeToolCall } from "./toolExecutor.js";
import { chatWithLLM, fetchAccountDataPlan } from "./api.js";
import { fetchAccountDataBySlices } from "./accountSliceFetch.js";
import { formatAccountFetchToPlainText } from "./accountPromptText.js";
import { getUID } from "../../../Firebase/firebase-client.js";

useCSSStyle("theme");
useCSSStyle("agent-page");

const SUGGESTIONS = [
    "How do I schedule a meeting?",
    "Open settings",
    "How do I host a session?",
];

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML.replace(/\n/g, "<br>");
}

class AgentPage extends UserDataComponent {
    onconnect() {
        this.template = getHTMLTemplate("agent-page");
        this._messages = [];

        const chips = this.querySelectorAll(".agent-suggestion-chip");
        chips.forEach((btn, i) => {
            if (SUGGESTIONS[i]) btn.textContent = SUGGESTIONS[i];
            btn.addEventListener("click", () => this._sendText(SUGGESTIONS[i] || btn.textContent));
        });

        this.els.sendBtn?.addEventListener("click", () => this.send());
        this.els.input?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.send();
        });
    }

    get appView() {
        return document.querySelector("app-view");
    }

    send() {
        const input = this.els.input;
        if (!input) return;
        const text = (input.value || "").trim();
        if (!text) return;
        input.value = "";
        this._sendText(text);
    }

    _sendText(text) {
        this._addMessage("user", text);

        if (!this.appView) {
            this._addMessage("bot", "Please log in to the Console first to use the assistant.");
            return;
        }

        this._messages.push({ role: "user", content: text });
        let reply = null;
        (async () => {
            try {
                let accountContext;
                const uid = getUID();
                try {
                    const slices = await fetchAccountDataPlan(text);
                    if (slices.includes("none") || !uid) {
                        accountContext = undefined;
                    } else {
                        const data = await fetchAccountDataBySlices(uid, slices);
                        const t = formatAccountFetchToPlainText(data);
                        accountContext = t || undefined;
                    }
                } catch (planErr) {
                    console.warn("Account data plan/fetch:", planErr);
                    try {
                        if (uid) {
                            const data = await fetchAccountDataBySlices(uid, ["all"]);
                            const t = formatAccountFetchToPlainText(data);
                            accountContext = t || undefined;
                        } else {
                            accountContext = undefined;
                        }
                    } catch {
                        accountContext = undefined;
                    }
                }
                const res = await chatWithLLM(this._messages, {
                    accountContext,
                });
                if (res.toolCalls?.length) {
                    const replies = res.toolCalls.map((tc) =>
                        executeToolCall(tc.name, tc.arguments, this.appView)
                    );
                    reply = res.reply ? res.reply + "\n" + replies.join("\n") : replies.join("\n");
                } else {
                    reply = res.reply;
                }
                if (reply) this._messages.push({ role: "assistant", content: reply });
                this._addMessage("bot", reply || "I couldn't understand that.", res.suggestions);
            } catch (e) {
                console.warn("Chat API error:", e);
                this._addMessage("bot", "The assistant is temporarily unavailable. Please try again.");
            }
        })();
    }

    _addMessage(role, content, suggestions = []) {
        const container = this.els.messages;
        if (!container) return;
        const div = document.createElement("div");
        div.className = `message ${role}`;
        
        let html = `<span class="content">${escapeHtml(content)}</span>`;
        
        if (suggestions && suggestions.length > 0) {
            html += `<div class="message-suggestions">`;
            suggestions.forEach(s => {
                html += `<button type="button" class="agent-suggestion-chip dynamic">${escapeHtml(s)}</button>`;
            });
            html += `</div>`;
        }
        
        div.innerHTML = html;
        
        // Add listeners to dynamic chips
        div.querySelectorAll(".agent-suggestion-chip.dynamic").forEach(btn => {
            btn.addEventListener("click", () => {
                // Disable all buttons in this message after one is clicked
                const parent = btn.closest(".message-suggestions");
                if (parent) {
                    parent.querySelectorAll("button").forEach(b => {
                        b.disabled = true;
                        b.style.opacity = "0.5";
                        b.style.pointerEvents = "none";
                    });
                }
                this._sendText(btn.textContent);
            });
        });

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
}

SvgPlus.defineHTMLElement(AgentPage);
