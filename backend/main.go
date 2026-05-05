package main

import (
	"context"
	"estisi/controller"
	"estisi/db"
	"estisi/log"
	"estisi/miniox"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/spf13/viper"
)

func init() {

	// Get environment parameter :: dev, uat, prd

	env := "dev"

	fmt.Println("len(os.Args)", len(os.Args))

	if len(os.Args) >= 2 {
		env = os.Args[1]
	}

	fmt.Println("env:" + env)

	// Set log level
	if env == "uat" {
		log.SetLogLevel("Debug")
	} else {
		log.SetLogLevel("Info")
	}

	// API Start
	log.Info("Server start running on %s environment configuration", env)

	// Get env config
	viper.SetConfigFile("config/" + env + ".yml")
	if err := viper.ReadInConfig(); err != nil {
		log.Error("Fatal error env config (file): %s", err)
	}

	// Initialize database connection pool
	if err := db.InitDB(); err != nil {
		log.Error("Fatal error database initialization: %s", err)
		os.Exit(1)
	}

}

func main() {
	// Initialize MinIO client
	if err := miniox.InitMinioClient(); err != nil {
		log.Error("Fatal error MinIO initialization: %s", err)
		// Don't exit, allow app to run but file upload will fail
	}

	// Create router and get HTTP server
	router := controller.NewRouter()
	port := viper.GetString("service.port")
	if port == "" {
		port = "80"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
		// Set timeouts to prevent hanging connections
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Info("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("Fatal error starting server: %s", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	// Register for SIGINT (Ctrl+C) and SIGTERM (kill)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Server shutting down...")

	// Create a context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown HTTP server
	if err := srv.Shutdown(ctx); err != nil {
		log.Error("Server forced to shutdown: %s", err)
	}

	// Close database connection pool
	if err := db.CloseDB(); err != nil {
		log.Error("Error closing database connection: %s", err)
	} else {
		log.Info("Database connection pool closed successfully")
	}

	log.Info("Server exited gracefully")
}
