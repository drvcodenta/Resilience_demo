# Payment Instruction Parser API

**Deployed on Render.com (FREE)**

```
https://payment-instruction-parser-qu7j.onrender.com/payment-instructions
```

### Important: Free Tier Limitations

**Free services "spin down" after 15 minutes of inactivity.**

- First request after idle will take 30-60 seconds (cold start)
- Subsequent requests are fast

---

## Test Examples

Copy and paste these commands directly into PowerShell to test the live endpoint:

### Success Cases

#### 1. Basic DEBIT Transaction
```powershell
$body = '{"accounts": [{"id": "a", "balance": 230, "currency": "USD"}, {"id": "b", "balance": 300, "currency": "USD"}], "instruction": "DEBIT 30 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'; Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```
**Expected:** Status code AP00, a: 230→200, b: 300→330

#### 2. CREDIT Format Transaction
```powershell
$body = '{"accounts": [{"id": "acc-001", "balance": 1000, "currency": "USD"}, {"id": "acc-002", "balance": 500, "currency": "USD"}], "instruction": "CREDIT 300 USD TO ACCOUNT acc-002 FROM ACCOUNT acc-001"}'; Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```
**Expected:** Status code AP00, acc-001: 1000→700, acc-002: 500→800

#### 3. Pending Transaction (Future Date)
```powershell
$body = '{"accounts": [{"id": "a", "balance": 500, "currency": "GBP"}, {"id": "b", "balance": 200, "currency": "GBP"}], "instruction": "DEBIT 100 GBP FROM ACCOUNT a FOR CREDIT TO ACCOUNT b ON 2026-12-31"}'; Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```
**Expected:** Status code AP02, balances unchanged (pending)

#### 4. Case Insensitive Parsing
```powershell
$body = '{"accounts": [{"id": "a", "balance": 500, "currency": "USD"}, {"id": "b", "balance": 200, "currency": "USD"}], "instruction": "debit 50 usd from account a for credit to account b"}'; Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```
**Expected:** Status code AP00, works with lowercase, currency normalized to USD

#### 5. CREDIT with Future Date
```powershell
$body = '{"accounts": [{"id": "x", "balance": 1000, "currency": "NGN"}, {"id": "y", "balance": 500, "currency": "NGN"}], "instruction": "CREDIT 200 NGN TO ACCOUNT y FROM ACCOUNT x ON 2027-01-15"}'; Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```
**Expected:** Status code AP02, pending status, balances unchanged

---

### Error Cases (HTTP 400)

#### 6. Insufficient Funds (AC01)
```powershell
$body = '{"accounts": [{"id": "a", "balance": 50, "currency": "USD"}, {"id": "b", "balance": 300, "currency": "USD"}], "instruction": "DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'; try { Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10 } catch { $_.ErrorDetails.Message }
```
**Expected:** HTTP 400, status code AC01

#### 7. Currency Mismatch (CU01)
```powershell
$body = '{"accounts": [{"id": "a", "balance": 500, "currency": "USD"}, {"id": "b", "balance": 200, "currency": "GBP"}], "instruction": "DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'; try { Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10 } catch { $_.ErrorDetails.Message }
```
**Expected:** HTTP 400, status code CU01

#### 8. Unsupported Currency (CU02)
```powershell
$body = '{"accounts": [{"id": "a", "balance": 500, "currency": "EUR"}, {"id": "b", "balance": 200, "currency": "EUR"}], "instruction": "DEBIT 100 EUR FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"}'; try { Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10 } catch { $_.ErrorDetails.Message }
```
**Expected:** HTTP 400, status code CU02 (only NGN, USD, GBP, GHS supported)

#### 9. Same Account Transfer (AC02)
```powershell
$body = '{"accounts": [{"id": "a", "balance": 500, "currency": "USD"}], "instruction": "DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT a"}'; try { Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10 } catch { $_.ErrorDetails.Message }
```
**Expected:** HTTP 400, status code AC02

#### 10. Account Not Found (AC03)
```powershell
$body = '{"accounts": [{"id": "a", "balance": 500, "currency": "USD"}], "instruction": "DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT xyz"}'; try { Invoke-RestMethod -Uri https://payment-instruction-parser-qu7j.onrender.com/payment-instructions -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10 } catch { $_.ErrorDetails.Message }
```
**Expected:** HTTP 400, status code AC03

---

## Supported Formats

### DEBIT Format
```
DEBIT [amount] [currency] FROM ACCOUNT [id] FOR CREDIT TO ACCOUNT [id] [ON [date]]
```

### CREDIT Format
```
CREDIT [amount] [currency] TO ACCOUNT [id] FROM ACCOUNT [id] [ON [date]]
```

### Supported Currencies
- NGN (Nigerian Naira)
- USD (US Dollar)
- GBP (British Pound)
- GHS (Ghanaian Cedi)

### Date Format
- YYYY-MM-DD (e.g., 2026-12-31)
- Compared against UTC time
- Future dates = pending (AP02)
- Past/today = immediate execution (AP00 if successful)

---
