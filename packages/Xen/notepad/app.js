
const textarea = document.querySelector("textarea");
const saveStatus = document.getElementById('saveStatus')
let StoredContent = localStorage.getItem("__XenOS_Apps_Notes_Content_ANOTE") || "";


textarea.value = StoredContent;


var status = false; 
document.addEventListener("keydown", function(event) {
  
  
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    console.log('hi')
    event.preventDefault();
      saveStatus.innerText = 'Saved!'
   
       saveStatus.innerText = 'Saved!'
  

    localStorage.setItem("__XenOS_Apps_Notes_Content_ANOTE", textarea.value);
  } else if(!event.ctrlKey || !event.metaKey) {
     setTimeout(function(){
    saveStatus.innerText = 'unsaved changes! (ctrl+s)'
         }, 1000)
  }
});
