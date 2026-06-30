package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

	@Autowired
	private JavaMailSender javaMailSender;

	@Value("${spring.mail.username}")
	private String fromEmail;

	@Override
	public void sendOtpEmail(String to, String subject, String otp, int expiredMinutes) {
		SimpleMailMessage message = new SimpleMailMessage();

		message.setFrom(fromEmail);
		message.setTo(to);
		message.setSubject(subject);
		message.setText(
				"Your OTP code is: " + otp + "\n\n"
						+ "This code will expire in " + expiredMinutes + " minutes.\n"
						+ "If you did not request this email, please ignore it.");

		javaMailSender.send(message);
	}
}
