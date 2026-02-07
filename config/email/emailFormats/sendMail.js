
import { RECEPIENTS } from "../../../constants.js"
import { sendEmailWithResend } from "../sendEmailWithResend.js"

export async function sendModeratorInvitationEmail(recepient, link) {

  const message = `<p>Click <a href="${link}">Here</a><br> Valid For 24 Hours</p>`

  await sendEmailWithResend(recepient, 'Maverick Invitation', message)
}

export async function sendForgotPasswordMail(recepient, link) {

  const message = `<!DOCTYPE html>
    <html dir="ltr" lang="en">
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
      <style>
        body {
          background-color: #f6f9fc;
          padding: 10px 0;
        }
    
        .container {
          max-width: 37.5em;
          background-color: #ffffff;
          border: 1px solid #f0f0f0;
          padding: 45px;
          margin: auto;
        }
    
        .text {
          font-size: 16px;
          line-height: 26px;
          margin: 16px 0;
          font-family: 'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;
          font-weight: 300;
          color: #404040;
        }
    
        .button {
          display: block;
          max-width: 100%;
          background-color: #000;
          border-radius: 4px;
          color: #fff;
          font-family: 'Open Sans', 'Helvetica Neue', Arial;
          font-size: 15px;
          text-align: center;
          width: 210px;
          padding: 14px 7px;
          margin: 10px 0;
          text-decoration: none;
        }
      </style>
    </head>
    
    <body>
      <div class="container" style="align:center;">
        <img alt="Dropbox" height="33" src="https://react-email-demo-ndjnn09xj-resend.vercel.app/static/dropbox-logo.png" style="display:block;outline:none;border:none;text-decoration:none" width="40" />
        <div class="content">
          <p class="text">Hi User,</p>
          <p class="text">Someone recently requested a password change for your Dropbox account. If this was you, you can set a new password <a href=${link} class="button" style="color:#fff" target="_blank">Reset Password</a></p>
          <p class="text">If you don't want to change your password or didn't request this, just ignore and delete this message.</p>
        </div>
      </div>
    </body>
    
    </html>
    `

  await sendEmailWithResend(recepient, 'Reset Forgotten Password', message)
}

export async function sendEmployeeInvitationEmail(recepient, link) {

  const message = `<p>Click <a href="${link}">Here</a><br> Valid For 24 Hours</p>`

  await sendEmailWithResend(recepient, 'Test App', message)
}

export async function sendConsultancyRequestEmail(newConsultancyRequest) {
  const { name, email, phone, subject, message } = newConsultancyRequest;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; padding: 20px;  color: #ffffff;">
      <div style="max-width: 600px; margin: auto; background-color: #000024; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid #333;">
        <div style="background-color: #111132; padding: 20px;">
          <h2 style="color: #ffffff; margin: 0; text-align: center;">New Consultancy Request</h2>
        </div>
        <div style="padding: 20px; color: #ffffff;">
          <p style="color: #ffffff;"><strong>Name:</strong> ${name}</p>
          <p style="color: #ffffff;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #a7c5ff;">${email}</a></p>
          ${phone ? `<p style="color: #ffffff;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #a7c5ff;">${phone}</a></p>` : ''}
          ${subject ? `<p style="color: #ffffff;"><strong>Subject:</strong> ${subject}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: #1a1a3c; padding: 10px; border-radius: 4px;">${message}</p>
        </div>
      
      </div>
    </div>
  `;

  await sendEmailWithResend(RECEPIENTS, 'ENN Consultancy Request', htmlMessage);
}


