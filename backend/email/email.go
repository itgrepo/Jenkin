package email

import (
	"crypto/tls"
	"estisi/log"
	"fmt"
	"net/smtp"
	"strings"

	"github.com/spf13/viper"
)

type EmailConfig struct {
	Host       string
	Port       string
	Username   string
	Password   string
	From       string
	FromName   string
	Encryption string
}

func GetEmailConfig() *EmailConfig {
	return &EmailConfig{
		Host:       viper.GetString("mail.host"),
		Port:       viper.GetString("mail.port"),
		Username:   viper.GetString("mail.username"),
		Password:   viper.GetString("mail.password"),
		From:       viper.GetString("mail.from_address"),
		FromName:   viper.GetString("mail.from_name"),
		Encryption: viper.GetString("mail.encryption"),
	}
}

// SendEmail sends an email using SMTP
func SendEmail(to []string, subject, body string) error {
	config := GetEmailConfig()

	if config.Host == "" || config.Port == "" {
		return fmt.Errorf("email configuration is missing")
	}

	// Prepare message
	from := config.From
	if config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", config.FromName, config.From)
	}

	message := fmt.Sprintf("From: %s\r\n", from)
	message += fmt.Sprintf("To: %s\r\n", strings.Join(to, ","))
	message += fmt.Sprintf("Subject: %s\r\n", subject)
	message += "MIME-Version: 1.0\r\n"
	message += "Content-Type: text/html; charset=UTF-8\r\n"
	message += "\r\n"
	message += body

	// Setup authentication
	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)

	// Send email
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)

	if config.Encryption == "ssl" || config.Encryption == "tls" {
		// Use TLS
		tlsConfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         config.Host,
		}

		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			log.Error("Failed to connect to SMTP server: %v", err)
			return fmt.Errorf("failed to connect to SMTP server: %v", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, config.Host)
		if err != nil {
			log.Error("Failed to create SMTP client: %v", err)
			return fmt.Errorf("failed to create SMTP client: %v", err)
		}
		defer client.Close()

		// Auth
		if err = client.Auth(auth); err != nil {
			log.Error("Failed to authenticate: %v", err)
			return fmt.Errorf("failed to authenticate: %v", err)
		}

		// Set sender
		if err = client.Mail(config.From); err != nil {
			log.Error("Failed to set sender: %v", err)
			return fmt.Errorf("failed to set sender: %v", err)
		}

		// Set recipients
		for _, recipient := range to {
			if err = client.Rcpt(recipient); err != nil {
				log.Error("Failed to set recipient %s: %v", recipient, err)
				continue
			}
		}

		// Send data
		writer, err := client.Data()
		if err != nil {
			log.Error("Failed to get data writer: %v", err)
			return fmt.Errorf("failed to get data writer: %v", err)
		}

		_, err = writer.Write([]byte(message))
		if err != nil {
			log.Error("Failed to write message: %v", err)
			return fmt.Errorf("failed to write message: %v", err)
		}

		err = writer.Close()
		if err != nil {
			log.Error("Failed to close writer: %v", err)
			return fmt.Errorf("failed to close writer: %v", err)
		}

		log.Info("Email sent successfully to %d recipients", len(to))
		return nil
	} else {
		// Use plain SMTP
		err := smtp.SendMail(addr, auth, config.From, to, []byte(message))
		if err != nil {
			log.Error("Failed to send email: %v", err)
			return fmt.Errorf("failed to send email: %v", err)
		}

		log.Info("Email sent successfully to %d recipients", len(to))
		return nil
	}
}
