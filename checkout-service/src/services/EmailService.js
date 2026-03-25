const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure transporter (using Gmail as example)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-password'
      }
    });
  }

  async sendOrderConfirmation(order, customerEmail) {
    const mailOptions = {
      from: `"ShopHub" <${process.env.SMTP_USER || 'noreply@shophub.com'}>`,
      to: customerEmail,
      subject: `Order Confirmation - ${order.orderId.substring(0, 8).toUpperCase()}`,
      html: this.generateOrderEmailHTML(order)
    };

    try {
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('=== ORDER CONFIRMATION EMAIL ===');
        console.log('To:', customerEmail);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML:', mailOptions.html);
        console.log('==============================');
        return { success: true, message: 'Email logged (development mode)' };
      }

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  generateOrderEmailHTML(order) {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.subtotal.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
          .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .summary-row.total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #4f46e5; border-bottom: none; padding-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 ShopHub</h1>
            <p>Order Confirmation</p>
          </div>
          
          <div class="content">
            <p>Dear Customer,</p>
            <p>Thank you for your order! Your order has been confirmed and will be shipped soon.</p>
            
            <div class="order-details">
              <h2>Order Details</h2>
              <p><strong>Order ID:</strong> ${order.orderId.substring(0, 8).toUpperCase()}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Payment:</strong> <span class="badge">${order.paymentStatus.toUpperCase()}</span></p>
              
              <h3>Items Ordered</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>
            
            <div class="summary">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${order.pricing.subtotal.toLocaleString('en-IN')}</span>
              </div>
              ${order.pricing.discount > 0 ? `
              <div class="summary-row">
                <span>Discount (${order.pricing.discountCode})</span>
                <span>-₹${order.pricing.discount.toLocaleString('en-IN')}</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span>Tax (18% GST)</span>
                <span>₹${order.pricing.tax.toLocaleString('en-IN')}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span>${order.pricing.shippingCost === 0 ? 'FREE' : '₹' + order.pricing.shippingCost.toLocaleString('en-IN')}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>₹${order.pricing.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div class="order-details">
              <h3>Shipping Address</h3>
              <p>
                ${order.shippingAddress.name}<br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}<br>
                ${order.shippingAddress.phone}
              </p>
            </div>
            
            <p>We'll send you another email when your order ships!</p>
            <p>Happy Shopping! 🎉</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2026 ShopHub. All rights reserved.</p>
            <p>Need help? Contact us at support@shophub.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailService;
