const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { PaymentMessages } = require('@app/messages');
const { appLogger } = require('@app-core/logger');

// Validation spec
const spec = `root {
  accounts[] {
    id string
    balance number
    currency string
  }
  instruction string
}`;

const parsedSpec = validator.parse(spec);

const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GBP', 'GHS'];

// Helper function to validate account ID format (letters, numbers, hyphens, periods, at symbols only)
function isValidAccountId(accountId) {
  if (!accountId || typeof accountId !== 'string') return false;

  for (let i = 0; i < accountId.length; i += 1) {
    const char = accountId[i];
    const isValid =
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      (char >= '0' && char <= '9') ||
      char === '-' ||
      char === '.' ||
      char === '@';

    if (!isValid) return false;
  }

  return true;
}

// Helper function to validate date format YYYY-MM-DD
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (dateStr.length !== 10) return false;

  // Check format YYYY-MM-DD
  if (dateStr[4] !== '-' || dateStr[7] !== '-') return false;

  // Extract parts
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(5, 7);
  const day = dateStr.substring(8, 10);

  // Check if all parts are numeric
  for (let i = 0; i < year.length; i += 1) {
    if (year[i] < '0' || year[i] > '9') return false;
  }
  for (let i = 0; i < month.length; i += 1) {
    if (month[i] < '0' || month[i] > '9') return false;
  }
  for (let i = 0; i < day.length; i += 1) {
    if (day[i] < '0' || day[i] > '9') return false;
  }

  // Validate ranges
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (yearNum < 1000 || yearNum > 9999) return false;
  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;

  return true;
}

// Helper to normalize whitespace
function normalizeWhitespace(str) {
  let result = '';
  let lastWasSpace = false;

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    const isSpace = char === ' ' || char === '\t' || char === '\n' || char === '\r';

    if (isSpace) {
      if (!lastWasSpace) {
        result += ' ';
        lastWasSpace = true;
      }
    } else {
      result += char;
      lastWasSpace = false;
    }
  }

  return result.trim();
}

