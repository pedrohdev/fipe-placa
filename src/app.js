const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const veiculoRoutes = require("./routes/veiculo.routes");
/* const webRoutes = require("./routes/web.routes");
 */

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "./views/"))

app.use(express.static(path.join(__dirname, "./public/")))

app.use(cors());
app.use(express.json());

app.use("/api/v1", veiculoRoutes)
/* app.use(webRoutes)
 */
app.listen(process.env.PORT || 3200, () => console.log(`Servidor rodando em http://localhost:${process.env.PORT || 3200}`))
