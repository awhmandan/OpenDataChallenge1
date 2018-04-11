var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var patterns = {
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
}

var hasIPAddress = function (cell) {
  return patterns.ip.test(cell);
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

function scan(rows) {
  return rows.reduce(
    function (errors, row) {
      return errors.concat(
        row.reduce(
          function (columnErrors, column) {
            if (!hasIPAddress(column.data)) return columnErrors;

            return columnErrors.concat(
              flag({
                code: 'ip-address-found',
                message: 'Oops! We\'ve found an IP address!',
                location: column.location,
                itemType: 'cell'
              })
            );
          },
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
