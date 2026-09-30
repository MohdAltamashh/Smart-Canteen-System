const { google } = require("googleapis");

// =====================================================
// GMAIL API CONFIGURATION
// =====================================================

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});


// =====================================================
// HTML ESCAPE HELPER
// =====================================================

const escapeHtml = (value) => {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]
  );
};


// =====================================================
// SEND EMAIL USING GMAIL API
// =====================================================

const sendGmailEmail = async ({
  to,
  subject,
  html,
}) => {

  // ===================================================
  // CHECK ENVIRONMENT VARIABLES
  // ===================================================

  if (
    !process.env.GMAIL_CLIENT_ID ||
    !process.env.GMAIL_CLIENT_SECRET ||
    !process.env.GMAIL_REFRESH_TOKEN ||
    !process.env.EMAIL_USER
  ) {
    throw new Error(
      "Gmail API environment variables are missing"
    );
  }


  // ===================================================
  // BUILD EMAIL
  // ===================================================

  const messageParts = [
    `From: "Campus Bite" <${process.env.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf-8").toString("base64"),
  ];


  const rawMessage =
    messageParts.join("\r\n");


  // ===================================================
  // GMAIL BASE64URL ENCODING
  // ===================================================

  const encodedMessage =
    Buffer
      .from(rawMessage, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");


  // ===================================================
  // SEND THROUGH GMAIL HTTPS API
  // ===================================================

  const response =
    await gmail.users.messages.send({
      userId: "me",

      requestBody: {
        raw: encodedMessage,
      },
    });


  console.log(
    "Gmail email sent successfully:",
    response.data.id
  );


  return response.data;
};


// =====================================================
// SEND ORDER CONFIRMATION EMAIL
// =====================================================

const sendOrderConfirmationEmail = async (order) => {

  try {

    // ===================================================
    // CHECK ORDER
    // ===================================================

    if (!order) {
      throw new Error(
        "Order data is missing"
      );
    }


    if (!order.studentEmail) {

      console.log(
        "No student email found for order:",
        order.orderId
      );

      return;
    }


    // ===================================================
    // SAFE ORDER DATA
    // ===================================================

    const studentName =
      escapeHtml(
        order.studentName || "Student"
      );

    const studentEmail =
      String(order.studentEmail)
        .trim()
        .toLowerCase();

    const orderId =
      escapeHtml(
        order.orderId || "N/A"
      );

    const tokenNumber =
      escapeHtml(
        order.tokenNumber || "N/A"
      );

    const status =
      escapeHtml(
        order.status || "Pending"
      );

    const totalAmount =
      Number(order.totalAmount || 0);


    // ===================================================
    // ORDER ITEMS
    // ===================================================

    const items =
      Array.isArray(order.items)
        ? order.items
        : [];


    let itemsHTML = "";


    if (items.length > 0) {

      itemsHTML = items
        .map((item) => {

          const itemName =
            escapeHtml(
              item.name || "Food Item"
            );

          const quantity =
            Number(item.quantity || 0);

          const price =
            Number(item.price || 0);

          const subtotal =
            Number(
              item.subtotal ??
              price * quantity
            );


          return `
            <tr>

              <td
                style="
                  padding:12px;
                  border-bottom:1px solid #eeeeee;
                  font-size:14px;
                "
              >
                ${itemName}
              </td>


              <td
                style="
                  padding:12px;
                  border-bottom:1px solid #eeeeee;
                  text-align:center;
                  font-size:14px;
                "
              >
                ${quantity}
              </td>


              <td
                style="
                  padding:12px;
                  border-bottom:1px solid #eeeeee;
                  text-align:right;
                  font-size:14px;
                "
              >
                ₹${price}
              </td>


              <td
                style="
                  padding:12px;
                  border-bottom:1px solid #eeeeee;
                  text-align:right;
                  font-weight:bold;
                  font-size:14px;
                "
              >
                ₹${subtotal}
              </td>

            </tr>
          `;

        })
        .join("");

    } else {

      itemsHTML = `
        <tr>

          <td
            colspan="4"
            style="
              padding:15px;
              text-align:center;
              color:#777777;
            "
          >
            Order item details unavailable
          </td>

        </tr>
      `;
    }


    // ===================================================
    // ORDER TIME
    // ===================================================

    const orderTime =
      order.createdAt
        ? new Date(order.createdAt)
            .toLocaleString("en-IN")
        : new Date()
            .toLocaleString("en-IN");


    // ===================================================
    // EMAIL SUBJECT
    // ===================================================

    const subject =
      `Campus Bite - Order Confirmed (${orderId})`;


    // ===================================================
    // EMAIL HTML
    // ===================================================

    const html = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Campus Bite Order Confirmation
  </title>

</head>


<body
  style="
    margin:0;
    padding:0;
    background-color:#f4f7fb;
    font-family:Arial,Helvetica,sans-serif;
    color:#222222;
  "
>


  <!-- MAIN CONTAINER -->

  <div
    style="
      max-width:650px;
      margin:30px auto;
      background:#ffffff;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,0.08);
    "
  >


    <!-- HEADER -->

    <div
      style="
        background:linear-gradient(
          135deg,
          #073b7a,
          #0d6efd
        );
        color:#ffffff;
        padding:28px 20px;
        text-align:center;
      "
    >

      <h1
        style="
          margin:0;
          font-size:30px;
        "
      >
        Campus
        <span style="color:#ffc107;">
          Bite
        </span>
      </h1>


      <p
        style="
          margin:8px 0 0;
          font-size:13px;
          letter-spacing:1px;
        "
      >
        SMART PRE-ORDER • EASY PICKUP
      </p>

    </div>


    <!-- CONTENT -->

    <div
      style="
        padding:30px 25px;
      "
    >


      <!-- SUCCESS TITLE -->

      <h2
        style="
          margin-top:0;
          color:#073b7a;
        "
      >
        🎉 Order Placed Successfully!
      </h2>


      <p
        style="
          color:#374151;
          font-size:15px;
          line-height:1.6;
        "
      >
        Hello
        <strong>
          ${studentName}
        </strong>,
      </p>


      <p
        style="
          color:#4b5563;
          line-height:1.6;
          font-size:15px;
        "
      >
        Your food order has been successfully
        placed through
        <strong>Campus Bite</strong>.
        Please keep your token number with you
        for order collection.
      </p>


      <!-- ORDER INFORMATION -->

      <div
        style="
          background:#f7faff;
          border:1px solid #dbe8ff;
          border-radius:12px;
          padding:20px;
          margin:25px 0;
        "
      >

        <h3
          style="
            margin-top:0;
            color:#073b7a;
          "
        >
          Order Information
        </h3>


        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
        >

          <tr>

            <td
              style="
                padding:8px 0;
                color:#777777;
              "
            >
              <strong>
                Order ID
              </strong>
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
                font-weight:bold;
              "
            >
              ${orderId}
            </td>

          </tr>


          <tr>

            <td
              style="
                padding:8px 0;
                color:#777777;
              "
            >
              <strong>
                Token Number
              </strong>
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
                font-size:24px;
                font-weight:bold;
                color:#0d6efd;
              "
            >
              #${tokenNumber}
            </td>

          </tr>


          <tr>

            <td
              style="
                padding:8px 0;
                color:#777777;
              "
            >
              <strong>
                Payment
              </strong>
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
                color:#198754;
                font-weight:bold;
              "
            >
              Paid
            </td>

          </tr>


          <tr>

            <td
              style="
                padding:8px 0;
                color:#777777;
              "
            >
              <strong>
                Status
              </strong>
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
                font-weight:bold;
                color:#d39e00;
              "
            >
              ${status}
            </td>

          </tr>


          <tr>

            <td
              style="
                padding:8px 0;
                color:#777777;
              "
            >
              <strong>
                Order Time
              </strong>
            </td>

            <td
              style="
                padding:8px 0;
                text-align:right;
                font-size:13px;
              "
            >
              ${orderTime}
            </td>

          </tr>

        </table>

      </div>


      <!-- ORDER DETAILS -->

      <h3
        style="
          color:#073b7a;
          margin-bottom:12px;
        "
      >
        Order Details
      </h3>


      <div
        style="
          border:1px solid #e5e7eb;
          border-radius:10px;
          overflow:hidden;
        "
      >

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border-collapse:collapse;
          "
        >

          <thead>

            <tr
              style="
                background:#f3f4f6;
              "
            >

              <th
                style="
                  padding:12px;
                  text-align:left;
                  font-size:13px;
                "
              >
                Item
              </th>


              <th
                style="
                  padding:12px;
                  text-align:center;
                  font-size:13px;
                "
              >
                Qty
              </th>


              <th
                style="
                  padding:12px;
                  text-align:right;
                  font-size:13px;
                "
              >
                Price
              </th>


              <th
                style="
                  padding:12px;
                  text-align:right;
                  font-size:13px;
                "
              >
                Amount
              </th>

            </tr>

          </thead>


          <tbody>

            ${itemsHTML}

          </tbody>

        </table>

      </div>


      <!-- TOTAL -->

      <div
        style="
          margin-top:20px;
          padding:18px;
          background:#f0fff6;
          border:1px solid #c8efd8;
          border-radius:10px;
          text-align:right;
        "
      >

        <span
          style="
            font-size:16px;
            color:#374151;
          "
        >
          Total Amount:
        </span>


        <strong
          style="
            font-size:24px;
            margin-left:10px;
            color:#198754;
          "
        >
          ₹${totalAmount}
        </strong>

      </div>


      <!-- TOKEN INFORMATION -->

      <div
        style="
          margin-top:25px;
          padding:20px;
          background:#fff8e1;
          border:1px solid #ffe082;
          border-radius:10px;
          text-align:center;
        "
      >

        <p
          style="
            margin:0;
            color:#374151;
          "
        >
          Your Token Number
        </p>


        <div
          style="
            font-size:40px;
            font-weight:bold;
            margin-top:8px;
            color:#0d6efd;
          "
        >
          #${tokenNumber}
        </div>


        <p
          style="
            margin-bottom:0;
            color:#6b7280;
            font-size:13px;
          "
        >
          Please show this token when
          collecting your order.
        </p>

      </div>


      <!-- FOOT NOTE -->

      <p
        style="
          margin-top:30px;
          color:#6b7280;
          font-size:13px;
          line-height:1.5;
        "
      >
        You will receive another email when
        the status of your order changes.
      </p>


    </div>


    <!-- FOOTER -->

    <div
      style="
        background:#f5f7fa;
        padding:20px;
        text-align:center;
        border-top:1px solid #eeeeee;
      "
    >

      <p
        style="
          margin:0;
          font-size:12px;
          color:#6b7280;
        "
      >
        Campus Bite
      </p>


      <p
        style="
          margin:7px 0 0;
          font-size:12px;
          color:#9ca3af;
        "
      >
        Digital Food Ordering & Service Platform
      </p>


      <p
        style="
          margin:7px 0 0;
          font-size:11px;
          color:#aaaaaa;
        "
      >
        This is an automated email.
        Please do not reply.
      </p>

    </div>


  </div>


</body>

</html>
`;


    // ===================================================
    // SEND EMAIL
    // ===================================================

    await sendGmailEmail({
      to: studentEmail,
      subject: subject,
      html: html,
    });


    console.log(
      `Order confirmation email sent successfully to: ${studentEmail}`
    );


  } catch (error) {

    console.error(
      "Order confirmation email error:",
      error.response?.data ||
      error.message ||
      error
    );

    // Error ko throw kar rahe hain taaki
    // paymentController ke catch block ko
    // proper error mil sake.
    throw error;
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

    // ===================================================
    // CHECK ORDER
    // ===================================================

    if (!order) {
      throw new Error(
        "Order data is missing"
      );
    }


    if (!order.studentEmail) {

      console.log(
        "No student email found for order:",
        order.orderId
      );

      return;
    }


    // ===================================================
    // SAFE DATA
    // ===================================================

    const studentName =
      escapeHtml(
        order.studentName || "Student"
      );

    const studentEmail =
      String(order.studentEmail)
        .trim()
        .toLowerCase();

    const orderId =
      escapeHtml(
        order.orderId || "N/A"
      );

    const tokenNumber =
      escapeHtml(
        order.tokenNumber || "N/A"
      );

    const currentStatus =
      escapeHtml(
        order.status || "Pending"
      );

    const oldStatus =
      escapeHtml(
        previousStatus || "N/A"
      );

    const totalAmount =
      Number(order.totalAmount || 0);


    // ===================================================
    // STATUS MESSAGE
    // ===================================================

    const statusMessages = {

      Pending:
        "Your order is currently waiting to be prepared.",

      Preparing:
        "Your order is now being prepared by the canteen staff.",

      Ready:
        "Your order is ready for pickup. Please collect it using your token number.",

      Completed:
        "Your order has been completed successfully. Thank you for using Campus Bite.",

      Cancelled:
        "Your order has been cancelled.",

    };


    const statusMessage =
      statusMessages[order.status] ||
      `Your order status has changed to ${currentStatus}.`;


    const isReady =
      order.status === "Ready";


    const isCancelled =
      order.status === "Cancelled";


    // ===================================================
    // SUBJECT
    // ===================================================

    const subject =
      `Campus Bite - Order ${currentStatus} (${orderId})`;


    // ===================================================
    // STATUS EMAIL HTML
    // ===================================================

    const html = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Campus Bite Order Update
  </title>

</head>


<body
  style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial,Helvetica,sans-serif;
    color:#222222;
  "
>


  <div
    style="
      max-width:600px;
      margin:30px auto;
      background:#ffffff;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,0.08);
    "
  >


    <!-- HEADER -->

    <div
      style="
        background:linear-gradient(
          135deg,
          #073b7a,
          #0d6efd
        );
        color:#ffffff;
        text-align:center;
        padding:28px 20px;
      "
    >

      <h1
        style="
          margin:0;
          font-size:30px;
        "
      >
        Campus
        <span style="color:#ffc107;">
          Bite
        </span>
      </h1>


      <p
        style="
          margin:8px 0 0;
          color:#eaf2ff;
          font-size:14px;
        "
      >
        Order Status Update
      </p>

    </div>


    <!-- CONTENT -->

    <div
      style="
        padding:30px 25px;
      "
    >

      <p
        style="
          color:#374151;
          font-size:15px;
        "
      >
        Hello
        <strong>
          ${studentName}
        </strong>,
      </p>


      <p
        style="
          color:#4b5563;
          line-height:1.6;
          font-size:15px;
        "
      >
        ${statusMessage}
      </p>


      <!-- STATUS -->

      <div
        style="
          text-align:center;
          margin:25px 0;
          padding:25px;
          background:#f7faff;
          border:1px solid #dbe8ff;
          border-radius:12px;
        "
      >

        <p
          style="
            margin:0;
            color:#6b7280;
          "
        >
          Current Order Status
        </p>


        <h2
          style="
            margin:10px 0 0;
            color:#0d6efd;
          "
        >
          ${currentStatus}
        </h2>

      </div>


      <!-- ORDER INFORMATION -->

      <div
        style="
          background:#f9fafb;
          padding:20px;
          border-radius:10px;
        "
      >

        <p style="margin:8px 0;">

          <strong>
            Order ID:
          </strong>

          ${orderId}

        </p>


        <p style="margin:8px 0;">

          <strong>
            Token Number:
          </strong>

          #${tokenNumber}

        </p>


        <p style="margin:8px 0;">

          <strong>
            Previous Status:
          </strong>

          ${oldStatus}

        </p>


        <p style="margin:8px 0;">

          <strong>
            Current Status:
          </strong>

          ${currentStatus}

        </p>


        <p style="margin:8px 0;">

          <strong>
            Total Amount:
          </strong>

          ₹${totalAmount}

        </p>

      </div>


      <!-- READY MESSAGE -->

      ${
        isReady
          ? `
            <div
              style="
                margin-top:25px;
                padding:20px;
                text-align:center;
                background:#f0fff6;
                border:1px solid #c8efd8;
                border-radius:10px;
              "
            >

              <p
                style="
                  margin:0;
                  font-size:14px;
                  color:#374151;
                "
              >
                Your Token Number
              </p>


              <div
                style="
                  font-size:40px;
                  font-weight:bold;
                  margin-top:8px;
                  color:#198754;
                "
              >
                #${tokenNumber}
              </div>


              <p
                style="
                  margin-bottom:0;
                  font-size:13px;
                  color:#6b7280;
                "
              >
                Please collect your order
                from the canteen.
              </p>

            </div>
          `
          : ""
      }


      <!-- CANCELLED MESSAGE -->

      ${
        isCancelled
          ? `
            <div
              style="
                margin-top:25px;
                padding:18px;
                background:#fff1f1;
                border:1px solid #f5c2c7;
                border-radius:10px;
                text-align:center;
              "
            >

              <strong>
                This order has been cancelled.
              </strong>

            </div>
          `
          : ""
      }


      <!-- FOOTER MESSAGE -->

      <p
        style="
          margin-top:30px;
          font-size:13px;
          color:#6b7280;
          line-height:1.5;
        "
      >
        Thank you for using
        <strong>Campus Bite</strong>.
      </p>


    </div>


    <!-- FOOTER -->

    <div
      style="
        background:#f5f7fa;
        padding:20px;
        text-align:center;
        border-top:1px solid #eeeeee;
      "
    >

      <p
        style="
          margin:0;
          font-size:12px;
          color:#777777;
        "
      >
        Campus Bite -
        Digital Food Ordering & Service Platform
      </p>


      <p
        style="
          margin:8px 0 0;
          font-size:11px;
          color:#aaaaaa;
        "
      >
        This is an automated email.
        Please do not reply.
      </p>

    </div>


  </div>


</body>

</html>
`;


    // ===================================================
    // SEND STATUS EMAIL
    // ===================================================

    await sendGmailEmail({
      to: studentEmail,
      subject: subject,
      html: html,
    });


    console.log(
      `Order status email sent successfully to: ${studentEmail}`
    );


  } catch (error) {

    console.error(
      "Order status email error:",
      error.response?.data ||
      error.message ||
      error
    );

    throw error;
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};