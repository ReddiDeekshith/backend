const express = require('express');
const mongoose = require("mongoose");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const { google } = require("googleapis");
const { sendMail, createOrderEmail ,createDeliveryEmail} = require('./services/emailService');
const { sendNotification } = require('./services/notifications');
const Orders = require('./models/order');
const Product = require('./models/product');
const Delivered=require('./models/delivered');
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
//json files

//drive details
const SERVICE_ACCOUNT_FILE = "biometric.json";
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });
const folderId = "1ioDpFDOMUY6x3gBPM3loATwqebWItyL2";
const upload = multer({ dest: "uploads/" });
//imageuploader
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("File Received: ", req.file);
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filePath = req.file.path;
    const fileMetadata = {
      name: req.file.originalname,
      parents: [folderId],
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath),
    };
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id",
    });
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    const imageUrl = `https://drive.google.com/thumbnail?id=${response.data.id}&sz=w1000`;
    fs.unlinkSync(filePath);
    res.json({ message: "Uploaded successfully!", imageUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ url: imageUrl, message: "Upload failed", error: error.message });
  }
});
//mongodb
mongoose
  .connect("mongodb+srv://deekshithreddi71:deekshith15@biometric-cluster.5hnnx.mongodb.net/Ecommerce?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected to Ecommerce database"))
  .catch((err) => console.error("MongoDB Connection Error:", err));
let notifications = [];
//clear
app.get('/clear',async(req,res)=>{
  try {
    notifications = [];
    res.status(200).json("successfully clear");
  } catch (error) {
    res.status(500).json({ error: "Failed to clear" });
  }
})
//add-orders
app.post('/add-orders', async (req, res) => {
  try {
    const { Name, Email, PhoneNumber, Address, City, PinCode, orders, PaymentMode } = req.body;

    // Fetch prices of products and calculate total price
    let totalPrice = 0;
    for (const item of orders) {
      totalPrice += item.price * item.quantity;
    }
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    // Save order
    const neworder = new Orders({
      Name,
      Email,
      PhoneNumber,
      Address,
      City,
      PinCode,
      orders,
      PaymentMode,
      OrderDate:formattedDate
    });
    await neworder.save();

    // Send notification
    const title = Name;
    const message = `Ordered worth ₹${totalPrice.toFixed(2)}`;
    const topic = "all-users";
    const success = await sendNotification(topic, title, message);

    // Store notification if successful
    if (success) {
      console.log("success");
      const notification = {
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        topic: topic,
      };
      notifications.push(notification);
      if (notifications.length > 10) {
        notifications.shift();
      }
    }
    const orderId = neworder._id; // MongoDB generated ID
    const { subject, html } = createOrderEmail(neworder, orderId, totalPrice);

    await sendMail(Email,subject,html);
    res.status(201).json({ message: "Saved successfully!", order: neworder });
  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ error: "Failed to order product" });
  }
});

//getOrders
app.get('/orders', async (req, res) => {
  try {
    const orders = await Orders.find(); // Fetch all products
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

//add-product
app.post('/add-product', async (req, res) => {
  console.log("add");
  try {
    const { Image, Price, ProductDescription, ProductName, Size } = req.body;
    const newProduct = new Product({
      Image,
      Price,
      ProductDescription,
      ProductName,
      Size
    });
    await newProduct.save();
    res.status(201).json({ message: "Product added successfully!", product: newProduct });
  } catch (error) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

//products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
//first three
app.get('/products/first-three', async (req, res) => {
  try {
    const products = await Product.find();
    if (products.length > 3) {
      res.status(200).json(products.slice(0, 3));
    } else {
      res.status(200).json(products);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch first three products" });
  }
});
//last three
app.get('/products/last-three', async (req, res) => {
  try {
    const products = await Product.find();
    const lastThree = products.slice(-3);
    res.status(200).json(lastThree);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch last three products" });
  }
});

//productsbyId
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product Not Found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Invalid Product ID" });
  }
});
//edit products
app.put("/edit-product/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

//delete product
app.delete("/delete-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Extract file IDs and delete from Google Drive
    for (const imageUrl of product.Image) {
      const match = imageUrl.match(/id=([^&]+)/);
      if (match && match[1]) {
        const fileId = match[1];
        try {
          await drive.files.delete({ fileId });
        } catch (driveError) {
          console.warn(`Failed to delete image ${fileId} from Drive`, driveError.message);
        }
      }
    }

    // Delete the product from MongoDB
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product and associated images deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

//notification function
app.get("/send-notification", async (req, res) => {
  const topic = "all-users";
  const title = "Test Notification";
  const message = "This is a message to all users.";

  // Send the notification to Firebase (or other service)
  const success = await sendNotification(topic, title, message);

  // If the notification was successfully sent, store it locally
  if (success) {
    // Create a notification object to store
    const notification = {
      title: title,
      message: message,
      timestamp: new Date().toISOString(),  // Current timestamp
      topic: topic,
    };

    // Store the notification in the local array
    notifications.push(notification);

    // Limit the array to the last 10 notifications (optional)
    if (notifications.length > 10) {
      notifications.shift();  // Remove the oldest notification
    }

    res.status(200).send("Notification sent to all users and stored locally!");
  } else {
    res.status(500).send("Failed to send notification.");
  }
});

app.get("/get-notifications", (req, res) => {
  res.json(notifications);
});
//delivered
app.post('/delivered/:id', async (req, res) => {
  try {
    const order = await Orders.findById(req.params.id);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    let totalPrice = 0;
    for (const item of order.orders) {
      totalPrice += item.price * item.quantity;
    }
    const delivered = new Delivered(order.toObject());
    await delivered.save();

    await Orders.findByIdAndDelete(req.params.id);
    const { subject, html } = createDeliveryEmail(order, order._id,totalPrice);
    await sendMail(order.Email, subject, html);
    res.status(200).json({ message: "Order marked as delivered", delivered });
  } catch (error) {
    console.error("Deliver Order Error:", error);
    res.status(500).json({ error: "Failed to deliver order" });
  }
});
app.get('/get-delivered-orders', async (req, res) => {
  try {
    const delivered = await Delivered.find(); // Fetch all products
    res.status(200).json(delivered);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
//server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setInterval(() => {
        fetch("https://backend-8d89.onrender.com/get-notifications");
    }, 840000);
});
