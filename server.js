const express = require("express");
const path = require("path");

const app = express();

// serve public folder
app.use(express.static(path.join(__dirname, "public")));

// root -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Render needs process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port:", PORT);
});
