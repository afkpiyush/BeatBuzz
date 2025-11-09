# OTP-Based Verification Testing Guide

## Overview
This document provides a comprehensive testing guide for the OTP-based email verification and password reset features implemented in BeatBuzz.

## Features Implemented

### 1. OTP-Based Email Verification (Registration)
- **Endpoint**: `/register` (POST)
- **Flow**:
  1. User submits registration form with username, email, and password
  2. System generates 6-digit OTP and stores it with 5-minute expiry
  3. OTP sent to user's email
  4. User enters OTP in verification modal
  5. System verifies OTP and activates account
  6. User redirected to profile setup

### 2. OTP-Based Password Reset
- **Endpoints**: 
  - `/api/forgot_password_otp_request` (POST) - Request OTP
  - `/api/forgot_password_otp_verify` (POST) - Verify OTP and reset password
- **Flow**:
  1. User enters email or username on forgot password page
  2. System generates 6-digit OTP and stores it with 5-minute expiry
  3. OTP sent to user's email
  4. User enters OTP and new password
  5. System verifies OTP and updates password
  6. User redirected to login page

## Test Cases

### Test Suite 1: Registration OTP Flow

#### TC1.1: Successful Registration with OTP Verification
**Steps**:
1. Navigate to `/register.html`
2. Fill in username, email, and password
3. Click "Create account"
4. Wait for OTP modal to appear
5. Check email for 6-digit OTP
6. Enter OTP in modal
7. Click "Verify"

**Expected Result**: 
- OTP sent successfully
- User receives email with 6-digit code
- OTP verification succeeds
- User redirected to setup page

#### TC1.2: Registration with Invalid OTP
**Steps**:
1. Follow TC1.1 steps 1-4
2. Enter incorrect OTP (e.g., 123456)
3. Click "Verify"

**Expected Result**: 
- Error message: "Invalid OTP or expired"
- Modal remains open
- User can retry

#### TC1.3: Registration with Expired OTP
**Steps**:
1. Follow TC1.1 steps 1-4
2. Wait 6 minutes
3. Enter the OTP received
4. Click "Verify"

**Expected Result**: 
- Error message: "Invalid OTP or expired"
- User needs to resend OTP

#### TC1.4: OTP Resend Functionality
**Steps**:
1. Follow TC1.1 steps 1-4
2. Click "Resend OTP"
3. Wait for confirmation
4. Check email for new OTP
5. Enter new OTP
6. Click "Verify"

**Expected Result**: 
- New OTP sent successfully
- Cooldown timer displays (60 seconds)
- New OTP works for verification
- User redirected to setup page

#### TC1.5: OTP Resend Rate Limiting
**Steps**:
1. Follow TC1.1 steps 1-4
2. Click "Resend OTP" immediately
3. Wait for button to become enabled
4. Click "Resend OTP" two more times quickly

**Expected Result**: 
- First resend works
- 60-second cooldown enforced
- After 3 resends within 15 minutes, error message about rate limit

#### TC1.6: College Email Validation (if enabled)
**Steps**:
1. Set environment variable: `REQUIRED_EMAIL_DOMAIN=@vit.edu`
2. Try registering with non-college email (e.g., gmail.com)
3. Try registering with college email (e.g., user@vit.edu)

**Expected Result**: 
- Non-college email rejected with error message
- College email accepted and OTP sent

### Test Suite 2: Forgot Password OTP Flow

#### TC2.1: Successful Password Reset with Email
**Steps**:
1. Navigate to `/forgot.html`
2. Enter registered email address
3. Click "Send OTP"
4. Check email for 6-digit OTP
5. Enter OTP in verification step
6. Enter new password (at least 6 characters)
7. Confirm new password
8. Click "Reset Password"

**Expected Result**: 
- OTP sent successfully
- User receives email with 6-digit code
- Password reset succeeds
- User redirected to login page
- Can login with new password

#### TC2.2: Successful Password Reset with Username
**Steps**:
1. Navigate to `/forgot.html`
2. Enter registered username
3. Follow TC2.1 steps 3-8

**Expected Result**: 
- Same as TC2.1

#### TC2.3: Password Reset with Invalid OTP
**Steps**:
1. Follow TC2.1 steps 1-4
2. Enter incorrect OTP
3. Enter valid new password
4. Click "Reset Password"

**Expected Result**: 
- Error message: "Invalid or expired OTP"
- User can retry

#### TC2.4: Password Reset with Expired OTP
**Steps**:
1. Follow TC2.1 steps 1-4
2. Wait 6 minutes
3. Enter the OTP received
4. Enter valid new password
5. Click "Reset Password"

**Expected Result**: 
- Error message: "Invalid or expired OTP"
- User needs to request new OTP

