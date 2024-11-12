const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>U Robot Tour Guide Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with gradient -->
        <div style="background: linear-gradient(to right, #3b82f6, #4f46e5); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">U Robot Tour Guide</h1>
            <p style="margin: 10px 0 0 0;">Booking Confirmation</p>
        </div>
        <!-- Main Content -->
        <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Dear {{Name}},</p>
           
            <p>Thank you for booking a U Robot Tour Guide. Your booking has been confirmed with the following details:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Booking Details:</strong></p>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 10px;">Tour Type: {{TourType}}</li>
                    <li style="margin-bottom: 10px;">Name: {{Name}}</li>
                    <li style="margin-bottom: 10px;">Starting Point: {{From}}</li>
                    <li style="margin-bottom: 10px;">Destination: {{To}}</li>
                    <li style="margin-bottom: 10px;">Departure Time: {{Time}}</li>
                    <li style="margin-bottom: 10px;">Email: {{Email}}</li>
                </ul>
            </div>
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1a237e;">Important Information</h3>
                <ul>
                    <li>Please arrive 5 minutes before your scheduled departure time</li>
                    <li>Your robot guide will be waiting at the starting location</li>
                    <li>The tour duration will vary based on your selected route</li>
                    <li>In case of any changes, please contact us at support@urobot.com</li>
                </ul>
            </div>
            <p style="margin-top: 30px;">We hope you enjoy your tour with U Robot!</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
                <p>If you have any questions or need to modify your booking, please don't hesitate to contact us.</p>
            </div>
        </div>
        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>© 2024 U Robot. All rights reserved.</p>
            <p>9th Block, UPES, Uttarakhand 248006</p>
        </div>
    </div>
</body>
</html>`;

module.exports = {
  htmlTemplate,
};