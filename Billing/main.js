import { get, getUID, initialise, ref, set, signIn } from "./firebase-client.js";

function getDetails(){
    return {
        'card-number': document.querySelector('#cardNumber').value,
        'cardholder-name': document.querySelector('#name').value,
        'cvc': document.querySelector('#cvc').value,
        'email': document.querySelector('#email').value,
        'expiry-date': document.querySelector('#month').value + '-' + document.querySelector('#year').value
    }
}

function setDetails(details){
    if (details == null) return
    let inputs = {
        'card-number': document.querySelector('#cardNumber'),
        'cardholder-name': document.querySelector('#name'),
        'cvc': document.querySelector('#cvc'),
        'email': document.querySelector('#email'),
        'expiry-date-mm': document.querySelector('#month'), 
        'expiry-date-yy': document.querySelector('#year')
    }
    let [mm,yy] = details['expiry-date'].split('-')

    details['expiry-date-mm'] = mm
    details['expiry-date-yy'] = yy
    
    for (let key in inputs) {
        inputs[key].value = details[key]
    }

    window.updateCardDisplay()
}

async function begin() {
    let loader = document.querySelector('squidly-loader')
    let container = document.querySelector('.container')
    
    let user = await initialise()

    console.log(user)

    if (user.emailVerified) {
        // Allowed to enter card details 
        let details = await get(ref(`users/${getUID()}/billing-details`))
        setDetails(details.val())
        loader.hide(0.3)
        let button = document.querySelector('button[type = submit]')
        button.onclick = async () => {
            container.style.opacity = 0.5
            container.style['pointer-events'] = 'none'
            let details = getDetails()
            let billerref = ref(`users/${getUID()}/billing-details`)
            await set(billerref, details)
            await new Promise((resolve, reject) => setTimeout(resolve, 1500))
            container.style.opacity = 1
            container.style['pointer-events'] = 'all'
        }
    } else {
        // Havent signed in so they should sign in 
    
    }
}



begin()
