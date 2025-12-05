package com.insurance.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Online Insurance System");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Welcome to our Online Corporate Insurance System!\n\n" +
                "We're excited to have you on board. You can now:\n" +
                "- Browse insurance plans\n" +
                "- Schedule appointments with our agents\n" +
                "- Ask questions using our AI assistant\n" +
                "- Manage your policies\n\n" +
                "If you have any questions, feel free to reach out.\n\n" +
                "Best regards,\n" +
                "Online Insurance System Team",
                fullName
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't fail the registration process
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }
    
    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String verificationToken) {
        try {
            String verificationUrl = "http://localhost:3000/verify-email?token=" + verificationToken;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verify Your Email - Online Insurance System");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Thank you for registering with Online Corporate Insurance System!\n\n" +
                "Please verify your email address by clicking the link below:\n" +
                "%s\n\n" +
                "Or use this verification token: %s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you didn't create this account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Online Insurance System Team",
                fullName, verificationUrl, verificationToken
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
        }
    }
    
    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            String resetUrl = "http://localhost:3000/reset-password?token=" + resetToken;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Reset Request");
            message.setText(String.format(
                "You have requested to reset your password.\n\n" +
                "Please click the link below to reset your password:\n" +
                "%s\n\n" +
                "Or use this reset token: %s\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Online Insurance System Team",
                resetUrl, resetToken
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
        }
    }
    
    @Async
    public void sendAppointmentConfirmationEmail(String toEmail, String customerName, String agentName, String appointmentTime) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Appointment Confirmation");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Your appointment has been confirmed!\n\n" +
                "Agent: %s\n" +
                "Date & Time: %s\n\n" +
                "Please make sure to be available at the scheduled time.\n\n" +
                "Best regards,\n" +
                "Online Insurance System Team",
                customerName, agentName, appointmentTime
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send appointment confirmation email: " + e.getMessage());
        }
    }
    
    @Async
    public void sendAppointmentCancellationEmail(String toEmail, String customerName, String appointmentTime) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Appointment Cancelled");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Your appointment scheduled for %s has been cancelled.\n\n" +
                "If you need to reschedule, please visit our platform.\n\n" +
                "Best regards,\n" +
                "Online Insurance System Team",
                customerName, appointmentTime
            ));
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send cancellation email: " + e.getMessage());
        }
    }
}
