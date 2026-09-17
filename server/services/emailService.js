const nodemailer = require("nodemailer");

// =====================================================
// NODEMAILER TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =====================================================
// SEND ORDER CONFIRMATION EMAIL
// =====================================================

const sendOrderConfirmationEmail = async (order) => {
  try {
    if (!order.studentEmail) {
      console.log("No student email found for order:", order.orderId);
      return;
    }

    const itemsHTML = order.items
      .map(
        (item) => `
          <tr>
            <td style="
              padding: 12px;
              border-bottom: 1px solid #eee;
            ">
              ${item.name}
            </td>

            <td style="
              padding: 12px;
              border-bottom: 1px solid #eee;
              text-align: center;
            ">
              ${item.quantity}
            </td>

            <td style="
              padding: 12px;
              border-bottom: 1px solid #eee;
              text-align: right;
            ">
              ₹${item.subtotal}
            </td>
          </tr>
        `
      )
      .join("");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: order.studentEmail,

      subject: `Smart Canteen - Order Confirmed (${order.orderId})`,

      html: `
        <!DOCTYPE html>

        <html>
        <head>
          <meta charset="UTF-8">
          <title>Smart Canteen Order Confirmation</title>
        </head>

        <body style="
          margin: 0;
          padding: 0;
          background-color: #f4f6f8;
          font-family: Arial, Helvetica, sans-serif;
        ">

          <div style="
            max-width: 650px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          ">

            <!-- HEADER -->

            <div style="
              background: #111827;
              color: white;
              padding: 25px;
              text-align: center;
            ">

              <h1 style="
                margin: 0;
                font-size: 28px;
              ">
                Smart Canteen
              </h1>

              <p style="
                margin: 8px 0 0;
                font-size: 14px;
                color: #d1d5db;
              ">
                Smart Canteen Management System
              </p>

            </div>


            <!-- CONTENT -->

            <div style="padding: 30px;">

              <h2 style="
                margin-top: 0;
                color: #111827;
              ">
                Order Placed Successfully 🎉
              </h2>

              <p style="
                color: #374151;
                font-size: 15px;
              ">
                Hello <strong>${order.studentName}</strong>,
              </p>

              <p style="
                color: #4b5563;
                line-height: 1.6;
              ">
                Your food order has been successfully placed.
                Please keep your token number with you for
                order collection.
              </p>


              <!-- ORDER INFORMATION -->

              <div style="
                background: #f9fafb;
                border-radius: 10px;
                padding: 20px;
                margin: 25px 0;
              ">

                <p style="margin: 8px 0;">
                  <strong>Order ID:</strong>
                  ${order.orderId}
                </p>

                <p style="margin: 8px 0;">
                  <strong>Token Number:</strong>
                  <span style="
                    font-size: 20px;
                    font-weight: bold;
                  ">
                    #${order.tokenNumber}
                  </span>
                </p>

                <p style="margin: 8px 0;">
                  <strong>Status:</strong>
                  ${order.status}
                </p>

                <p style="margin: 8px 0;">
                  <strong>Order Time:</strong>
                  ${new Date(order.createdAt).toLocaleString("en-IN")}
                </p>

              </div>


              <!-- ITEMS -->

              <h3 style="
                color: #111827;
                margin-bottom: 10px;
              ">
                Order Details
              </h3>

              <table style="
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              ">

                <thead>

                  <tr style="
                    background: #f3f4f6;
                  ">

                    <th style="
                      padding: 12px;
                      text-align: left;
                    ">
                      Item
                    </th>

                    <th style="
                      padding: 12px;
                      text-align: center;
                    ">
                      Qty
                    </th>

                    <th style="
                      padding: 12px;
                      text-align: right;
                    ">
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  ${itemsHTML}

                </tbody>

              </table>


              <!-- TOTAL -->

              <div style="
                margin-top: 20px;
                padding: 18px;
                background: #f9fafb;
                border-radius: 8px;
                text-align: right;
              ">

                <span style="
                  font-size: 16px;
                  color: #374151;
                ">
                  Total Amount:
                </span>

                <strong style="
                  font-size: 22px;
                  margin-left: 10px;
                ">
                  ₹${order.totalAmount}
                </strong>

              </div>


              <!-- TOKEN MESSAGE -->

              <div style="
                margin-top: 25px;
                padding: 18px;
                background: #f3f4f6;
                border-radius: 8px;
                text-align: center;
              ">

                <p style="
                  margin: 0;
                  color: #374151;
                ">
                  Your Token Number
                </p>

                <div style="
                  font-size: 36px;
                  font-weight: bold;
                  margin-top: 8px;
                  color: #111827;
                ">
                  #${order.tokenNumber}
                </div>

                <p style="
                  margin-bottom: 0;
                  color: #6b7280;
                  font-size: 13px;
                ">
                  Please show this token when collecting
                  your order.
                </p>

              </div>


              <p style="
                margin-top: 30px;
                color: #6b7280;
                font-size: 13px;
                line-height: 1.5;
              ">
                You will receive another email when the
                status of your order changes.
              </p>

            </div>


            <!-- FOOTER -->

            <div style="
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #eee;
            ">

              <p style="
                margin: 0;
                font-size: 12px;
                color: #6b7280;
              ">
                This is an automated email from
                Smart Canteen Management System.
              </p>

              <p style="
                margin: 8px 0 0;
                font-size: 12px;
                color: #9ca3af;
              ">
                Please do not reply to this email.
              </p>

            </div>

          </div>

        </body>
        </html>
      `,
    });

    console.log(
      `Order confirmation email sent successfully to: ${order.studentEmail}`
    );

  } catch (error) {
    console.error(
      "Order confirmation email error:",
      error.message
    );
  }
};


