var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var patterns = {
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  nino: /((?=[^dfiquv])[a-z])(?=[^dfioquv])[a-z] ?[0-9]{2} ?[0-9]{2} ?[0-9]{2} ?[a-d]{1}/i,
  email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  dob: /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/,
  cc: /^4[0-9]{12}(?:[0-9]{3})?$/
}

var hasIPAddress = function (cell) {
  return patterns.ip.test(cell);
}

var hasNINO = function (cell) {
  return patterns.nino.test(cell);
}

var hasEmail = function (cell) {
  return patterns.email.test(cell);
}

var hasDOB = function (cell) {
  return patterns.dob.test(cell);
}

var hasCreditCard = function (cell) {
  return patterns.cc.test(cell);
}

function map(data) {
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(function (row, rowIndex) {
    return row.map(function (column, columnIndex) {
      return {
        data: column,
        column: headers[columnIndex],
        location: {
          rowIndex,
          columnIndex
        }
      }
    })
  });
}

function flag({ code, message, itemType, location }) {
  return {
    code,
    message,
    item: {
      itemType,
      location
    }
  }
}

function dataChecks(columnErrors, column) {
  if (hasIPAddress(column.data)) return columnErrors.concat(
    flag({
      code: 'ip-address-found',
      message: 'Oops! We\'ve found an IP address!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasNINO(column.data)) return columnErrors.concat(
    flag({
      code: 'national-insurance-number-found',
      message: 'Oops! We\'ve found a National Insurance number!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasEmail(column.data)) return columnErrors.concat(
    flag({
      code: 'email-address-found',
      message: 'Oops! We\'ve found an email address!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasDOB(column.data)) return columnErrors.concat(
    flag({
      code: 'date-of-birth-found',
      message: 'Oops! We\'ve found a date of birth!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasCreditCard(column.data)) return columnErrors.concat(
    flag({
      code: 'credit-card-found',
      message: 'Oops! We\'ve found a credit card number!',
      location: column.location,
      itemType: 'cell'
    })
  );

  return columnErrors;
}

function scan(rows) {
  return rows.reduce(
    function (errors, row) {
      return errors.concat(
        row.reduce(
          dataChecks,
          []
        )
      );
    },
    []
  );
}

function analyse(data) {
  const rows = map(data);

  const errors = scan(rows);

  return {
    'version': 1,
    'format': 'csv',
    'item-count': rows.length,
    'errors': errors
  };
}

function read(path) {
  return fs.readFileSync(path);
}

function write(path, report) {
  fs.writeFileSync('report.json', report);
}

function process(path) {
  const file = read(path);
  const data = parse(file);
  const report = analyse(data);

  write('report.json', JSON.stringify(report));
}

process('./data/unsafe-data-1.csv');
