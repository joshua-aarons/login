

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDOhP-lTY1EC8XuHJUnxkWO5Tw8lolaV3s",
    authDomain: "login-with-firebase-data-5e14d.firebaseapp.com",
    projectId: "login-with-firebase-data-5e14d",
    storageBucket: "login-with-firebase-data-5e14d.appspot.com",
    messagingSenderId: "356416145411",
    appId: "1:356416145411:web:b0903c1e4ce0c40bc06636"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Initialise variables
const auth = firebase.auth();
const database = firebase.database();

async function checkForSignIn(){
    console.log();
    if(firebase.auth().isSignInWithEmailLink(window.location.href)) {
        var email = window.localStorage.getItem('email');
        if (!email) {
            // User opened the link on a different device. To prevent session fixation
            // attacks, ask the user to provide the associated email again. For example:
            email = window.prompt('Please provide your email for confirmation');
        }
        
        try {
            let res = await firebase.auth().signInWithEmailLink(email, window.location.href)
            window.localStorage.removeItem('email');
            alert("Email Verified");
            var user = auth.currentUser
            console.log(auth.currentUser);
            var database_ref = database.ref()
            database_ref.child('users/' + user.uid).set({
                email: email
            })
        }catch(e){
        }
    }
}
checkForSignIn();

// Set up our register function

async function register () {
    // Get all our input fields

    email = document.getElementById('email').value
    password = document.getElementById('password').value
    first_name = document.getElementById('first_name').value
    last_name = document.getElementById('last_name').value
  
    // Validate input fields
    if (validate_email(email) == false || validate_password(password) == false) {
      alert('Email or Password is Invalid')
      return
      // Don't continue running the code
    }
    if (validate_field(first_name) == false || validate_field(last_name) == false) {
      alert('One or More Fields is Invalid')
      return
    }

    const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: 'http://127.0.0.1:5500',
        // This must be true.
        handleCodeInApp: true,
    };

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);

        localStorage.setItem("email", email);
        // Move on with Auth
          // Declare user variable
        //   
      
        //   // Add this user to Firebase Database
        //   var database_ref = database.ref()
      
        //   // Create User data
        //   var user_data = {
        //     email : email,
        //     first_name : first_name,
        //     last_name : last_name,
        //     last_login : Date.now()
        //   }
    
        //   console.log(database_ref)
    
        //   // Push to Firebase Database
        //   database_ref.child('users/' + user.uid).set(user_data)
      
        //   // Done
          alert('Email link has been sent')
        
    } catch (error) {
        var error_code = error.code
        var error_message = error.message
    
        alert(error_message)
    }
}
  
  // Set up our login function
  async function login () {
    // Get all our input fields
    email = document.getElementById('email-same').value
    password = document.getElementById('password-same').value
  
    // Validate input fields
    if (validate_email(email) == false || validate_password(password) == false) {
      alert('Email or Password is Invalid')
      return
      // Don't continue running the code
    }

 
  
    await auth.signInWithEmailAndPassword(email, password)
    // Declare user variable
    var user = auth.currentUser
    if(firebase.auth().isSignInWithEmailLink(window.location.href)){
        var credential = firebase.auth.EmailAuthProvider.credentialWithLink(email, window.location.href);
        // Link the credential to the current user.
        await firebase.auth().currentUser.linkWithCredential(credential)
    }

    // Add this user to Firebase Database
    var database_ref = database.ref()

    // Create User data
    var user_data = {
    last_login : Date.now()
    }

    // Push to Firebase Database
    database_ref.child('users/' + user.uid).update(user_data)

    // DOne
    alert('User Logged In')
  }
  
  
  
  
  // Validate Functions
function validate_email(email) {
    expression = /^[^@]+@\w+(\.\w+)+\w$/
    if (expression.test(email) == true) {
      // Email is good
      return true
    } else {
      // Email is not good
      return false
    }
}
  
function validate_password(password) {
    // Firebase only accepts lengths greater than 6
    if (password < 6) {
      return false
    } else {
      return true
    }
}
  
  function validate_field(field) {
    if (field == null) {
      return false
    }
  
    if (field.length <= 0) {
      return false
    } else {
      return true
    }
  }

window.addEventListener('popstate', function () {
    alert('i am here')
})