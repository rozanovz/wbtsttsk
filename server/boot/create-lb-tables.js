'use strict';

module.exports = function(app) {
  const postgresqlIDs = app.dataSources.postgresqlIDs;
  const lbTables = ['machine'];
  postgresqlIDs.autoupdate(lbTables, function(er) {
    if (er) throw er;
    console.log(
      'Loopback tables [' + lbTables + '] created in ',
      postgresqlIDs.adapter.name
    );
  });
};
