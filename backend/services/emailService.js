const nodemailer = require('nodemailer');

/**
 * Email Service for RallyPoint Tournament Management System
 * Handles all email notifications using Nodemailer
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter with configuration from environment variables
 */
const initializeTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return transporter;
};

/**
 * Send email with error handling
 * @param {Object} mailOptions - Email options (to, subject, html, text)
 * @returns {Promise<Object>} - Result of email sending
 */
const sendEmail = async (mailOptions) => {
  try {
    // Validate required fields
    if (!mailOptions.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!mailOptions.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!mailOptions.html && !mailOptions.text) {
      throw new Error('Email content (html or text) is required');
    }
    
    // Initialize transporter if not already done
    const emailTransporter = initializeTransporter();
    
    // Set default from address
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    // Prepare mail options
    const options = {
      from: from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html
    };
    
    // Send email
    const info = await emailTransporter.sendMail(options);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

/**
 * Email template for request acceptance notification
 * @param {Object} data - Request and match data
 * @returns {Object} - Email subject and HTML content
 */
const requestAcceptedTemplate = (data) => {
  const { playerName, requestType, matchDetails, tournamentName } = data;
  
  const subject = `Request Accepted - ${tournamentName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .match-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Accepted</h1>
        </div>
        <div class="content">
          <p>Dear ${playerName},</p>
          <p>Your <strong>${requestType}</strong> request has been <strong>accepted</strong> by the tournament organiser.</p>
          
          <div class="match-details">
            <h3>Match Details</h3>
            <p><strong>Tournament:</strong> ${matchDetails.tournament}</p>
            <p><strong>Category:</strong> ${matchDetails.category}</p>
            <p><strong>Opponent:</strong> ${matchDetails.opponent}</p>
            ${matchDetails.court ? `<p><strong>Court:</strong> ${matchDetails.court}</p>` : ''}
            ${matchDetails.date ? `<p><strong>Date:</strong> ${matchDetails.date}</p>` : ''}
            ${matchDetails.time ? `<p><strong>Time:</strong> ${matchDetails.time}</p>` : ''}
          </div>
          
          ${requestType === 'reschedule' ? 
            '<p>Please coordinate with the organiser for the new match schedule.</p>' : 
            '<p>The match has been recorded as a walkover.</p>'
          }
          
          <p>Thank you for participating in ${tournamentName}!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from RallyPoint Tournament Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Request Accepted - ${tournamentName}

Dear ${playerName},

Your ${requestType} request has been accepted by the tournament organiser.

Match Details:
- Tournament: ${matchDetails.tournament}
- Category: ${matchDetails.category}
- Opponent: ${matchDetails.opponent}
${matchDetails.court ? `- Court: ${matchDetails.court}` : ''}
${matchDetails.date ? `- Date: ${matchDetails.date}` : ''}
${matchDetails.time ? `- Time: ${matchDetails.time}` : ''}

${requestType === 'reschedule' ? 
  'Please coordinate with the organiser for the new match schedule.' : 
  'The match has been recorded as a walkover.'
}

Thank you for participating in ${tournamentName}!

---
This is an automated message from RallyPoint Tournament Management System.
  `;
  
  return { subject, html, text };
};

/**
 * Email template for request rejection notification
 * @param {Object} data - Request and match data
 * @returns {Object} - Email subject and HTML content
 */
const requestRejectedTemplate = (data) => {
  const { playerName, requestType, matchDetails, tournamentName } = data;
  
  const subject = `Request Rejected - ${tournamentName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .match-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Rejected</h1>
        </div>
        <div class="content">
          <p>Dear ${playerName},</p>
          <p>Your <strong>${requestType}</strong> request has been <strong>rejected</strong> by the tournament organiser.</p>
          
          <div class="match-details">
            <h3>Match Details</h3>
            <p><strong>Tournament:</strong> ${matchDetails.tournament}</p>
            <p><strong>Category:</strong> ${matchDetails.category}</p>
            <p><strong>Opponent:</strong> ${matchDetails.opponent}</p>
            ${matchDetails.court ? `<p><strong>Court:</strong> ${matchDetails.court}</p>` : ''}
            ${matchDetails.date ? `<p><strong>Date:</strong> ${matchDetails.date}</p>` : ''}
            ${matchDetails.time ? `<p><strong>Time:</strong> ${matchDetails.time}</p>` : ''}
          </div>
          
          <p>The match will proceed as originally scheduled. If you have any concerns, please contact the tournament organiser directly.</p>
          
          <p>Thank you for participating in ${tournamentName}!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from RallyPoint Tournament Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Request Rejected - ${tournamentName}

Dear ${playerName},

Your ${requestType} request has been rejected by the tournament organiser.

Match Details:
- Tournament: ${matchDetails.tournament}
- Category: ${matchDetails.category}
- Opponent: ${matchDetails.opponent}
${matchDetails.court ? `- Court: ${matchDetails.court}` : ''}
${matchDetails.date ? `- Date: ${matchDetails.date}` : ''}
${matchDetails.time ? `- Time: ${matchDetails.time}` : ''}

The match will proceed as originally scheduled. If you have any concerns, please contact the tournament organiser directly.

Thank you for participating in ${tournamentName}!

---
This is an automated message from RallyPoint Tournament Management System.
  `;
  
  return { subject, html, text };
};

/**
 * Email template for match reminder notification
 * @param {Object} data - Match data
 * @returns {Object} - Email subject and HTML content
 */
const matchReminderTemplate = (data) => {
  const { playerName, matchDetails, tournamentName } = data;
  
  const subject = `Match Reminder - ${tournamentName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .match-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .highlight { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Match Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${playerName},</p>
          <p>This is a reminder about your upcoming match in <strong>${tournamentName}</strong>.</p>
          
          <div class="match-details">
            <h3>Match Details</h3>
            <p><strong>Tournament:</strong> ${matchDetails.tournament}</p>
            <p><strong>Category:</strong> ${matchDetails.category}</p>
            <p><strong>Opponent:</strong> ${matchDetails.opponent}</p>
            ${matchDetails.court ? `<p><strong>Court:</strong> ${matchDetails.court}</p>` : ''}
            ${matchDetails.date ? `<p><strong>Date:</strong> ${matchDetails.date}</p>` : ''}
            ${matchDetails.time ? `<p><strong>Time:</strong> ${matchDetails.time}</p>` : ''}
          </div>
          
          <div class="highlight">
            <p><strong>⏰ Please arrive at least 15 minutes before your scheduled time.</strong></p>
          </div>
          
          <p>Good luck with your match!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from RallyPoint Tournament Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Match Reminder - ${tournamentName}

Dear ${playerName},

This is a reminder about your upcoming match in ${tournamentName}.

Match Details:
- Tournament: ${matchDetails.tournament}
- Category: ${matchDetails.category}
- Opponent: ${matchDetails.opponent}
${matchDetails.court ? `- Court: ${matchDetails.court}` : ''}
${matchDetails.date ? `- Date: ${matchDetails.date}` : ''}
${matchDetails.time ? `- Time: ${matchDetails.time}` : ''}

⏰ Please arrive at least 15 minutes before your scheduled time.

Good luck with your match!

---
This is an automated message from RallyPoint Tournament Management System.
  `;
  
  return { subject, html, text };
};

/**
 * Send request acceptance notification email
 * @param {Object} request - Request object with populated fields
 * @returns {Promise<Object>} - Result of email sending
 */
const sendRequestAcceptedEmail = async (request) => {
  try {
    const playerEmail = request.playerId.email;
    const playerName = request.playerId.name;
    const requestType = request.type;
    const tournamentName = request.matchId.tournamentId.name;
    
    // Get opponent name
    const opponent = request.matchId.players.find(
      p => p.playerId.toString() !== request.playerId._id.toString()
    );
    
    const matchDetails = {
      tournament: tournamentName,
      category: request.matchId.categoryId.name,
      opponent: opponent ? opponent.name : 'TBD',
      court: request.matchId.schedule.courtNumber,
      date: request.matchId.schedule.date ? new Date(request.matchId.schedule.date).toLocaleDateString() : null,
      time: request.matchId.schedule.time
    };
    
    const emailContent = requestAcceptedTemplate({
      playerName,
      requestType,
      matchDetails,
      tournamentName
    });
    
    return await sendEmail({
      to: playerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  } catch (error) {
    console.error('Error sending request accepted email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send request accepted email'
    };
  }
};

/**
 * Send request rejection notification email
 * @param {Object} request - Request object with populated fields
 * @returns {Promise<Object>} - Result of email sending
 */
const sendRequestRejectedEmail = async (request) => {
  try {
    const playerEmail = request.playerId.email;
    const playerName = request.playerId.name;
    const requestType = request.type;
    const tournamentName = request.matchId.tournamentId.name;
    
    // Get opponent name
    const opponent = request.matchId.players.find(
      p => p.playerId.toString() !== request.playerId._id.toString()
    );
    
    const matchDetails = {
      tournament: tournamentName,
      category: request.matchId.categoryId.name,
      opponent: opponent ? opponent.name : 'TBD',
      court: request.matchId.schedule.courtNumber,
      date: request.matchId.schedule.date ? new Date(request.matchId.schedule.date).toLocaleDateString() : null,
      time: request.matchId.schedule.time
    };
    
    const emailContent = requestRejectedTemplate({
      playerName,
      requestType,
      matchDetails,
      tournamentName
    });
    
    return await sendEmail({
      to: playerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  } catch (error) {
    console.error('Error sending request rejected email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send request rejected email'
    };
  }
};

/**
 * Send match reminder email
 * @param {Object} match - Match object with populated fields
 * @param {Object} player - Player object
 * @returns {Promise<Object>} - Result of email sending
 */
const sendMatchReminderEmail = async (match, player) => {
  try {
    const playerEmail = player.email;
    const playerName = player.name;
    const tournamentName = match.tournamentId.name;
    
    // Get opponent name
    const opponent = match.players.find(
      p => p.playerId.toString() !== player._id.toString()
    );
    
    const matchDetails = {
      tournament: tournamentName,
      category: match.categoryId.name,
      opponent: opponent ? opponent.name : 'TBD',
      court: match.schedule.courtNumber,
      date: match.schedule.date ? new Date(match.schedule.date).toLocaleDateString() : null,
      time: match.schedule.time
    };
    
    const emailContent = matchReminderTemplate({
      playerName,
      matchDetails,
      tournamentName
    });
    
    return await sendEmail({
      to: playerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  } catch (error) {
    console.error('Error sending match reminder email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send match reminder email'
    };
  }
};

/**
 * Send custom email (for manual notifications)
 * @param {Array<string>} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} message - Email message content
 * @returns {Promise<Object>} - Result of email sending
 */
const sendCustomEmail = async (recipients, subject, message) => {
  try {
    const results = [];
    
    for (const recipient of recipients) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tournament Notification</h1>
            </div>
            <div class="content">
              ${message}
            </div>
            <div class="footer">
              <p>This message was sent by the tournament organiser via RallyPoint Tournament Management System.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const result = await sendEmail({
        to: recipient,
        subject: subject,
        html: html,
        text: message
      });
      
      results.push({
        recipient,
        ...result
      });
    }
    
    const allSuccessful = results.every(r => r.success);
    
    return {
      success: allSuccessful,
      results,
      message: allSuccessful ? 'All emails sent successfully' : 'Some emails failed to send'
    };
  } catch (error) {
    console.error('Error sending custom emails:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send custom emails'
    };
  }
};

module.exports = {
  sendEmail,
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
  sendMatchReminderEmail,
  sendCustomEmail
};
