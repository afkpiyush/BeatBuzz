# OTP-Based Verification Feature

## Quick Start Guide

This feature adds secure OTP-based email verification for user registration and password reset functionality.

## What's New

### ✅ Registration with Email Verification
- Users receive a 6-digit OTP when registering
- OTP must be verified before account activation
- Resend OTP option with rate limiting

### ✅ Forgot Password with OTP
- Request OTP using email or username
- Verify OTP and set new password
- Two-step secure process

### ✅ College Email Validation (Optional)
- Restrict registration to specific email domains
- Configure via environment variable

## User Flows

### Registration Flow
```
1. User fills registration form (username, email, password)
   ↓
2. System sends 6-digit OTP to email
   ↓
3. OTP modal appears automatically
   ↓
4. User enters OTP (5-minute validity)
   ↓
5. Account activated & redirected to setup
```

### Forgot Password Flow
```
1. User enters email/username on forgot password page
   ↓
2. System sends 6-digit OTP to registered email
   ↓
3. User enters OTP on verification step
   ↓
4. User enters and confirms new password
   ↓
5. Password updated & redirected to login
```

## Configuration

### Required Environment Variables
```bash
# Email service configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password
```

### Optional Environment Variables
```bash
# Enforce college email domain (leave empty to allow all emails)
REQUIRED_EMAIL_DOMAIN=@vit.edu
```

### Setting Up Gmail App Password
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll to "App passwords"
4. Generate new app password for "Mail"
5. Use this 16-character password in `GMAIL_PASS`

## Features

### Security
- ✅ 6-digit numeric OTP
- ✅ 5-minute expiry window
- ✅ Rate limiting (60s cooldown, max 3/15min)
- ✅ SQL injection prevention
- ✅ User enumeration protection
- ✅ Password validation

### User Experience
- ✅ Clear error messages
- ✅ Resend OTP functionality
- ✅ Cooldown timers
- ✅ Back navigation
- ✅ Loading states
- ✅ Mobile responsive

### Admin Features
- ✅ Configurable email domain
- ✅ Rate limiting protection
- ✅ Email delivery tracking
- ✅ Server-side validation

## Testing

### Quick Test Checklist
- [ ] Register new user → Receive OTP → Verify → Access granted
- [ ] Resend OTP → Receive new code → Works
- [ ] Use expired OTP → Error message shown
- [ ] Forgot password with email → Reset successful
- [ ] Forgot password with username → Reset successful
- [ ] Rate limiting → Blocks excessive requests

### Detailed Testing
See `TESTING_OTP_FEATURE.md` for 26 comprehensive test cases.

## API Endpoints

### Registration & Verification
- `POST /register` - Create account and send OTP
- `POST /api/verify_otp` - Verify OTP and activate account
- `POST /api/resend_otp` - Resend OTP (rate limited)

### Password Reset
- `POST /api/forgot_password_otp_request` - Send password reset OTP
- `POST /api/forgot_password_otp_verify` - Verify OTP and reset password

## Database Schema

The following columns are automatically added to the `credentials` table:

```sql
-- Email verification
confirm_token VARCHAR(255) DEFAULT NULL
token_expiry DATETIME DEFAULT NULL
is_active TINYINT(1) NOT NULL DEFAULT 0

-- Password reset
reset_token VARCHAR(255) DEFAULT NULL
reset_expiry DATETIME DEFAULT NULL
```

## Frontend Pages

### `/register.html`
Registration form with integrated OTP verification modal

### `/verify.html`
Standalone OTP verification page (can be accessed directly)

### `/forgot.html`
Two-step password reset flow:
1. Request OTP (email or username)
2. Verify OTP and set new password

### `/index.html`
Login page with "Forgot password?" link

## Error Handling

### Common Errors & Solutions

**"Invalid OTP or expired"**
- OTP is incorrect or older than 5 minutes
- Request a new OTP

**"Please wait Xs before resending OTP"**
- Rate limiting in effect
- Wait for cooldown to complete

**"Only @domain.com emails are allowed"**
- College email validation is enabled
- Use authorized email domain

**"Passwords do not match"**
- Password and confirmation don't match
- Re-enter carefully

**"Password must be at least 6 characters"**
- Password too short
- Use minimum 6 characters

## Troubleshooting

### OTP Not Received
1. Check spam/junk folder
2. Verify `GMAIL_USER` and `GMAIL_PASS` are set correctly
3. Ensure Gmail app password is enabled
4. Check server logs for email sending errors

### Rate Limiting Too Strict
1. Adjust cooldown in `server.js` (line ~200)
2. Modify max attempts per window
3. Consider user feedback

### College Email Validation Issues
1. Verify `REQUIRED_EMAIL_DOMAIN` format includes `@`
2. Check domain spelling
3. Test with actual college email

## Monitoring

### What to Monitor
- Email delivery success rate
- OTP verification success rate
- Rate limiting triggers
- Failed verification attempts
- Average time to verify

### Logs to Check
- Email sending errors
- Rate limiting blocks
- OTP generation events
- Verification successes/failures

## Maintenance

### Regular Tasks
- Monitor email delivery
- Review rate limiting logs
- Update dependencies
- Check email service status
- Review security advisories

### Code Locations
- Rate limiter: `server.js` lines 196-224
- OTP generation: `server.js` lines 269, 382, 531
- Email templates: `server.js` lines 272-281, 384-393, 538-542
- Frontend flows: `public/forgot.html`, `public/register.html`

## Documentation

- **This file**: Quick start and overview
- **OTP_IMPLEMENTATION_SUMMARY.md**: Complete technical documentation
- **TESTING_OTP_FEATURE.md**: Comprehensive test cases

## Support

### Getting Help
1. Check this README for common issues
2. Review server logs for errors
3. Verify environment variables
4. Check email service status
5. Review detailed documentation files

### Reporting Issues
Include in your report:
- Error message (exact text)
- Steps to reproduce
- Server logs (if available)
- Environment configuration (without sensitive data)

## Security

This implementation follows security best practices:
- ✅ CodeQL security scan passed (0 alerts)
- ✅ Parameterized SQL queries
- ✅ Rate limiting on sensitive operations
- ✅ OTP expiry enforcement
- ✅ Secure token storage
- ✅ User enumeration protection

## Performance

### Optimizations
- In-memory rate limiting (fast lookups)
- Single SMTP connection per OTP
- Database indexing on username/email
- Efficient parameterized queries

### Scalability Considerations
For high-traffic deployments:
- Use Redis for distributed rate limiting
- Implement email queue system
- Add caching layer
- Monitor email service limits

## License

Same as parent project (BeatBuzz)

## Version

- **Initial Release**: November 2024
- **Status**: Production Ready ✅
- **Security Audit**: Passed ✅

---

**Need more details?** Check `OTP_IMPLEMENTATION_SUMMARY.md` for comprehensive documentation.
