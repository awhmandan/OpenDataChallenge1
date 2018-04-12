var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var patterns = {
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  nationalInsuranceNumber: /((?=[^dfiquv])[a-z])(?=[^dfioquv])[a-z] ?[0-9]{2} ?[0-9]{2} ?[0-9]{2} ?[a-d]{1}/i,
  email: /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/,
  date: /(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d/,
  creditCardVisa: /4[0-9]{12}(?:[0-9]{3})?/,
  creditCardMasterCard: /(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}/,
  ukCarRegistration: /([A-Z]{3}\s?(\d{3}|\d{2}|d{1})\s?[A-Z])|([A-Z]\s?(\d{3}|\d{2}|\d{1})\s?[A-Z]{3})|(([A-HK-PRSVWY][A-HJ-PR-Y])\s?([0][2-9]|[1-9][0-9])\s?[A-HJ-PR-Z]{3})/,
  ukMobilePhoneNumber: /(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/,
  twitterHandle: /(?:@)([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)/
}

var hasIPAddress = function (cell) {
  return patterns.ipAddress.test(cell);
}

var hasNINO = function (cell) {
  return patterns.nationalInsuranceNumber.test(cell);
}

var hasEmail = function (cell) {
  return patterns.email.test(cell);
}

var hasDate = function (cell) {
  return patterns.date.test(cell);
}

var hasCreditCardVisa = function (cell) {
  return patterns.creditCardVisa.test(cell);
}

var hasCreditCardMasterCard = function (cell) {
  return patterns.creditCardMasterCard.test(cell);
}

var hasUkCarRegistration = function (cell) {
  return patterns.ukCarRegistration.test(cell);
}

var hasUkMobilePhoneNumber = function (cell) {
  return patterns.ukMobilePhoneNumber.test(cell);
}

var hasTwitterHandle = function (cell) {
  return patterns.twitterHandle.test(cell);
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

  if (hasDate(column.data)) return columnErrors.concat(
    flag({
      code: 'date-found',
      message: 'Oops! We\'ve found a date! You may want to check it\'s not a date of birth.',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasCreditCardVisa(column.data)) return columnErrors.concat(
    flag({
      code: 'credit-card-visa-found',
      message: 'Oops! We\'ve found a Visa credit card number!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasCreditCardMasterCard(column.data)) return columnErrors.concat(
    flag({
      code: 'credit-card-mastercard-found',
      message: 'Oops! We\'ve found a MasterCard credit card number!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasUkCarRegistration(column.data)) return columnErrors.concat(
    flag({
      code: 'car-registration-found',
      message: 'Oops! We\'ve found a car registration number!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasUkMobilePhoneNumber(column.data)) return columnErrors.concat(
    flag({
      code: 'mobile-phone-number-found',
      message: 'Oops! We\'ve found a mobile phone number!',
      location: column.location,
      itemType: 'cell'
    })
  );

  if (hasTwitterHandle(column.data)) return columnErrors.concat(
    flag({
      code: 'twitter-handle-found',
      message: 'Oops! We\'ve found a Twitter handle!',
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

  write('report.json', JSON.stringify(report, null, 4));
}

process('./data/unsafe-data-1.csv');
