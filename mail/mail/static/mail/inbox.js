document.addEventListener('DOMContentLoaded', function () {

  console.log('DOM Content Loaded');
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    send(event);
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  console.log(`Loading: ${mailbox}`);

  fetch(`/emails/${mailbox}`)
    .then(response => {
      if (response.ok) {
        let emails = response.json()
          .then(emails => {
            emails.forEach(email => {

              var displayedEmail = email.sender;
              if (displayedEmail === document.querySelector('#myemail').innerHTML) {
                var displayedEmail = `To: ${email.recipients}`;
              }

              if (email.read) {
                var readFlag = 'read';
              } else {
                var readFlag = 'unread';
              }

              var item = document.createElement('div');
              item.className = `mail ${readFlag}`;

              item.innerHTML =
                `<div class="sender">${displayedEmail}</div>
                <div class="mailheader">
                  <p class="subject">${email.subject}</p> 
                  <p class="timestamp">${email.timestamp}</p>
                </div>
                <div class="mailbody">
                  <p>${email.body}</p>
                </div>`;

              document.querySelector('#emails-view').appendChild(item);
              item.addEventListener('click', () => {
                read_mail(email.id, mailbox);
              })


            });
          });
      } else {
        let errorMessage = response.json()
          .then(message => {
            alert(message['error']);
          });
      }
    });

}

function send(event) {

  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  const submit = {
    recipients: recipients,
    subject: subject,
    body: body
  };

  fetch("/emails", {
      method: 'POST',
      body: JSON.stringify(submit)
    })
    .then(async response => {
      if (response.status === 201) {
        console.log('Email was sent OK.');
        load_mailbox('sent');
      } else {
        const errorMessage = await response.json();
        alert(errorMessage.error);
      }
    })
    .catch(err => {
      console.log(err)
    });
}

function read_mail(email, mailbox) {

  console.log(`Loading Email ${email}..`)
  
  fetch(`/emails/${email}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').innerHTML = '';

    var item = document.createElement('div');
    item.className = 'email-message'

    var childItem = document.createElement('div');
    childItem.className = 'message-head';
    childItem.innerHTML = `<p class="subject">${email.subject}</p> <p class="timestamp">${email.timestamp}</p>`;
    childItem.innerHTML += '<div class="break"></div>';
    childItem.innerHTML += `<div class="message-sender">Sender: ${email.sender}</div>`;
    childItem.innerHTML += '<button class="btn btn-success" id="reply-btn">Reply</button>';
    childItem.innerHTML += '<div class="break"></div>';
    childItem.innerHTML += `<div class="message-recipients">Recipients: ${email.recipients}</div>`;
    
    
    if (mailbox === 'inbox'){
      const archiveButton = document.createElement('button');
      archiveButton.className = "btn btn-secondary";
      archiveButton.id = 'archive-btn';
      archiveButton.innerHTML = 'Archive';

      archiveButton.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: true
          })
        })
        .then(response => {
          if (response.ok) {
            console.log(`Email ${email.id} has been archived.`);
          }
        })
        .then(response => {
          load_mailbox('inbox');
        });
      })
      childItem.appendChild(archiveButton);
    }

    if (mailbox === 'archive'){
      const archiveButton = document.createElement('button');
      archiveButton.className = "btn btn-secondary";
      archiveButton.id = 'unarchive-btn';
      archiveButton.innerHTML = 'Unarchive';

      archiveButton.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: false
          })
        })
        .then(response => {
          if (response.ok) {
            console.log(`Email ${email.id} has been un-archived.`);
          }
        })
        .then(response => {
          load_mailbox('inbox');
        })
      })
      childItem.appendChild(archiveButton);
    }


    item.appendChild(childItem);

    var childItem = document.createElement('div');
    childItem.className = 'message-body';
    childItem.innerHTML = `<p>${email.body}</p>`;
    item.appendChild(childItem);

    document.querySelector('#emails-view').appendChild(item);

    document.querySelector('#reply-btn').onclick = () => {

      compose_email();

      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;

      
      document.querySelector('#compose-body').focus();
      document.querySelector('#compose-body').scrollTo(0, 0);
      document.querySelector('#compose-body').setSelectionRange(0,0);
    }

  });

  console.log(`Marking ${email} as Read..`);
  fetch(`/emails/${email}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .then(response => console.log(`PUT Request status: ${response.status}`));

}