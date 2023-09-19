document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // add an event listenter to the compose submit-input to send an email
  document.querySelector("#compose-form").onsubmit = function(event) {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;
    fetch('emails',
    {method:"POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
    }).then(response => console.log(response.json()));
    load_mailbox('inbox');
    return false;
  }
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  console.log("load-mailbox");
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  const email_view = document.querySelector('#emails-view');

  var child = email_view.lastElementChild; 
  while (child) {
      email_view.removeChild(child);
      child = email_view.lastElementChild;
  }

  email_view.style.display = 'block';
  document.querySelector('#mail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // set previous html inside to none


  // Show the mailbox name
  email_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(data => data.forEach(element => {
    // create html elements of the mail preview
    const id = element['id']
    const div = document.createElement('div')
    // set the inner html of each element 
    div.innerHTML = `<div><p><strong>${element['sender']}</strong>&emsp;${element['subject']}</p></div>
    <div class = "timestamp"> ${element['timestamp']}</div>`;
    // color the background acording to 'read' flag
    if (element['read']) {
      div.className = "mail-card-read";
    }
    else {
      div.className = "mail-card-unread";
    }
    // append each mail preview to the emails-view div
    email_view.append(div);
    // add event listeners for each email preview
    div.addEventListener('click',() => mail(id));
  }))
}

// function used to display a particular email.
function mail(id) {
  // unhide parent div
  document.querySelector('#mail').style.display = 'block';
  // hide compose and inbox divs
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  // create p alements to display mail info
  const header = document.createElement('p');
  const body = document.createElement('p');
  const reply_btn = document.createElement('button');
  const archive_btn = document.createElement('button');
  reply_btn.innerHTML = 'Reply'
  reply_btn.className = 'btn btn-primary'
  archive_btn.className = 'btn btn-sm btn-outline-primary'
  // select div for the body of the mails
  const mail = document.querySelector('#mail-content')
  mail.innerHTML = '';
  // variable that will be used to save the promise in the 'then' chain
  let promise;
  // get request to emails api
  fetch(`/emails/${id}`,{method:'GET'})
  .then( request => {
    promise = request;
    return request.json();})
  .then(data => {
    // if the request was proccessed successfully then display the mail
    if (promise['status'] === 200 ) {
    // create body and header of the mail.
    header.innerHTML = `<strong>From: </strong>${data['sender']}<br>
    <strong>To: </strong>${data['recipients']}<br>
    <strong>subject: </strong>${data['subject']}<br>
    <strong>timestamp: </strong>${data['timestamp']}<br><hr>`;
    // set the body info in the mail div
    body.innerHTML = `${data['body']}`;
    // add an event listener to the archive button to archive or unarchive.
    // select archive btn and change inner html
    if (data['archived']){
      archive_btn.innerHTML = 'Unarchive';
    }
    else {
      archive_btn.innerHTML = 'Archive';
    }
    // append header and body of mail.
    mail.append(header, body);
    // add event listener to archive button.
    archive_btn.addEventListener('click', () => archive_request(id, data['archived']))
    // add event listener to reply button.
    reply_btn.addEventListener('click', () => reply_request(id, data))
    const butons_div = document.querySelector('#buttons')
    butons_div.innerHTML = ""
    butons_div.append(reply_btn, archive_btn)
    }
    // if mail doesn't exist display an error message.
    else {
    const error = document.createElement('h2');
    error.innerHTML = 'email does not exist';
    }
    console.log(data);
  });
  // mark the mail as read
  fetch(`/emails/${id}`,{method:'PUT', body:JSON.stringify({read:true})})
  .then(request => console.log(request));
}

function archive_request(id,action) {
  fetch(`/emails/${id}`, {method:"PUT", body:JSON.stringify({archived:!action})})
  .then((request) => {
    console.log(request);
    load_mailbox('inbox');});
}

function reply_request(id,data) {
  compose_email();
  const recip = document.querySelector("#compose-recipients").value = data['sender'];
  const subj = document.querySelector("#compose-subject").value = data['subject'];
  const bd = document.querySelector("#compose-body").value = data['body'];
}