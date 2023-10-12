require('dotenv').config();
const express = require("express");
const app = express();
const Firebird = require("node-firebird");



const PORT = process.env.PORT || 3050;

const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  lowercase_keys: false,
};


app.use(express.json()); // sin esto no podemos ver el req.body
app.use(express.urlencoded({ extended: true })); // sino se agrega no podremos tomar los parametros de la url del request, req.query


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get("/ventas", (req, res) =>  {
  Firebird.attach(options, (err, db) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Error al conectar a la base de datos" });
      return;
    }
    const sql = `select
    v.fecha_emision,
    count(v.documento),
    sum(CASE v.tipo_documento
          WHEN 'DEV' THEN v.total_operacion * -1
          ELSE v.total_operacion
         END) AS Tot_Operacion_LR_Bs,
    sum(rm.contado_rm),
    rm.factor_cambio
FROM ventas v join ventas_rm rm on ((v.correlativo = rm.correlativo_principal) and rm.moneda_codigo='02')
     WHERE ((v.tipo_documento = 'FAC' OR v.tipo_documento = 'DEV') AND
           (v.documento <> '' AND SUBSTRING(v.documento FROM 1 FOR 1) <> '*'))
     GROUP BY v.fecha_emision, rm.factor_cambio
`;

    db.query(sql, (err, result) => {
      db.detach();

      if (err) {
        console.error(err);
        res.status(500).json({ error: "Error al ejecutar la consulta" });
        return;
      }

      res.json(result);
    });

    if (!db) {
      res
        .status(500)
        .json({
          error: "Error al establecer la conexión con la base de datos",
        });
      return;
    }


  });
});


app.listen(PORT, () => {
  console.log(`Servidor backend en ejecución en http://localhost:${PORT}`);
});
