const express = require("express");
const sql = require("msnodesqlv8");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Create an Express application
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const connectionString =
  "server=DESKTOP-PVRHHQ5\\SQLEXPRESS;Database=newitems;Trusted_Connection=Yes;Driver={SQL Server}";

app.post("/user/login", (req, res) => {
  const { email, phoneNumber, password } = req.body;
  console.log("Hello", req.body);
  // res.json({ email, password });

  if (!email && !phoneNumber) {
    return res
      .status(400)
      .json({ message: "Email or phone number is required." });
  }

  let query = "SELECT Email, Password, PhoneNumber, UserId FROM Users WHERE ";
  if (email) {
    query += `Email = '${email}'`;
  } else {
    query += `PhoneNumber = '${phoneNumber}'`;
  }

  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = result[0];
    if (user.Password === password) {
      res.cookie({ UserId: user.UserId });
      return res
        .status(200)
        .json({ email: user.Email, phoneNumber: user.PhoneNumber });
    } else {
      return res.status(401).json({ message: "Invalid credentials." });
    }
  });
});

app.post("/user/register", (req, res) => {
  const { name, phoneNumber, email, password } = req.body;

  // Check if all required fields are provided
  if (!name || !phoneNumber || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const query = `
    INSERT INTO Users (Name, PhoneNumber, Email, Password)
    VALUES ('${name}', '${phoneNumber}', '${email}', '${password}')
  `;

  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error." });
    }

    return res.status(201).json({ message: "User registered successfully." });
  });
});

app.get("/categories", (req, res) => {
  const query = "SELECT * FROM mst_ParameterGroup";
  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
    }
    res.send(result);
  });
});

app.get("/categories/:id", (req, res) => {
  const id = req.params.id;
  const query = `SELECT szdescription as name, szmaterial as code, szmaterial as pcode FROM mst_Item WHERE szmaterialcategory = '${id}'`;
  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
    }
    res.send(result);
  });
});

app.get("/products", (req, res) => {
  const query =
    "SELECT szdescription as name, szmaterial as code FROM mst_Item";
  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
    }
    res.send(result);
  });
});

app.get("/product/:id", (req, res) => {
  const id = req.params.id;
  const query = `SELECT szresourcegroup as code, szparametercode as brandname, szimageurl as imageurl, szresourcedescription as description FROM tran_ResourcesVsParameter WHERE szresourcegroup='${id}'`;
  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
    }
    res.send(result);
  });
});

app.get("/user", (req, res) => {
  const userId = req.cookies.UserId;

  if (!userId) {
    return res.status(400).json({ message: "UserId cookie is missing." });
  }

  const query = `SELECT * FROM Users WHERE UserId = '${userId}'`;
  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.send(result[0]);
  });
});

app.post("/submitorder", (req, res) => {
  const {
    name,
    address,
    phoneNumber,
    cartItems,
    totalCostPrice,
    totalSellingPrice,
  } = req.body;

  if (
    !name ||
    !address ||
    !phoneNumber ||
    !cartItems ||
    !totalCostPrice ||
    !totalSellingPrice
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const query = `
    INSERT INTO dbo.Orders (Name, Address, PhoneNumber, CartItems, TotalCostPrice, TotalSellingPrice)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name,
    address,
    phoneNumber,
    JSON.stringify(cartItems),
    totalCostPrice,
    totalSellingPrice,
  ];

  sql.query(connectionString, query, params, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error." });
    }
    return res
      .status(201)
      .json({
        message: "Order submitted successfully.",
        orderId: result.insertId,
      });
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
