package com.example.demo.services;

public interface EmailService {

	void sendOtpEmail(String to, String subject, String otp, int expiredMinutes);
}
