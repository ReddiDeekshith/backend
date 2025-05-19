const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use your email service provider
  auth: {
    user: 'deekshithreddi71@gmail.com',
    pass: 'enum cwpp qllp sngk', // use app password for Gmail
  },
});
const sendMail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: 'deekshithreddi71@gmail.com',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
//ordermail
function createOrderEmail(orderData, orderId, totalPrice) {
  const subject = `Order Confirmation - Your Order #${orderId} has been placed!`;

  let orderItemsHTML = '';
  orderData.orders.forEach((item, index) => {
    orderItemsHTML += `
      <div style="margin-bottom: 15px;">
        <strong>Item ${index + 1}</strong><br/>
        <img src="${item.image}" alt="Product Image" style="width: 100px; height: auto;"/><br/>
        Quantity: ${item.quantity}<br/>
        Price: ₹${item.price}
        <hr/>
      </div>
    `;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Hi ${orderData.Name},</h2>
      <p>Thank you for your order!</p>
      <p>We've received your order <strong>#${orderId}</strong> placed on <strong>${orderData.OrderDate}</strong>, and it's currently being processed.</p>

      <h3>📦 Order Summary:</h3>
      ${orderItemsHTML}

      <p><strong>Total Price:</strong> ₹${totalPrice.toFixed(2)}</p>
      <p><strong>Payment Mode:</strong> ${orderData.PaymentMode}</p>

      <h3>📍 Shipping Address:</h3>
      <p>
        ${orderData.Address},<br/>
        ${orderData.City} - ${orderData.PinCode}<br/>
        Phone: ${orderData.PhoneNumber}
      </p>

      <p>We will notify you once your items are shipped.</p>
      <p>Thank you for shopping with us!</p>

      <p style="margin-top: 30px;">Best regards,<br/><strong>Udayateja</strong></p>
    </div>
  `;
  return { subject, html };
}
function createDeliveryEmail(orderData, orderId,totalPrice) {
  const subject = `Order Delivered - Your Order #${orderId} has been successfully delivered!`;

  let orderItemsHTML = '';
  orderData.orders.forEach((item, index) => {
    orderItemsHTML += `
      <div style="margin-bottom: 15px;">
        <strong>Item ${index + 1}</strong><br/>
        <img src="${item.image}" alt="Product Image" style="width: 100px; height: auto;"/><br/>
        Quantity: ${item.quantity}<br/>
        Price: ₹${item.price}
        <hr/>
      </div>
    `;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Hi ${orderData.Name},</h2>
      <p>Your order <strong>#${orderId}</strong> has been <strong>successfully delivered</strong> on <strong>${new Date().toLocaleDateString()}</strong>.</p>

      <h3>📦 Delivered Items:</h3>
      ${orderItemsHTML}

      <p><strong>Total Price:</strong> ₹${totalPrice.toFixed(2)}</p>
      <p><strong>Payment Mode:</strong> ${orderData.PaymentMode}</p>

      <h3>📍 Delivery Address:</h3>
      <p>
        ${orderData.Address},<br/>
        ${orderData.City} - ${orderData.PinCode}<br/>
        Phone: ${orderData.PhoneNumber}
      </p>

      <p>We hope you enjoyed shopping with us. We look forward to seeing you again!</p>

      <p style="margin-top: 30px;">Best regards,<br/><strong>Udayateja</strong></p>
    </div>
  `;

  return { subject, html };
}

module.exports = { sendMail, createOrderEmail, createDeliveryEmail };