// Parse instruction using string methods only (NO REGEX)
function parseInstructionText(instruction) {
  const normalized = normalizeWhitespace(instruction);
  const upperInstruction = normalized.toUpperCase();

  const parsed = {
    type: null,
    amount: null,
    currency: null,
    debitAccount: null,
    creditAccount: null,
    executeBy: null,
  };

  // Determine instruction type
  const startsWithDebit = upperInstruction.indexOf('DEBIT') === 0;
  const startsWithCredit = upperInstruction.indexOf('CREDIT') === 0;

  if (!startsWithDebit && !startsWithCredit) {
    throwAppError(PaymentMessages.MISSING_KEYWORD, ERROR_CODE.INVLDDATA);
  }

  parsed.type = startsWithDebit ? 'DEBIT' : 'CREDIT';

  // Find keyword positions (case-insensitive)
  const fromPos = upperInstruction.indexOf(' FROM ');
  const toPos = upperInstruction.indexOf(' TO ');
  const forPos = upperInstruction.indexOf(' FOR ');
  const accountWord = ' ACCOUNT ';
  const onPos = upperInstruction.indexOf(' ON ');

  if (parsed.type === 'DEBIT') {
    // DEBIT [amount] [currency] FROM ACCOUNT [id] FOR CREDIT TO ACCOUNT [id] [ON [date]]

    // Check required keywords exist
    if (fromPos === -1 || forPos === -1 || toPos === -1) {
      throwAppError(PaymentMessages.MISSING_KEYWORD, ERROR_CODE.INVLDDATA);
    }

    // Check keyword order: FROM < FOR < TO
    if (!(fromPos < forPos && forPos < toPos)) {
      throwAppError(PaymentMessages.INVALID_ORDER, ERROR_CODE.INVLDDATA);
    }

    // Check "FROM ACCOUNT" pattern
    const fromAccountPos = upperInstruction.indexOf(accountWord, fromPos);
    if (fromAccountPos === -1 || fromAccountPos > forPos) {
      throwAppError(PaymentMessages.INVALID_ORDER, ERROR_CODE.INVLDDATA);
    }

    // Check "FOR CREDIT" pattern
    const creditPos = upperInstruction.indexOf(' CREDIT', forPos);
    if (creditPos === -1 || creditPos > toPos) {
      throwAppError(PaymentMessages.MISSING_KEYWORD, ERROR_CODE.INVLDDATA);
    }

    // Check "TO ACCOUNT" pattern
    const toAccountPos = upperInstruction.indexOf(accountWord, toPos);
    if (toAccountPos === -1) {
      throwAppError(PaymentMessages.INVALID_ORDER, ERROR_CODE.INVLDDATA);
    }

    // Extract amount and currency (between DEBIT and FROM)
    const amountCurrencyPart = normalized.substring(6, fromPos).trim();
    const parts = amountCurrencyPart.split(' ');

    if (parts.length < 2) {
      throwAppError(PaymentMessages.MALFORMED, ERROR_CODE.INVLDDATA);
    }

    const [amount, currency] = parts;
    parsed.amount = amount;
    parsed.currency = currency.toUpperCase();

    // Extract debit account (after FROM ACCOUNT, before FOR)
    const debitStart = fromAccountPos + accountWord.length;
    const debitAccountId = normalized.substring(debitStart, forPos).trim();
    parsed.debitAccount = debitAccountId;

    // Extract credit account (after TO ACCOUNT)
    const creditStart = toAccountPos + accountWord.length;
    let creditEnd = normalized.length;

    // Check if there's an ON clause
    if (onPos !== -1 && onPos > toAccountPos) {
      creditEnd = onPos;
      const dateStart = onPos + 4;
      parsed.executeBy = normalized.substring(dateStart).trim();
    }

    const creditAccountId = normalized.substring(creditStart, creditEnd).trim();
    parsed.creditAccount = creditAccountId;
  } else {
    // CREDIT [amount] [currency] TO ACCOUNT [id] FROM ACCOUNT [id] [ON [date]]

    // Check required keywords exist
    if (toPos === -1 || fromPos === -1) {
      throwAppError(PaymentMessages.MISSING_KEYWORD, ERROR_CODE.INVLDDATA);
    }

    // Check keyword order: TO < FROM
    if (!(toPos < fromPos)) {
      throwAppError(PaymentMessages.INVALID_ORDER, ERROR_CODE.INVLDDATA);
    }

    // Check "TO ACCOUNT" pattern
    const toAccountPos = upperInstruction.indexOf(accountWord, toPos);
    if (toAccountPos === -1 || toAccountPos > fromPos) {
      throwAppError(PaymentMessages.INVALID_ORDER, ERROR_CODE.INVLDDATA);
    }

    // Check "FROM ACCOUNT" pattern
    const fromAccountPos = upperInstruction.indexOf(accountWord, fromPos);
    if (fromAccountPos === -1) {
      throwAppError(PaymentMessages.INVALID_ORDER, ERROR_CODE.INVLDDATA);
    }

    // Extract amount and currency (between CREDIT and TO)
    const amountCurrencyPart = normalized.substring(7, toPos).trim();
    const parts = amountCurrencyPart.split(' ');

    if (parts.length < 2) {
      throwAppError(PaymentMessages.MALFORMED, ERROR_CODE.INVLDDATA);
    }

    const [amount, currency] = parts;
    parsed.amount = amount;
    parsed.currency = currency.toUpperCase();

    // Extract credit account (after TO ACCOUNT, before FROM)
    const creditStart = toAccountPos + accountWord.length;
    const creditAccountId = normalized.substring(creditStart, fromPos).trim();
    parsed.creditAccount = creditAccountId;

    // Extract debit account (after FROM ACCOUNT)
    const debitStart = fromAccountPos + accountWord.length;
    let debitEnd = normalized.length;

    // Check if there's an ON clause
    if (onPos !== -1 && onPos > fromAccountPos) {
      debitEnd = onPos;
      const dateStart = onPos + 4;
      parsed.executeBy = normalized.substring(dateStart).trim();
    }

    const debitAccountId = normalized.substring(debitStart, debitEnd).trim();
    parsed.debitAccount = debitAccountId;
  }

  return parsed;
}

