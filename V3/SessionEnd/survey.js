import { initialise, ref, set } from "../../Firebase/firebase-client.js";

initialise();

 const percents = {
    0: 0,
    1: 0,
    2: 33.33,
    3: 33.33,
    4: 66.66,
    5: 100
}

 const questions = {
    0: 0,
    1: 1,
    2: 2,
    3: 2,
    4: 3,
    5: 4
}

let params = new URLSearchParams(document.location.search);
const sid = params.get("sid")
const host = params.get("host")

function updateProgressBar(animate) {
  let progressFill = document.querySelector(".progress-fill");
  if (animate) {
    progressFill.style.transition = "width 0.5s ease-in-out";
  } else {
    progressFill.style.transition = "none";
  }

  let percent = percents[currQuestion];
  progressFill.style.width = percent + "%";

  let markers = document.querySelectorAll(".marker");
  let markerContents = document.querySelectorAll(".marker-content");

  markers.forEach((marker, index) => {
    // Completed
    if (index < (questions[currQuestion] - 1)) {
      markerContents[index].classList.remove("marker-current");
      markerContents[index].classList.add("marker-complete");
      marker.classList.add("marker-colour")
    } 
    // Current
    else if (index === (questions[currQuestion] - 1)) {
      markerContents[index].classList.remove("marker-complete");
      marker.classList.remove("marker-colour")
      markerContents[index].classList.add("marker-current");
    } 
    // Incomplete 
    else {
      markerContents[index].classList.remove("marker-complete");
      markerContents[index].classList.remove("marker-current");
      marker.classList.remove("marker-colour")
    }
  });
}

function onQuestionChange() {
  if (currQuestion == 0) {
    document.getElementById("back-button").style.display = "none";
    document.querySelector(".title").style.opacity = "100";
  }
  if (currQuestion > 0) {
    document.querySelector(".title").style.opacity = "0";
    document.querySelector(".progress-container").style.display = "flex";
    document.getElementById("back-button").style.display = "block";
    document.getElementById("next-button").style.display = "block";
  }
  if (currQuestion === questionDivs.length - 1) {
    document.getElementById("next-button").style.display = "none";
    document.getElementById("submit-button").style.display = "block";
  } 
  else {
    document.getElementById("submit-button").style.display = "none";
  }

  for (let i = 0; i < questionDivs.length; i++) {
    if (i === currQuestion) {
      questionDivs[i].style.display = "flex";
    } else {
      questionDivs[i].style.display = "none";
    }
  }
}

let currQuestion = 0;
const questionDivs = document.querySelectorAll(".question");
questionDivs[currQuestion].style.display = "flex";

let nextButton = document.getElementById("next-button");
nextButton.addEventListener("click", () => {
  if (currQuestion === 2 && !radioContainer.querySelector("input").checked) {
    currQuestion += 2;
  } else {
    currQuestion++;
  }

  onQuestionChange();
  updateProgressBar(true);
});

let backButton = document.getElementById("back-button");
backButton.addEventListener("click", () => {
  if (currQuestion === 4 && !radioContainer.querySelector("input").checked) {
    currQuestion -= 2;
  } else {
    currQuestion--;
  }

  onQuestionChange();
  updateProgressBar(false);
});

let faces = document.querySelectorAll(".emoji-text");
let emojis = document.querySelectorAll(".emoji");
for (let face of faces) {
  face.addEventListener("click", () => {
    for (let emoji of emojis) {
      emoji.classList.remove("selected-emoji");
    }
    face.querySelector("img").classList.add("selected-emoji");
  });
}

let radioContainer = document.getElementById("opt-yes");
let radioContainerNo = document.getElementById("opt-no");
radioContainerNo.addEventListener("click", () => {
  let checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (let checkbox of checkboxes) {
    checkbox.checked = false;
  }
});

let npsButtons = document.querySelectorAll(".nps-container div");
let npsScore = -1;
for (let index = 0; index < npsButtons.length; index++) {
  if (index >= 0 && index < 7) {
    npsButtons[index].style.backgroundColor = "#fa554cff";
  }
  else if (index >= 7 && index < 9) {
    npsButtons[index].style.backgroundColor = "#e9a22f";
  }
  else {
    npsButtons[index].style.backgroundColor = "#4cc732";
  }
  npsButtons[index].addEventListener("click", () => {
    npsScore = index;
    for (let button of npsButtons) {
      button.classList.remove("nps-selected");
    }
    const button = npsButtons[index];
    button.classList.add("nps-selected");
  });
}

const exitButton = document.getElementById("exit-survey");
exitButton.addEventListener("click", () => {
  window.location.href = "index.html";
});

let submitButton = document.getElementById("submit-button");
submitButton.addEventListener("click", async (e) => {
  e.preventDefault();

  let data = {
    "experience": "",
    "experiencedDifficulties": null,
    "technicalDifficulties": [],
    "npsScore": -1,
    "comments": "",
    "date": Date.now()
  }

  emojis.forEach(emoji => {
    if (emoji.classList.contains("selected-emoji")) {
      let emojiText = emoji.nextElementSibling.innerText;
      data["experience"] = emojiText;
    }
  })

  const bool = document.getElementById("opt-yes").querySelector("input").checked ? true : false;
  data["experiencedDifficulties"] = bool;
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      data["technicalDifficulties"].push(checkbox.name);
    }
  });

  data["npsScore"] = npsScore;

  const comment = document.getElementById("comments").value.trim();
  data["comments"] = comment;

  await set(ref(`users/${host}/responses/${sid}`), data);
  window.location.replace("index.html");
});