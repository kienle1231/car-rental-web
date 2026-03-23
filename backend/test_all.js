require('dotenv').config();
const http = require('http');
const fs = require('fs');
const LOG = 'd:/exe18/carRental/backend/test_out.txt';
fs.writeFileSync(LOG, '--- TEST START ---\n');
const log = (msg) => { fs.appendFileSync(LOG, msg + '\n'); };

const call = (method, path, body, token) => new Promise((resolve) => {
  const data = body ? JSON.stringify(body) : '';
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, res => {
    let raw = '';
    res.on('data', d => raw += d);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
      catch { resolve({ status: res.statusCode, body: raw }); }
    });
  });
  req.on('error', e => resolve({ status: 0, body: e.message }));
  if (data) req.write(data);
  req.end();
});

  const pass = (label, r, note) => log(`PASS [${label}] ${r.status} ${note || ''}`);
  const fail = (label, r, note) => log(`FAIL [${label}] ${r.status} ${note || ''} => ${JSON.stringify(r.body).slice(0,150)}`);

(async () => {
  let r, adminToken, userToken, userRefresh, voucherCode;

  // 1. Admin Login
  r = await call('POST', '/api/auth/login', { email: 'admin@vip.com', password: 'admin123' });
  if (r.status === 200) { adminToken = r.body.token; pass('LOGIN admin', r, r.body.role); }
  else { fail('LOGIN admin', r); return; }

  // 2. Register new user
  const email = `test${Date.now()}@mail.com`;
  r = await call('POST', '/api/auth/register', { name: 'Tester', email, password: '123456' });
  if (r.status === 201) { userToken = r.body.token; pass('REGISTER', r, email); }
  else fail('REGISTER', r);

  // 3. Login new user -> get refresh token
  r = await call('POST', '/api/auth/login', { email, password: '123456' });
  if (r.status === 200) {
    userToken = r.body.token;
    userRefresh = r.body.refreshToken;
    pass('LOGIN user', r, 'got refreshToken=' + (userRefresh ? 'YES' : 'NO'));
  } else fail('LOGIN user', r);

  // 4. Refresh Token
  r = await call('POST', '/api/auth/refresh-token', { refreshToken: userRefresh });
  if (r.status === 200 && r.body.token) { pass('REFRESH_TOKEN', r, 'got new token'); }
  else fail('REFRESH_TOKEN', r);
  const freshToken = r.body.token || userToken;

  // 5. Change Password (requires old password)
  r = await call('PUT', '/api/auth/change-password', { oldPassword: '123456', newPassword: 'newpass123' }, freshToken);
  if (r.status === 200) pass('CHANGE_PASSWORD', r, r.body.message);
  else fail('CHANGE_PASSWORD', r);

  // 6. Login with new password
  r = await call('POST', '/api/auth/login', { email, password: 'newpass123' });
  if (r.status === 200) { userToken = r.body.token; pass('LOGIN new pass', r); }
  else fail('LOGIN new pass', r);

  // 7. Logout all
  r = await call('POST', '/api/auth/logout-all', {}, userToken);
  if (r.status === 200) pass('LOGOUT_ALL', r, r.body.message);
  else fail('LOGOUT_ALL', r);

  // 8. Old refresh token should be invalid now
  r = await call('POST', '/api/auth/refresh-token', { refreshToken: userRefresh });
  if (r.status === 401) pass('REFRESH_REVOKED (expected 401)', r);
  else fail('REFRESH_REVOKED should be 401', r);

  // 9. Create Voucher (admin)
  voucherCode = 'DEMO' + Date.now();
  r = await call('POST', '/api/admin/vouchers', {
    code: voucherCode, discount: 20, expiryDate: '2027-12-31', usageLimit: 100, minBookingValue: 0
  }, adminToken);
  if (r.status === 201) pass('CREATE_VOUCHER', r, voucherCode);
  else fail('CREATE_VOUCHER', r);

  // 10. Apply Voucher
  r = await call('POST', '/api/admin/vouchers/apply', { code: voucherCode, bookingValue: 500 }, adminToken);
  if (r.status === 200) pass('APPLY_VOUCHER', r, `discount=${r.body.discountAmount} final=${r.body.finalPrice}`);
  else fail('APPLY_VOUCHER', r);

  // 11. Get Vouchers
  r = await call('GET', '/api/admin/vouchers', null, adminToken);
  if (r.status === 200) pass('GET_VOUCHERS', r, `count=${Array.isArray(r.body) ? r.body.length : '?'}`);
  else fail('GET_VOUCHERS', r);

  // 12. Analytics by month
  r = await call('GET', '/api/admin/analytics?period=month', null, adminToken);
  if (r.status === 200) pass('ANALYTICS_MONTH', r, `entries=${r.body.data ? r.body.data.length : 0}`);
  else fail('ANALYTICS_MONTH', r);

  // 13. Analytics by day
  r = await call('GET', '/api/admin/analytics?period=day', null, adminToken);
  if (r.status === 200) pass('ANALYTICS_DAY', r, `entries=${r.body.data ? r.body.data.length : 0}`);
  else fail('ANALYTICS_DAY', r);

  // 14. Get Notifications
  r = await call('GET', '/api/admin/notifications/my', null, adminToken);
  if (r.status === 200) pass('GET_NOTIFICATIONS', r, `count=${Array.isArray(r.body) ? r.body.length : '?'}`);
  else fail('GET_NOTIFICATIONS', r);

  // 15. Review with fake bookingId (should fail - booking not found)
  r = await call('POST', '/api/reviews', { bookingId: '000000000000000000000000', rating: 5, comment: 'Test' }, adminToken);
  if (r.status !== 201) pass('REVIEW_BLOCKED_NO_BOOKING (expected fail)', r, r.body.message);
  else fail('REVIEW should have been blocked', r);

  // 16. Create Booking with pricing breakdown
  const carsR = await call('GET', '/api/cars', null, null);
  if (carsR.status === 200 && carsR.body.length > 0) {
    const carId = carsR.body[0]._id;
    r = await call('POST', '/api/bookings', {
      car: carId,
      pickupDate: '2026-07-10', returnDate: '2026-07-13',
      pickupLocation: 'Ho Chi Minh City',
      addOns: ['basic_insurance', 'gps'],
      paymentMethod: 'vietqr',
      customerName: 'Tester', customerEmail: 'tester@test.com', customerPhone: '0981313248'
    }, adminToken);
    if (r.status === 201 && r.body.pricing) {
      pass('CREATE_BOOKING + PRICING', r,
        `days=${r.body.pricing.totalDays} fee=${r.body.pricing.serviceFee} tax=${r.body.pricing.tax} total=${r.body.pricing.totalPrice}`);
    } else fail('CREATE_BOOKING', r);

    // 17. Double booking same dates (should return 409)
    r = await call('POST', '/api/bookings', {
      car: carId,
      pickupDate: '2026-07-11', returnDate: '2026-07-12',
      pickupLocation: 'HCM', addOns: [],
      paymentMethod: 'card',
      customerName: 'X', customerEmail: 'x@x.com', customerPhone: '000'
    }, adminToken);
    if (r.status === 409) pass('DOUBLE_BOOKING_BLOCKED (expected 409)', r, r.body.error);
    else fail('DOUBLE_BOOKING should be 409', r);
  } else {
    log('SKIP [BOOKING] no cars found in DB');
  }

  log('\n=== ALL TESTS DONE ===');
})();
