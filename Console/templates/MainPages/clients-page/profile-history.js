import { SvgPlus } from "../../../../SvgPlus/4.js";
const Option2Text = {
  "colour-1": "Black/White",
  "colour-2": "White/Black",
  "colour-3": "Black/Yellow",
  "colour-4": "Black/Green",
  "colour-5": "Blue/Yellow",
  "v-side": "Side",
  "v-top": "Top",
  "arrow": "Arrow",
  "guide": "Guide",
  "circle": "Focus Ring",
};


function camelCaseToText(str) {
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space before capital letters
  return str.charAt(0).toUpperCase() + str.slice(1); // Capitalize first letter
}
function snakeCaseToText(str) {
  str = str.split(/[_-]/g)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return str;
}
function formatSettingValue(value) {
  if (typeof value === "boolean") {
    return value ? "On" : "Off";
  } else if (value in Option2Text) {
    return Option2Text[value];
  } else if (typeof value === "number") {
    return value.toFixed(1);
  } else {
    return value;
  }
}

function formatSettingKey(key) {
  key = key.replace(/^(participant|host)\//, "");
  key = key.split("/").map(camelCaseToText).join(" / ");
  return key;
}

/**
 * @param {number} minutes - The duration in minutes to format.
 */
function formatMinutes(minutes) {
  let res = ""
  if (typeof minutes === "boolean") {
    res = minutes ? "On" : "Off";
  } else if (minutes < 1) {
    res =  `${Math.round(minutes * 60)}s`;
  } else if (minutes < 60) {
    const minute1dp = minutes.toFixed(1);
    if (minute1dp.endsWith(".0")) {
      res = `${Math.round(minutes)}m`;
    } else {
      res = `${minute1dp}m`;
    }
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      res = `${hours}h`;
    } else {
      res = `${hours}h ${remainingMinutes}m`;
    }
  }
  return res;
}

class SHistorySection extends SvgPlus {
  constructor(title) {
    super("div");
    this.class = "section";
    this.createChild("div", {class: "section-label", innerHTML: title});
    this._content = this.createChild("div", {class: "section-content"});
    this.dash = this._content.createChild("span", {content: "-"});
  }
  get content() {
    this.dash.remove();
    return this._content;
  }
}
class SHistoryRow extends SvgPlus {
  constructor(label, value) {
    super("div");
    this.class = "row-data";
    this.createChild("span", {innerHTML: label});
    this.createChild("span", {innerHTML: value, style: {"font-weight": 600}});
  }
  
}



