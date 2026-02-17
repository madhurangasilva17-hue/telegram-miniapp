const express = require("express");
const path = require("path");

const app = express();

// serve public folder
app.use(express.static(path.join(__dirname, "public")));

// root -> index.html (extra safe)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log("✅ Server running: http://localhost:3000");
});
