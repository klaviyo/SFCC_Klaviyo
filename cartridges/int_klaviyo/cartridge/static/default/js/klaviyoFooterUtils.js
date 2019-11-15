'use strict';

		
//subscribed dialog box close
$('#subscriber-ok-button').click(function (){	
  $('#dialog-confirm').dialog('close');
});
		 
//already subscribed dialog box close
$('#already-subscriber-ok-button').click(function (){
  $('#dialog-confirm2').dialog('close');
});

//validation check for email
function ValidateEmail (mail) {
  var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
  if (!pattern.test(mail.value)) {
    return (true);
  }
  alert("You have entered an invalid email address!");
  return (false);
}
	
	

//subscribe email list button  action
$('#email-alert-signup').on('submit', function(e){
  e.preventDefault();
  var email=document.getElementById("emailsignup").value;
  var form = $(this);
  if(ValidateEmail(email)) {
    $.ajax({
      type: 'POST',
            url: form.attr('action'),
            data: form.serialize(),
            success: function (response) {
            	if(response) {
                    if(response.status == 'success') {
                    	$('#email-alert-signup').find('input[name="dwfrm_subscribe_email"]').val("");
                    	$('#dialog-confirm').dialog();
                    } else if(response.status == 'alreadyconfirmed') {
                    	$('.ajaxsubscribeForm').find('input[name="dwfrm_subscribe_email"]').val("");
                    	$('#dialog-confirm2').dialog();
                    }
            	}        
            }
        });
	} else {
		alert('enter a valid email');
	}
});







