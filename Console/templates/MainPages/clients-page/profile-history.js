import { SvgPlus } from "../../../../SvgPlus/4.js";


class SessionCard extends SvgPlus {
  constructor(sessionData) {
    super("div");
    this.class = "session-card";
    this.optionToText = {
      "colour-1": "Black/White",
      "colour-2": "White/Black",
      "colour-3": "Black/Yellow",
      "colour-4": "Black/Green",
      "colour-5": "Blue/Yellow",
    };

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
    this.container.createChild("span", {innerHTML: sessionData.metadata.duration + " min"});
    this.arrow = this.container.createChild("span", {name: "arrow", innerHTML: "▾", style: {"font-size": "1.6em", "margin-left": "auto"}});

    // Expandable section
    this.panel = this.createChild("div", {class: "panel"});
    this.session.addEventListener("click", () => this.onPanelClicked());

    // Calibration
    const calibrationSection = this.panel.createChild("div", {class: "section"});
    calibrationSection.createChild("div", {class: "section-label", innerHTML: "EYE GAZE SCORES"});
    let calibrationContent = calibrationSection.createChild("div", {class: "section-content"});
    if (!sessionData.calibrationScores || sessionData.calibrationScores.length === 0) {
      calibrationContent.createChild("span", {innerHTML: "-"})
    } else {
      sessionData.calibrationScores.forEach((score, i) => {
        let row = calibrationContent.createChild("div", {class: "row-data"});
        row.createChild("span", {innerHTML: `Calibration ${i + 1}`});
        row.createChild("span", {innerHTML: `${score}%`, style: {"font-weight": 600}});
      });
    }

    // Settings changes
    const settingsSection = this.panel.createChild("div", {class: "section"});
    settingsSection.createChild("div", {class: "section-label", innerHTML: "SETTINGS"});
    let settingsContent = settingsSection.createChild("div", {class: "section-content"});
    if (!sessionData.settings || Object.keys(sessionData.settings).length === 0) {
      settingsContent.createChild("span", {innerHTML: "-"})
    } else {
      let hasChanges = false;
      for (const [settingPath, setting] of sessionData.settings) {
        if (setting.oldValue === setting.newValue) continue;
        hasChanges = true;
        let row = settingsContent.createChild("div", {class: "row-data"});
        const displaySetting = settingPath.replace(/^(participant|host)\//, "");
        row.createChild("span", {innerHTML: `${displaySetting.charAt(0).toUpperCase() + displaySetting.slice(1)}`});
        let settingDiv = row.createChild("div");
        let oldValue = typeof setting.oldValue  === "number" ? Math.round(setting.oldValue * 10) / 10 : setting.oldValue;
        let newValue = typeof setting.newValue  === "number" ? Math.round(setting.newValue * 10) / 10 : setting.newValue;
        if (this.optionToText[oldValue] || this.optionToText[newValue]) {
          oldValue = this.optionToText[oldValue];
          newValue = this.optionToText[newValue];
        }
        settingDiv.createChild("span", {innerHTML: `${oldValue} → `, style: {"color": "#b3b7c0"}});
        settingDiv.createChild("span", {innerHTML: `${newValue}`, style: {"font-weight": 600}});
      };
      if (!hasChanges) {
        settingsContent.createChild("span", {innerHTML: "-"});
      }
    }

    // Access methods
    const accessSection = this.panel.createChild("div", {class: "section"});
    accessSection.createChild("div", {class: "section-label", innerHTML: "ACCESS"});
    let accessContent = accessSection.createChild("div", {class: "section-content-wrap"});
    let accessUsed = false;
    Object.keys(sessionData.access).forEach((method) => {
      if (sessionData.access[method]) {
        accessUsed = true;
        accessContent.createChild("div", {
          class: "data-div",
          style: {color: "#7380ec", "background-color": "#eef2ff", border: "1px solid #d8e3ff"},
          innerHTML: method.charAt(0).toUpperCase() + method.slice(1)
        });
      }
    })
    if (!accessUsed) {
      accessContent.createChild("span", {innerHTML: "-"});
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
    const appsSection = this.panel.createChild("div", {class: "section"});
    appsSection.createChild("div", {class: "section-label", innerHTML: "APPS"});
    let appsContent = appsSection.createChild("div", {class: "section-content"});
    if (!sessionData.apps || Object.keys(sessionData.apps).length === 0) {
      appsContent.createChild("span", {innerHTML: "-"})
    } else {
      for (const [app, duration] of sessionData.apps) {
        let row = appsContent.createChild("div", {class: "row-data"});
        row.createChild("span", {innerHTML: app});
        row.createChild("span", {innerHTML: `${duration} min`, style: {"font-weight": 600}})
      }
    }


    // Quizzess 
    const quizzesSection = this.panel.createChild("div", {class: "section"});
    quizzesSection.createChild("div", {class: "section-label", innerHTML: "QUIZZES"});
    let quizzesContent = quizzesSection.createChild("div", {class: "section-content"});
    if (!sessionData.quizzes || Object.keys(sessionData.quizzes).length === 0) {
      quizzesContent.createChild("span", {innerHTML: "-"})
    } else {
      for (const [quiz, duration] of sessionData.quizzes) {
        let row = quizzesContent.createChild("div", {class: "row-data"});
        row.createChild("span", {innerHTML: quiz});
        row.createChild("span", {innerHTML: `${duration} min`, style: {"font-weight": 600}})
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