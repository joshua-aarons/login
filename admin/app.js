const inputs = document.querySelectorAll(".contact-input");

inputs.forEach(ipt => {
    ipt.addEventListener("focus", () => {
        ipt.parentNode.classList.add("focus");
        ipt.parentNode.classList.add("not-empty");
    });
    ipt.addEventListener("blur", () => {
        if(ipt.value == "") {
            ipt.parentNode.classList.remove("not-empty"); 
        };
        ipt.parentNode.classList.remove("focus");
    });
});

// function clearForm() {
//     document.getElementById('meeting-description')[0].value = '';
//     document.getElementById('when')[0].value = '';
//     document.getElementById('finish')[0].value = '';
//     document.getElementById('timezone')[0].value = '';
// }

document.querySelector("[name='end-time']").addEventListener("change", myFunction);
const timeStamp = document.getElementById('time-stamp')



function myFunction() {

  //value start
  var start = Date.parse($("[name=start-time]").val()); //get timestamp

  //value end
    var end = Date.parse($("[name=end-time]").val()); //get timestamp

  totalHours = NaN;
  if (start < end) {
    totalHours = Math.floor((end - start) / 1000 / 60); //milliseconds: /1000 / 60 / 60
  }
  $("#total-hours").val(totalHours);
  timeStamp.classList.add("not-empty")
}

// const changeState = () => {
//     let fas = document.getElementById('fas');
//     fas.classList.toggle("fa-angle-up");
// }

