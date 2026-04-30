package application

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

type EmailService interface {
	SendPasswordResetEmail(email string, token string) error
}

type emailService struct {
	host    string
	port    string
	user    string
	pass    string
	from    string
	baseUrl string
}

func NewEmailService() EmailService {
	return &emailService{
		host:    os.Getenv("SMTP_HOST"),
		port:    os.Getenv("SMTP_PORT"),
		user:    os.Getenv("SMTP_USER"),
		pass:    os.Getenv("SMTP_PASS"),
		from:    os.Getenv("FROM_EMAIL"),
		baseUrl: os.Getenv("FRONTEND_URL"),
	}
}

func (s *emailService) SendPasswordResetEmail(email string, token string) error {
	baseUrl := s.baseUrl
	if baseUrl == "" {
		baseUrl = "http://localhost:3000"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", baseUrl, token)

	// Fallback to console log if SMTP is not configured
	if s.host == "" || s.user == "" {
		fmt.Println("\n==================================================")
		fmt.Println("WARNING: SMTP not configured. Printing to console:")
		fmt.Printf("TO: %s\n", email)
		fmt.Printf("SUBJECT: Reset Your Password\n")
		fmt.Printf("BODY: Click the link to reset your password: %s\n", resetLink)
		fmt.Println("==================================================")
		return nil
	}

	subject := "Subject: Reset Your Password\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; background-color: #0f0f1a; color: #e2e8f0; padding: 40px;">
			<div style="max-width: 500px; margin: 0 auto; background-color: #1a1a2e; border: 1px solid #7c3aed; border-radius: 20px; padding: 32px; text-align: center;">
				<h2 style="color: #7c3aed;">Sleepiie Shop</h2>
				<p style="font-size: 16px;">You requested to reset your password. Click the button below to continue:</p>
				<a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 20px 0;">Reset Password</a>
				<p style="font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email. This link will expire in 15 minutes.</p>
			</div>
		</body>
		</html>
	`, resetLink)

	msg := []byte(subject + mime + body)
	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	err := smtp.SendMail(addr, auth, s.from, []string{email}, msg)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", email, err)
		return err
	}

	log.Printf("Password reset email sent to %s", email)
	return nil
}