#### TC2.5: Password Reset OTP Resend
**Steps**:
1. Follow TC2.1 steps 1-4
2. Click "Resend OTP"
3. Wait for confirmation
4. Check email for new OTP
5. Enter new OTP
6. Complete password reset

**Expected Result**: 
- New OTP sent successfully
- Cooldown timer displays (60 seconds)
- New OTP works for password reset
- Password updated successfully

#### TC2.6: Password Reset Rate Limiting
**Steps**:
1. Follow TC2.1 steps 1-3
2. Click "Resend OTP" multiple times
3. Try to request OTP 4 times within 15 minutes

**Expected Result**: 
- Rate limiting enforced
- Error message after 3 attempts
- User must wait before requesting again

#### TC2.7: Password Validation
**Steps**:
1. Follow TC2.1 steps 1-5
2. Enter password with less than 6 characters
3. Click "Reset Password"

**Expected Result**: 
- Error message: "Password must be at least 6 characters"

#### TC2.8: Password Confirmation Mismatch
**Steps**:
1. Follow TC2.1 steps 1-5
2. Enter new password: "password123"
3. Enter confirm password: "password456"
4. Click "Reset Password"

**Expected Result**: 
- Error message: "Passwords do not match"

#### TC2.9: Back Button Functionality
**Steps**:
1. Follow TC2.1 steps 1-4
2. Click "Back" button
3. Verify returned to request step

**Expected Result**: 
- User returned to first step (request OTP)
- Form fields cleared
- Can request new OTP

### Test Suite 3: Security & Edge Cases

#### TC3.1: Non-existent Email/Username
**Steps**:
1. Navigate to `/forgot.html`
2. Enter non-existent email
3. Click "Send OTP"

**Expected Result**: 
- Generic success message (to prevent user enumeration)
- No email sent

#### TC3.2: Multiple Active Accounts
**Steps**:
1. Register user1 with OTP verification
2. Register user2 with same email (should fail)

**Expected Result**: 
- Second registration fails
- Error message: "Email already taken"

#### TC3.3: Concurrent OTP Requests
**Steps**:
1. Request OTP for password reset
2. Immediately request OTP again
3. Use the second OTP to reset password

**Expected Result**: 
- Second OTP overwrites first
- Only latest OTP is valid
- Rate limiting prevents abuse

#### TC3.4: SQL Injection Prevention
**Steps**:
1. Try registering with username: `admin' OR '1'='1`
2. Try forgot password with email: `test@test.com' OR '1'='1`

**Expected Result**: 
- Inputs treated as literals
- No SQL injection vulnerability
- Proper error handling

#### TC3.5: XSS Prevention
**Steps**:
1. Try registering with username containing script tags
2. Verify profile page doesn't execute scripts

**Expected Result**: 
- Script tags escaped
- No XSS vulnerability

## Manual Testing Checklist

- [ ] Registration flow works end-to-end
- [ ] OTP is received in email
- [ ] OTP verification works correctly
- [ ] OTP expiry (5 minutes) is enforced
- [ ] OTP resend functionality works
- [ ] Rate limiting prevents abuse
- [ ] Forgot password flow works with email
- [ ] Forgot password flow works with username
- [ ] Password reset with OTP works
- [ ] Password validation is enforced
- [ ] Error messages are user-friendly
- [ ] College email validation works (if enabled)
- [ ] Security measures are in place
- [ ] UI/UX is intuitive and consistent

## Environment Variables

### Optional Configuration
- `REQUIRED_EMAIL_DOMAIN`: Enforce specific email domain (e.g., "@vit.edu")
- `GMAIL_USER`: Gmail account for sending emails
- `GMAIL_PASS`: Gmail app password

## Notes for Developers

1. **Email Configuration**: Ensure `GMAIL_USER` and `GMAIL_PASS` are configured in `.env` file
2. **Database**: Ensure `confirm_token`, `token_expiry`, `reset_token`, and `reset_expiry` columns exist in `credentials` table
3. **Rate Limiting**: In-memory rate limiter will reset on server restart
4. **OTP Format**: 6-digit numeric OTP
5. **OTP Validity**: 5 minutes from generation
6. **Cooldown**: 60 seconds between resend attempts
7. **Max Attempts**: 3 OTP requests per 15-minute window

## Browser Compatibility

Tested on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Responsiveness

- [ ] Registration OTP modal on mobile
- [ ] Forgot password flow on mobile
- [ ] Email links open correctly on mobile

## Accessibility

- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Keyboard navigation works
- [ ] Focus management in modals

## Performance

- [ ] OTP email delivery within 5 seconds
- [ ] Form submission response within 2 seconds
- [ ] No memory leaks in rate limiter
- [ ] Database queries are optimized