async function parseInstruction(serviceData) {
  let response;

  // Validate input
  const data = validator.validate(serviceData, parsedSpec);

  try {
    const { instruction } = data;
    const { accounts } = data;

    let parsed;

    // Try to parse instruction
    try {
      parsed = parseInstructionText(instruction);
    } catch (error) {
      // If parsing fails completely, return unparseable response
      if (error.code === ERROR_CODE.INVLDDATA) {
        response = {
          type: null,
          amount: null,
          currency: null,
          debit_account: null,
          credit_account: null,
          execute_by: null,
          status: 'failed',
          status_reason: error.message,
          status_code: 'SY03',
          accounts: [],
        };
        return response;
      }
      throw error;
    }

    // Validate amount (must be positive integer)
    const amountStr = parsed.amount;
    let amountNum = null;

    // Check if amount contains only digits
    let isValidAmount = true;
    if (!amountStr || amountStr.length === 0) {
      isValidAmount = false;
    } else {
      for (let i = 0; i < amountStr.length; i += 1) {
        if (amountStr[i] < '0' || amountStr[i] > '9') {
          isValidAmount = false;
          break;
        }
      }
    }

    if (!isValidAmount) {
      response = {
        type: parsed.type,
        amount: null,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.INVALID_AMOUNT,
        status_code: 'AM01',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    amountNum = parseInt(amountStr, 10);

    if (amountNum <= 0) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.INVALID_AMOUNT,
        status_code: 'AM01',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    // Validate currency (must be supported)
    const { currency } = parsed;
    let isSupportedCurrency = false;

    for (let i = 0; i < SUPPORTED_CURRENCIES.length; i += 1) {
      if (SUPPORTED_CURRENCIES[i] === currency) {
        isSupportedCurrency = true;
        break;
      }
    }

    if (!isSupportedCurrency) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.UNSUPPORTED_CURRENCY,
        status_code: 'CU02',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    // Validate account IDs
    if (!isValidAccountId(parsed.debitAccount)) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.INVALID_ACCOUNT_ID,
        status_code: 'AC04',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    if (!isValidAccountId(parsed.creditAccount)) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.INVALID_ACCOUNT_ID,
        status_code: 'AC04',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    // Check if debit and credit accounts are the same
    if (parsed.debitAccount === parsed.creditAccount) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.SAME_ACCOUNT,
        status_code: 'AC02',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    // Find accounts in the provided accounts array
    let debitAccountObj = null;
    let creditAccountObj = null;

    for (let i = 0; i < accounts.length; i += 1) {
      if (accounts[i].id === parsed.debitAccount) {
        debitAccountObj = accounts[i];
      }
      if (accounts[i].id === parsed.creditAccount) {
        creditAccountObj = accounts[i];
      }
    }

    // Check if accounts exist
    if (!debitAccountObj) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.ACCOUNT_NOT_FOUND,
        status_code: 'AC03',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    if (!creditAccountObj) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.ACCOUNT_NOT_FOUND,
        status_code: 'AC03',
        accounts: accounts.map((acc) => ({
          id: acc.id,
          balance: acc.balance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        })),
      };
      return response;
    }

    // Check currency match between accounts
    if (debitAccountObj.currency.toUpperCase() !== creditAccountObj.currency.toUpperCase()) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.CURRENCY_MISMATCH,
        status_code: 'CU01',
        accounts: accounts
          .filter((acc) => acc.id === parsed.debitAccount || acc.id === parsed.creditAccount)
          .map((acc) => ({
            id: acc.id,
            balance: acc.balance,
            balance_before: acc.balance,
            currency: acc.currency.toUpperCase(),
          })),
      };
      return response;
    }

    // Validate date format if provided
    if (parsed.executeBy) {
      if (!isValidDateFormat(parsed.executeBy)) {
        response = {
          type: parsed.type,
          amount: amountNum,
          currency: parsed.currency,
          debit_account: parsed.debitAccount,
          credit_account: parsed.creditAccount,
          execute_by: parsed.executeBy,
          status: 'failed',
          status_reason: PaymentMessages.INVALID_DATE,
          status_code: 'DT01',
          accounts: accounts
            .filter((acc) => acc.id === parsed.debitAccount || acc.id === parsed.creditAccount)
            .map((acc) => ({
              id: acc.id,
              balance: acc.balance,
              balance_before: acc.balance,
              currency: acc.currency.toUpperCase(),
            })),
        };
        return response;
      }
    }

    // Check sufficient funds
    if (debitAccountObj.balance < amountNum) {
      response = {
        type: parsed.type,
        amount: amountNum,
        currency: parsed.currency,
        debit_account: parsed.debitAccount,
        credit_account: parsed.creditAccount,
        execute_by: parsed.executeBy,
        status: 'failed',
        status_reason: PaymentMessages.INSUFFICIENT_FUNDS,
        status_code: 'AC01',
        accounts: accounts
          .filter((acc) => acc.id === parsed.debitAccount || acc.id === parsed.creditAccount)
          .map((acc) => ({
            id: acc.id,
            balance: acc.balance,
            balance_before: acc.balance,
            currency: acc.currency.toUpperCase(),
          })),
      };
      return response;
    }

    // Determine if immediate or pending execution
    let isPending = false;

    if (parsed.executeBy) {
      // Compare with current UTC date
      const now = new Date();
      const currentUtcDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const executeDateParts = parsed.executeBy.split('-');
      const executeDate = new Date(
        Date.UTC(
          parseInt(executeDateParts[0], 10),
          parseInt(executeDateParts[1], 10) - 1,
          parseInt(executeDateParts[2], 10)
        )
      );

      if (executeDate > currentUtcDate) {
        isPending = true;
      }
    }

    // Build response accounts maintaining original order
    const responseAccounts = [];
    for (let i = 0; i < accounts.length; i += 1) {
      const acc = accounts[i];
      if (acc.id === parsed.debitAccount || acc.id === parsed.creditAccount) {
        let newBalance = acc.balance;

        if (!isPending) {
          if (acc.id === parsed.debitAccount) {
            newBalance = acc.balance - amountNum;
          } else if (acc.id === parsed.creditAccount) {
            newBalance = acc.balance + amountNum;
          }
        }

        responseAccounts.push({
          id: acc.id,
          balance: newBalance,
          balance_before: acc.balance,
          currency: acc.currency.toUpperCase(),
        });
      }
    }

    // Build final response
    response = {
      type: parsed.type,
      amount: amountNum,
      currency: parsed.currency,
      debit_account: parsed.debitAccount,
      credit_account: parsed.creditAccount,
      execute_by: parsed.executeBy,
      status: isPending ? 'pending' : 'successful',
      status_reason: isPending ? PaymentMessages.PENDING : PaymentMessages.SUCCESS,
      status_code: isPending ? 'AP02' : 'AP00',
      accounts: responseAccounts,
    };
  } catch (error) {
    appLogger.errorX(error, 'parse-instruction-error');
    throw error;
  }

  return response;
}

module.exports = parseInstruction;
