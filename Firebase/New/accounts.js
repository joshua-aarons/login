import { createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, uploadFileToCloud } from "../firebase-client.js";
import { setUserInfo } from "./user.js";
class LoginError extends Error {
    constructor(error) {
        let inputName = "";
        let errorCode = error;
        if (error.code) errorCode = error.code;
        // Display the error message
        let message = "";
        switch (errorCode) {
            case "auth/invalid-credential":
            case "auth/invalid-login-credentials":
                inputName = "email";
                message = "wrong email and/or password";
                break;

            case "auth/email-already-in-use":
            case "auth/email-already-exists":
                inputName = "email";
                message = "An account with this email already exists";

                break;

            case "auth/user-not-found":
                inputName = "email";
                message = "email not found";
                break;

            case "auth/invalid-email":
                message = "wrong email";
                inputName = "email";
                break;

            case "auth/wrong-password":
                message = "wrong password";
                inputName = "password";
                break;

            case "auth/too-many-requests":
                message = "To many attempts";
                inputName = "password";

            // TODO: Check other errors
            default:
                message = errorCode;
                break;

        }
        super(message);
        this.inputName = inputName;
    }
}

export async function signin(type, info) {
    switch (type) {
        case "email":
            let { email, password } = info;
            try {
                await signInWithEmailAndPassword(email, password);
            } catch (error) {
                throw new LoginError(error);
            }
            break;

        // case "gmail":
        //     const gprovider = new GoogleAuthProvider();
        //     signInWithRedirect(Auth, gprovider);
        //     break;

        // case "facebook": 
        //     const fprovider = new FacebookAuthProvider();
        //     fprovider.addScope("email");
        //     fprovider.addScope("public_profile");
        //     signInWithRedirect(Auth, fprovider);
        //     break;

        // case "facebook":
        //     throw new LoginError("Facebook has not yet been setup.");
    }
}



export async function sendForgotPasswordEmail(email) {
    await sendPasswordResetEmail(email)
}

export async function signup(type, info) {
    switch (type) {
        case "email":
            let { email, password } = info;
            delete info.password;
            try {
                // Register user
                await createUserWithEmailAndPassword(Auth, email, password);

                // Set user info
                setUserInfo(info);

                // send email verification
                await sendEmailVerification();

                signout();
            } catch (error) {
                throw new LoginError(error);
            }
            break;

        // case "gmail":
        //     const provider = new GoogleAuthProvider();
        //     signInWithRedirect(Auth, provider);
        //     break;

        // case "facebook":
        //     throw new LoginError("Facebook has not yet been setup.");
    }
}

export function signout() { signOut() }

export async function resetPassword(data) {
    let credentials = EmailAuthProvider.credential(User.email, data.oldpasscode)
    await reauthenticateWithCredential(User, credentials)
    await updatePassword(User, data.newpasscode)
}

export async function sendSupportMessage(message, progress) {
    let r = push(ref("messages"))
    let key = r.key
    if (message.attachment instanceof File) {
        message.attachment = await uploadFileToCloud(message.attachment, `messages/${key}`, (uts) => {
            console.log(uts)
            if (progress instanceof Function)
                progress(uts.bytesTransferred / uts.totalBytes)
        })
    } else if ('attachment' in message) {
        delete message.attachment
    }
    console.log(message)
    await set(r, message)
}

export {sendEmailVerification}