// =====================================================
// SEND ORDER STATUS EMAIL
// =====================================================

const sendOrderStatusEmail = async (
  order,
  previousStatus
) => {
  try {
    if (!order.studentEmail) {
      console.log(
        "No student email found for order:",
        order.orderId
      );

      return;
    }

    const statusMessages = {
      Preparing:
        "Your order is now being prepared by the canteen staff.",

      Ready:
        "Your order is ready for pickup. Please collect it using your token number.",

      Completed:
        "Your order has been completed successfully. Thank you for using Smart Canteen.",

      Cancelled:
        "Your order has been cancelled.",
      
      Pending:
        "Your order is currently waiting to be prepared.",
    };

    const statusMessage =
      statusMessages[order.status] ||
      `Your order status has changed to ${order.status}.`;

    const isCancelled =
      order.status === "Cancelled";

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      to: order.studentEmail,

      subject:
        `Smart Canteen - Order ${order.status} (${order.orderId})`,

      html: `
        <!DOCTYPE html>

        <html>

        <head>
          <meta charset="UTF-8">
          <title>Smart Canteen Order Update</title>
        </head>

        <body style="
          margin: 0;
          padding: 0;
          background-color: #f4f6f8;
          font-family: Arial, Helvetica, sans-serif;
        ">

          <div style="
            max-width: 600px;
            margin: 30px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          ">

            <!-- HEADER -->

            <div style="
              background: #111827;
              color: white;
              text-align: center;
              padding: 25px;
            ">

              <h1 style="margin: 0;">
                Smart Canteen
              </h1>

              <p style="
                margin-bottom: 0;
                color: #d1d5db;
              ">
                Order Status Update
              </p>

            </div>


            <!-- CONTENT -->

            <div style="padding: 30px;">

              <p style="
                color: #374151;
                font-size: 15px;
              ">
                Hello <strong>${order.studentName}</strong>,
              </p>

              <p style="
                color: #4b5563;
                line-height: 1.6;
              ">
                ${statusMessage}
              </p>


              <!-- STATUS -->

              <div style="
                text-align: center;
                margin: 25px 0;
                padding: 25px;
                background: #f9fafb;
                border-radius: 10px;
              ">

                <p style="
                  margin: 0;
                  color: #6b7280;
                ">
                  Current Order Status
                </p>

                <h2 style="
                  margin: 10px 0;
                ">
                  ${order.status}
                </h2>

              </div>


              <!-- ORDER INFO -->

              <div style="
                background: #f9fafb;
                padding: 20px;
                border-radius: 10px;
              ">

                <p style="margin: 8px 0;">
                  <strong>Order ID:</strong>
                  ${order.orderId}
                </p>

                <p style="margin: 8px 0;">
                  <strong>Token Number:</strong>
                  #${order.tokenNumber}
                </p>

                <p style="margin: 8px 0;">
                  <strong>Previous Status:</strong>
                  ${previousStatus}
                </p>

                <p style="margin: 8px 0;">
                  <strong>Current Status:</strong>
                  ${order.status}
                </p>

                <p style="margin: 8px 0;">
                  <strong>Total Amount:</strong>
                  ₹${order.totalAmount}
                </p>

              </div>


              ${
                order.status === "Ready"
                  ? `
                    <div style="
                      margin-top: 25px;
                      padding: 20px;
                      text-align: center;
                      background: #f3f4f6;
                      border-radius: 10px;
                    ">

                      <p style="
                        margin: 0;
                        font-size: 14px;
                        color: #374151;
                      ">
                        Your Token Number
                      </p>

                      <div style="
                        font-size: 36px;
                        font-weight: bold;
                        margin-top: 8px;
                      ">
                        #${order.tokenNumber}
                      </div>

                      <p style="
                        margin-bottom: 0;
                        font-size: 13px;
                        color: #6b7280;
                      ">
                        Please collect your order from
                        the canteen.
                      </p>

                    </div>
                  `
                  : ""
              }


              ${
                isCancelled
                  ? `
                    <div style="
                      margin-top: 25px;
                      padding: 15px;
                      background: #f9fafb;
                      border-radius: 8px;
                      text-align: center;
                    ">
                      <strong>
                        This order has been cancelled.
                      </strong>
                    </div>
                  `
                  : ""
              }


              <p style="
                margin-top: 30px;
                font-size: 13px;
                color: #6b7280;
              ">
                Smart Canteen Management System
              </p>

            </div>


            <!-- FOOTER -->

            <div style="
              background: #f9fafb;
              padding: 20px;
              text-align: center;
            ">

              <p style="
                margin: 0;
                font-size: 12px;
                color: #777;
              ">
                This is an automated email.
                Please do not reply.
              </p>

            </div>

          </div>

        </body>

        </html>
      `,
    });

    console.log(
      `Order status email sent successfully to: ${order.studentEmail}`
    );

  } catch (error) {
    console.error(
      "Order status email error:",
      error.message
    );
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};