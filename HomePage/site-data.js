import { relURL } from "../Utilities/utils.js"
function imgURL(img) {
    return relURL(`../images/${img}`, import.meta);
}

export const Testimonials = [
    {
        img: "./images/people/brandon.jpg",
        name: "Brandon Yeo",
        text: "Squidly is an amazing tool that allows clinicians to remotely trial eye gaze needs for clients easily.",
        title: "Speech Pathologist",
    },
    {
        img: "./images/people/petra.png",
        text: "Squidly is the only technology i've seen that gives eye gaze users the independence and remote access to take control.",
        name: "Dr Petra Karlsson",
        title: "Technology Theme Leader"
    },
    {
        img: "./images/people/annie.png",
        text: "Squidly opens up a whole new world of communication, learning, and connection for people with complex access needs.",
        name: "Dr Annemarie Murphy",
        title: "Senior Speech Pathologist"
    },
    {
        img: "./images/people/jeffrey.jpg",
        text: "Just used Squidly with one of my students ... oh. The custom quizzes fit in really well with my lessons.",
        name: "Jeffrey Ding",
        title: "Mentor"
    },
    // {
    //     img: "./images/people/sarah.jpg",
    //     text: "Squidly is the perfect research and therapy intervention platform I can use virtually with clients across Australia.",
    //     name: "Dr Sarah Reedman",
    //     title: "Postdoc Research Fellow"
    // },
    // {
    //     img: "./images/people/lauren.png",
    //     text: "I went from never hearing about Squidly to many SPs telling me it's their new favourite tool. Seemingly overnight!",
    //     name: "Lauren Curtis",
    //     title: "Clinical Educator"
    // },
    {
        img: "./images/people/fuad.png",
        text: "Squidly is goated for real. I feel included, and connected.",
        name: "Fuad Ferdous",
        title: "Student"
    },
    // {
    //     img: "./images/people/avril.png",
    //     text: "As an eye-gaze user, this gives me back my autonomy and privacy.",
    //     name: "Avril P",
    //     title: "AAC users"
    // },
    {
        img: "./images/people/gabrielle.jpg",
        text: "Started using Squidly yesterday and I'm blown away. Engaging, accessible, and inclusive for all my students.",
        name: "Gabrielle Fisher",
        title: "Special Ed Teacher"
    }
]
export const FAQ = {
    questions: [
        {
            "question": "Why isn’t Squidly completely free?",
            "answer": "Hosting calls and ML models cost quite a bit of money to run. To grow Squidly sustainably without compromising our service quality, we need to cover our costs."
        },
        {
            "question": "Do I need special hardware or software to use Squidly?",
            "answer": "No! Squidly is browser-based and works seamless without additional hardware, software installations or AAC devices."
        },
        {
            "question": "Can Squidly integrate with my existing AAC device",
            "answer": "Squidly’s API-driven design easily integrates with existing AAC devices offering Tobii eye gaze accessibility during sessions. We are continually adding features to improve integrations further."
        },
        {
            "question": "Is Squidly secure and compliant?",
            "answer": "Absolutely. Squidly employs end-to-end encryption and follows strict data privacy rules, complying with Australian data regulations and laws to ensure your privacy and security is our priority."
        },
        {
            "question": "Where does Squidly use custom models?",
            "answer": "Squidly is powered by a combination of custom models and API models. Our custom models entirely power features like webcam eye gaze. They work alongside the API models to improve the intelligence and speed of the Session."
        },
        {
            "question": "How do the plan limits work?",
            "answer": "If you go over your limit, we’ll kindly ask you to upgrade your licence."
        },
        {
            "question": "What assistive features does Squidly offer?",
            "answer": "Squidly includes webcam eye-gaze control, customisable communication boards and quizzes, switch access, non-standard speech transcription, low-vision modes, text-to-speech, remote setup mode and much more. We’re continually working with clinicians and AAC users to add more features as we grow."
        },
        {
            "question": "Can I trial Squidly first?",
            "answer": "Yes. Squidly offers 7-day free trials so you can explore all of its features before subscribing."
        },
        {
            "question": "Who is Squidly for?",
            "answer": "Squidly supports clinicians, educators, carers, and individuals who use assistive technology like eye-gaze, switches, or communications boards or have complex communication needs."
        },
        {
            "question": "Where can I access Squidly?",
            "answer": "Squidly is available globally, accessible through standard web browsers."
        },
        {
            "question": "Do my client’s need an account?",
            "answer": "No, Squidly was designed with accessibility first. Your client’s don’t need to register or fill out any personal information, just click the secure meeting link and join immediately."
        },
       
    ],
    lastQuestion: {
        "call-to-action": "Note: add extra border style to this card",
        "question": "Where can I ask more questions?",
        "answer": "You’re welcome to email us directly or schedule a call with one of our team members who will be happy to assist.",
        "purple-btn": "Contact us",
        "white-btn": "Schedule a call"
    }
}
export const TrustedCompanieLogos = [
    {
        alt: "Cerebral Palsy Alliance",
        src: imgURL("companies/cpa.png")
    },
    {
        alt: "University of Sydney",
        src: imgURL("companies/usyd.png")
    },
    {
        alt: "Australian Rehabilitation and Assistive Technology Association",
        src: imgURL("companies/arata.png")
    },
    {
        alt: "Royal Melbourne Institute of Technology",
        src: imgURL("companies/rmit.png")
    },
    {
        alt: "Assistive Technology Suppliers Australia",
        src: imgURL("companies/atsa.png")
    }
];
export const Features = [
    {
        "title": "Eye Gaze\nControl",
        "text": "Powered by proprietary models, Squidly includes a powerful interactive webcam eye gaze option making it the only solution clinically verified that virtually connects people and enables remote eye gaze communication.",
        "image": imgURL("hero-image.png"),
        "children":  [
            {
                "title": "Precise Tracking",
                "text": "Immediate eye-gaze access without extra devices or software.",
                "image": imgURL("features/precise.svg")
            },
            {
                "title": "Zero Touch Calibration",
                "text": "Use Squidly instantly with no complicated setup or lengthy calibration.",
                "image": imgURL("features/calibration.svg")
            },
            {
                "title": "Integrated AAC Tools",
                "text": "Effortlessly combine eye-gaze with built-in communication boards, quizzes and tools.",
                "image": imgURL("features/settings-calibration.svg")
            } 
        ],
    },
    {
        "title": "Universal\nAccessibility",
        "text": "Squidly ensures every session is inclusive, empowering meaningful interactions regardless of ability or communication method.",
        "image": imgURL("features/hero-card-2-with-cursor.png"),
        "children": [
            {
                "title": "Switch Access Ready",
                "text": "Navigate sessions indepently with built-in adaptive switch scanning controls.",
                "image": imgURL("features/switch.svg")
            },
            {
                "title": "Enhanced Low-Vision Modes",
                "text": "Clearly view sessions with high-contrast visuals and larger text.",
                "image": imgURL("features/settings-display.svg")
            },
            {
                "title": "Easy Communication Boards",
                "text": "Quickly personalise communication boards and quizzes for immediate, accessibly interactions. Share them with colleagues or the community.",
                "image": imgURL("features/quiz-editor-2.png")
            },
            {
                "title": "Simplified Navigation Layout",
                "text": "Clear, intuitive navigation ensures easy use with minimal effort.",
                "image":  imgURL("features/share.svg")
            },
            {
                "title": "AI Text-to-Speech",
                "text": "Natural, clear and personalised voice models giving every user a voice.",
                "image": imgURL("features/settings-sound.svg")
            },
            {
                "title": "Smart Session Reports",
                "text": "Automated, insightful session summaries highlighting progress and user engagement.",
                "image": imgURL("features/test-results.png")
            }
        ]
    },
    {
        "title": "Privacy\nBuilt-in",
        "text": "Squidly priorities your privacy, meeting strict Australian security standards to protect every interaction and user data.",
        "image": imgURL("features/privacy.png"),
        "children": [
            {
                "title": "End-to-End Encryption",
                "text": "Securely encrypted video, audio, and communication at every moment.",
                "image": ""
            },
            {
                "title": "Australian Privacy Compliance",
                "text": "Fully aligned with Australian privacy standards, ensuring secure interactions",
                "image": ""
            }
        ]
    },
            
]