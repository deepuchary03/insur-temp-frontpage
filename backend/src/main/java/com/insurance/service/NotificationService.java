package com.insurance.service;

import com.insurance.entity.Appointment;
import com.insurance.entity.Notification;
import com.insurance.entity.User;
import com.insurance.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Transactional
    @Async
    public void sendAppointmentConfirmation(Appointment appointment) {
        // Create notification for customer
        Notification customerNotification = Notification.builder()
                .user(appointment.getCustomer())
                .type(Notification.NotificationType.APPOINTMENT_CONFIRMATION)
                .subject("Appointment Confirmed")
                .message(String.format("Your appointment with %s has been confirmed for %s",
                        appointment.getAgent().getUser().getFullName(),
                        appointment.getAppointmentDateTime()))
                .appointment(appointment)
                .build();
        
        notificationRepository.save(customerNotification);
        
        // Send email to customer
        emailService.sendAppointmentConfirmationEmail(
                appointment.getCustomer().getEmail(),
                appointment.getCustomer().getFullName(),
                appointment.getAgent().getUser().getFullName(),
                appointment.getAppointmentDateTime().toString()
        );
        
        // Create notification for agent
        Notification agentNotification = Notification.builder()
                .user(appointment.getAgent().getUser())
                .type(Notification.NotificationType.APPOINTMENT_CONFIRMATION)
                .subject("New Appointment")
                .message(String.format("New appointment with %s scheduled for %s",
                        appointment.getCustomer().getFullName(),
                        appointment.getAppointmentDateTime()))
                .appointment(appointment)
                .build();
        
        notificationRepository.save(agentNotification);
    }
    
    @Transactional
    @Async
    public void sendAppointmentCancellation(Appointment appointment) {
        Notification notification = Notification.builder()
                .user(appointment.getCustomer())
                .type(Notification.NotificationType.APPOINTMENT_CANCELLATION)
                .subject("Appointment Cancelled")
                .message(String.format("Your appointment with %s scheduled for %s has been cancelled",
                        appointment.getAgent().getUser().getFullName(),
                        appointment.getAppointmentDateTime()))
                .appointment(appointment)
                .build();
        
        notificationRepository.save(notification);
        
        // Send email
        emailService.sendAppointmentCancellationEmail(
                appointment.getCustomer().getEmail(),
                appointment.getCustomer().getFullName(),
                appointment.getAppointmentDateTime().toString()
        );
    }
    
    @Transactional
    @Async
    public void sendAppointmentReminder(Appointment appointment) {
        Notification notification = Notification.builder()
                .user(appointment.getCustomer())
                .type(Notification.NotificationType.APPOINTMENT_REMINDER)
                .subject("Appointment Reminder")
                .message(String.format("Reminder: You have an appointment with %s tomorrow at %s",
                        appointment.getAgent().getUser().getFullName(),
                        appointment.getAppointmentDateTime()))
                .appointment(appointment)
                .build();
        
        notificationRepository.save(notification);
    }
    
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }
    
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
        notifications.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(notifications);
    }
}
