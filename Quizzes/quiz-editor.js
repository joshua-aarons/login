const IS_DEV = false && window.location.origin.startsWith("http://127");
const URL = IS_DEV ? "http://127.0.0.1:5502" : "https://quizzes.squidly.com.au"

let URL_GE = URL + "/QuizEditor/quiz-editor.js";
import { ShadowElement } from "../Utilities/CustomComponent.js";
import { SvgPlus } from "../SvgPlus/4.js";

class QuizEditorContainer extends ShadowElement {
    constructor(el = "quiz-editor-container"){
        super(el, "quiz-root");
        this.load();
        this.root.styles = {color: "black"}
    }

    async load(){
        const {QuizEditorApp} = await import(URL_GE)
        this.quizEditor = new QuizEditorApp();
        this.quizEditor.addEventListener("error", ({error}) => {
            error.errors.map(em => showNotification(em, 3000, "error"));
        })
        this.appendChild(this.quizEditor);
        await Promise.all([
            this.loadStyles(),
            this.quizEditor.initialise(),
        ]);
    }
    static get usedStyleSheets() {return [
        URL + "/editor.css",
        URL + "/symbols.css",
        URL + "/quiz.css",
        URL + "/results.css",
        URL + "/inputs.css"
    ]}
}

SvgPlus.defineHTMLElement(QuizEditorContainer)