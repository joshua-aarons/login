import { ref, sendEmailVerification, uploadFileToCloud, set, push } from "./firebase-client.js";

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
    await set(r, message)
}

export {sendEmailVerification}