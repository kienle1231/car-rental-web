const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');

exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('car');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    booking.paymentStatus = 'paid';
    booking.status = 'Approved';
    booking.transactionId = 'MB_' + Date.now();
    await booking.save();

    // Send email logic (Nodemailer)
    try {
      // You can define EMAIL_USER and EMAIL_PASS in your backend/.env
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com', 
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
      
      const mailOptions = {
        from: '"LuxeRide Vehicles" <no-reply@luxeride.com>',
        to: booking.customerEmail || 'demo@example.com',
        subject: `[LuxeRide] Phiếu Thuê Xe (Rental Ticket) - ${booking.transactionId}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
            <div style="background-color: #fff; border-top: 5px solid #d4af37; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <h1 style="color: #333; margin-top: 0;">PHIẾU THUÊ XE / RENTAL TICKET</h1>
              <p style="color: #28a745; font-weight: bold; font-size: 16px;">✓ Thanh toán thành công (Payment Confirmed)</p>
              
              <p>Xin chào <strong>${booking.customerName}</strong>,</p>
              <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi. Chuyến đi của bạn đã được xác nhận (Mã Booking: <strong>${booking._id}</strong>).</p>
              
              <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #d4af37;">THÔNG TIN KHÁCH HÀNG</h3>
              <ul>
                <li><strong>Họ Tên:</strong> ${booking.customerName}</li>
                <li><strong>SĐT:</strong> ${booking.customerPhone}</li>
                <li><strong>Email:</strong> ${booking.customerEmail}</li>
              </ul>

              <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #d4af37;">CHI TIẾT CHUYẾN ĐI (TRIP DETAILS)</h3>
              <ul>
                <li><strong>Xe (Car):</strong> ${booking.car ? booking.car.brand + ' ' + booking.car.model : 'LuxeRide Vehicle'}</li>
                <li><strong>Ngày Nhận (Pickup):</strong> ${booking.pickupDate.toISOString().split('T')[0]}</li>
                <li><strong>Ngày Trả (Return):</strong> ${booking.returnDate.toISOString().split('T')[0]}</li>
                <li><strong>Ghi chú / Items:</strong> ${booking.note || 'Không có'}</li>
              </ul>

              <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #d4af37;">THANH TOÁN (PAYMENT)</h3>
              <p><strong>Tổng tiền:</strong> ${booking.totalPrice.toLocaleString()} VNĐ</p>
              <p><strong>Mã giao dịch (Txn ID):</strong> ${booking.transactionId}</p>
              
              <br/>
              <p style="color: #777; font-size: 13px;">Thư này được gửi tự động. Vui lòng không trả lời. Chúc bạn một chuyến đi tuyệt vời!</p>
            </div>
          </div>
        `
      };

      transporter.sendMail(mailOptions).catch(err => console.log('Email warning (Requires valid Gmail + App Password in .env):', err.message));
    } catch (mailErr) {
      console.log('Mail setup error:', mailErr.message);
    }
    
    res.json({ success: true, message: 'Payment confirmed successfully', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