class SessionCard extends SvgPlus {
  constructor(sessionData) {
    super("div");
    this.class = "session-card";
    

    const d = new Date(sessionData.metadata.time);
    let date = d.toLocaleDateString(undefined, {month: "short", day: "2-digit", year: "numeric"});
    let time = d.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit", hour12: true});

    // Session header
    this.session = this.createChild("div", {class: "session"})
    this.sessionInfo = this.session.createChild("div", {class: "session-info"});
    this.sessionInfo.createChild("span", {class: "session-date", innerHTML: date});
    let timeInfo = this.sessionInfo.createChild("div", {class: "session-time"});
    timeInfo.createChild("i", {class: "fa-regular fa-clock", style: {"margin-right": "0.25em"}})
    timeInfo.createChild("span", {innerHTML: time});

    this.container = this.session.createChild("div", {class: "session-container"});
    this.container.createChild("span", {innerHTML: formatMinutes(sessionData.metadata.duration)});
    this.arrow = this.container.createChild("span", {name: "arrow", innerHTML: "▾", style: {"font-size": "1.6em", "margin-left": "auto"}});

    // Expandable section
    this.panel = this.createChild("div", {class: "panel"});
    this.session.addEventListener("click", () => this.onPanelClicked());

    
    // Calibration
    const calibrationSection = this.panel.createChild(SHistorySection, {}, "EYE GAZE SCORES");
    console.log(sessionData); 
    let calibrationScores = (sessionData.calibrationScores || []).filter(([score, isHost]) => !isHost);
    if (calibrationScores.length > 0) {
      calibrationScores.forEach(([score], i) => {
        calibrationSection.content.createChild(SHistoryRow, {}, `Calibration ${i + 1}`, `${score}%`);
      });
    } 

    // Settings changes
    const settingsSection = this.panel.createChild(SHistorySection, {}, "SETTINGS");
    if (sessionData.settings) {
      const settingsChanges = sessionData.settings.filter(([_, {oldValue, newValue}]) => oldValue !== newValue);
      if (settingsChanges.length > 0) {
        settingsChanges.forEach(([settingPath, {oldValue, newValue}]) => {
          settingsSection.content.createChild(SHistoryRow, {class: "setting-change"}, 
            formatSettingKey(settingPath), 
            `<i>${formatSettingValue(oldValue)}</i> → ${formatSettingValue(newValue)}`
          );
        });
      }
    }
 

    // Access methods
    const accessSection = this.panel.createChild(SHistorySection, {}, "ACCESS");
    const usedAccessMethods = Object.entries(sessionData.access).filter(([_, time]) => time > 0);
    if (usedAccessMethods.length > 0) {
      Object.keys(sessionData.access).forEach((method) => {
        accessSection.content.createChild(SHistoryRow, {}, 
          snakeCaseToText(method), 
          formatMinutes(sessionData.access[method])
        );
      })
    }
   
    // AAC 
    const aacSection = this.panel.createChild("div", {class: "section"});
    aacSection.createChild("div", {class: "section-label", innerHTML: "AAC"});
    let hostStyles = {color: "#2e9e5b", "background-color": "#f0faf4", border: "1px solid #c5e8d4"};
    let participantStyles = {color: "#7380ec", "background-color": "#eef2ff", border: "1px solid #d8e3ff"};
    let aacContent = aacSection.createChild("div", {class: "section-content-wrap"});
    if (!sessionData.aac || sessionData.aac.length === 0) {
      aacContent.createChild("span", {innerHTML: "-"})
    } else {
      sessionData.aac.forEach((aac) => {
        let [word, isHost] = aac;
        aacContent.createChild("div", {
          class: "data-div",
          style: isHost ? hostStyles : participantStyles,
          innerHTML: word
        })
      })
    }

    if (sessionData.aac) {
      let legend = aacSection.createChild("div", {class: "aac-legend"});

      let hostLegend = legend.createChild("div", {class: "aac-legend-item"});
      hostLegend.createChild("div", {class: "aac-legend-box", style: hostStyles});
      hostLegend.createChild("span", {innerHTML: "Host"});

      let participantLegend = legend.createChild("div", {class: "aac-legend-item"});
      participantLegend.createChild("div", {class: "aac-legend-box", style: participantStyles});
      participantLegend.createChild("span", {innerHTML: "Participant"});
    }

    // Apps 
    const appsSection = this.panel.createChild(SHistorySection, {}, "APPS");
    if (sessionData.apps && sessionData.apps.length > 0) {
      for (const [app, duration] of sessionData.apps) {
        let row = appsSection.content.createChild(SHistoryRow, {}, 
          app, 
          formatMinutes(duration)
        );
      }
    }


    // Quizzess 
    const quizzesSection = this.panel.createChild(SHistorySection, {}, "QUIZZES");
    if (sessionData.quizzes && sessionData.quizzes.length > 0) {
      for (const [app, duration] of sessionData.quizzes) {
        let row = quizzesSection.content.createChild(SHistoryRow, {}, 
          app, 
          formatMinutes(duration)
        );
      }
    }
  }

 

  onPanelClicked() {
      const isOpen = this.panel.style.maxHeight && this.panel.style.maxHeight !== "0px";
      this.toggleAttribute("open", !isOpen);
      this.arrow.toggleAttribute("active", !isOpen)
      if (isOpen) {
        this.panel.style.maxHeight = "0px";
      } else {
        this.panel.style.maxHeight = this.panel.scrollHeight + "px";
      }
  };
}

export class ProfileSessionHistory extends SvgPlus {
  constructor() {
    super("div");
    this.class = "profile-session-history";
  }


  set logs(sessionLogs) {
    if (typeof sessionLogs !== "object" || sessionLogs === null) {
        sessionLogs = {};
    }

    this.innerHTML = "";
    if (Object.keys(sessionLogs).length === 0) {
        this.createChild("span", {innerHTML: "No session history available."});
    } else {
        for (let sid in sessionLogs) {
            this.createChild(SessionCard, {}, sessionLogs[sid])
        }
    }
  }
}