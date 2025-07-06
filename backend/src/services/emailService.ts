import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string,
  product?: any
) => {
  try {
    // Skip if email credentials are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, skipping email notification');
      return;
    }

    const transporter = createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e1e5e9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
              font-size: 28px;
            }
            .product-info {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #2563eb;
            }
            .product-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 10px;
            }
            .price-info {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
              margin: 10px 0;
            }
            .message {
              background: #ecfdf5;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #10b981;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e1e5e9;
              color: #6b7280;
              font-size: 14px;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Price Tracker Alert</h1>
            </div>
            
            <div class="message">
              <p><strong>${message}</strong></p>
            </div>
            
            ${product ? `
              <div class="product-info">
                <div class="product-title">${product.title}</div>
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Product Image" style="max-width: 100%; height: auto; border-radius: 6px; margin: 10px 0;">` : ''}
                <div class="price-info">Current Price: $${product.currentPrice}</div>
                ${product.targetPrice ? `<p><strong>Your Target Price:</strong> $${product.targetPrice}</p>` : ''}
                <a href="${product.url}" class="btn" target="_blank">View Product</a>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>This is an automated notification from your Price Tracker app.</p>
              <p>You can manage your tracked products and notifications in the app.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Price Tracker" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email notification sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

export const sendWelcomeEmail = async (email: string, firstName?: string) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return;
    }

    const subject = 'Welcome to Price Tracker!';
    const message = `Welcome ${firstName || 'there'}! Start tracking your favorite Amazon products and get notified when prices drop.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e1e5e9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
              font-size: 28px;
            }
            .welcome-message {
              background: #ecfdf5;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .features {
              margin: 30px 0;
            }
            .feature {
              padding: 15px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .feature:last-child {
              border-bottom: none;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e1e5e9;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Price Tracker!</h1>
            </div>
            
            <div class="welcome-message">
              <h2>Hello ${firstName || 'there'}!</h2>
              <p>${message}</p>
            </div>
            
            <div class="features">
              <h3>What you can do:</h3>
              <div class="feature">
                <strong>📋 Track Products:</strong> Add any Amazon product URL to start tracking
              </div>
              <div class="feature">
                <strong>🎯 Set Target Prices:</strong> Get notified when products reach your desired price
              </div>
              <div class="feature">
                <strong>📊 Price History:</strong> View detailed price history and trends
              </div>
              <div class="feature">
                <strong>🔔 Smart Notifications:</strong> Get alerts for price drops and target prices reached
              </div>
            </div>
            
            <div class="footer">
              <p>Happy saving!</p>
              <p>The Price Tracker Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const transporter = createTransporter();
    const mailOptions = {
      from: `"Price Tracker" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};
