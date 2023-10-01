const express = require("express");
const Firebird = require("node-firebird");
const app = express();


const options = {
  host: "127.0.0.1",
  port: 3050,
  database:"C:\\Fiscaltech\\Ambientes_Valery\\ValerySMB_7177a\\Datos\\VALERY3.MDF",
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false,
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get("/ventas", (req, res) => {
  Firebird.attach(options, (err, db) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Error al conectar a la base de datos" });
      return;
    }

    if (!db) {
      res
        .status(500)
        .json({
          error: "Error al establecer la conexión con la base de datos",
        });
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
  });
});

const port = 5000;
app.listen(port, () => {
  console.log(`Servidor backend en ejecución en http://localhost:${port}`);
});
