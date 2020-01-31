"use strict";

const excelJs = require("exceljs");

module.exports = Machine => {
  Machine.upload = async (req, res) => {
    if (!req.files) {
      return res.send({ message: "no file" });
    }
    const fileData = Buffer(req.files.file.data);
    const workbook = new excelJs.Workbook(fileData);
    await workbook.xlsx.load(fileData);
    const worksheet = workbook.getWorksheet(1);
    worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
      if (rowNumber !== 1) {
        const [nullvalue, machine, attribute, reading] = row.values;
        const record = await Machine.findOne({
          where: { machine, attribute }
        });

        record
          ? await Machine.replaceById(record.id, {
              machine,
              attribute,
              reading
            })
          : await Machine.create({ machine, attribute, reading });
      }
    });
    res.sendStatus(200);
  };

  Machine.download = async (req, res) => {
    const workbook = new excelJs.Workbook();
    const records = await Machine.find({
      order: "attribute DESC",
      fields: { id: false }
    });
    const worksheet = workbook.addWorksheet("Sheet");

    worksheet.columns = [
      { header: "Machine", key: "machine", width: "10" },
      { header: "attribute", key: "attribute", width: "10" },
      { header: "reading", key: "reading", width: "10", type: "decimal" }
    ];

    records.forEach(({ machine, attribute, reading }) => {
      worksheet.addRow({
        machine,
        attribute,
        reading: parseFloat(reading.replace(/,/g, ""))
      });
    });

    res.attachment("download.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  };

  Machine.getMachineAttributesByName = async (machineName, cb) => {
    const machine = await Machine.find({ where: { machine: machineName } });
    cb(null, machine);
  };

  Machine.remoteMethod("upload", {
    accepts: [
      { arg: "req", type: "object", http: { source: "req" } },
      { arg: "res", type: "object", http: { source: "res" } }
    ]
  });

  Machine.remoteMethod("download", {
    accepts: [
      { arg: "req", type: "object", http: { source: "req" } },
      { arg: "res", type: "object", http: { source: "res" } }
    ],
    http: { verb: "get" }
  });

  Machine.remoteMethod("getMachineAttributesByName", {
    http: { path: "/getAttributesByMachineName", verb: "get" },
    accepts: { arg: "machineName", type: "string", http: { source: "query" } },
    returns: { arg: "machine", type: "object" }
  });
};
