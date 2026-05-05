package db

import (
	"database/sql"
	"estisi/log"
	"fmt"
	"net"
	"os"
	"sync"

	"github.com/go-sql-driver/mysql"
	"github.com/spf13/viper"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/agent"
)

var (
	dbConnection *sql.DB
	dbOnce       sync.Once
)

type ViaSSHDialer struct {
	client *ssh.Client
}

func (self *ViaSSHDialer) Dial(addr string) (net.Conn, error) {
	return self.client.Dial("tcp", addr)
}

func GetSSHConnectionDB() *sql.DB {

	var dbOra *sql.DB = new(sql.DB)

	sshHost := viper.GetString("db.mysql.estisi.connection.sshHost") // SSH Server Hostname/IP
	sshPort := viper.GetString("db.mysql.estisi.connection.sshPort") // SSH Port
	sshUser := viper.GetString("db.mysql.estisi.connection.sshUser") // SSH Username
	sshPass := viper.GetString("db.mysql.estisi.connection.sshPass") // Empty string for no password
	dbUser := viper.GetString("db.mysql.estisi.connection.dbUser")   // DB username
	dbPass := viper.GetString("db.mysql.estisi.connection.dbPass")   // DB Password
	dbHost := viper.GetString("db.mysql.estisi.connection.dbHost")   // DB Hostname/IP
	dbName := viper.GetString("db.mysql.estisi.connection.dbName")   // Database name

	//fmt.Println("sshPass:", sshPass)

	var agentClient agent.Agent
	// Establish a connection to the local ssh-agent
	if conn, err := net.Dial("unix", os.Getenv("SSH_AUTH_SOCK")); err == nil {
		defer conn.Close()

		// Create a new instance of the ssh agent
		agentClient = agent.NewClient(conn)
	}

	// The client configuration with configuration option to use the ssh-agent
	sshConfig := &ssh.ClientConfig{
		User:            sshUser,
		Auth:            []ssh.AuthMethod{},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	// When the agentClient connection succeeded, add them as AuthMethod
	if agentClient != nil {
		sshConfig.Auth = append(sshConfig.Auth, ssh.PublicKeysCallback(agentClient.Signers))
	}
	// When there's a non empty password add the password AuthMethod
	if sshPass != "" {
		sshConfig.Auth = append(sshConfig.Auth, ssh.PasswordCallback(func() (string, error) {
			return sshPass, nil
		}))
	}

	//fmt.Println("Failure: xxxx")

	// Connect to the SSH Server
	if sshcon, err := ssh.Dial("tcp", fmt.Sprintf("%s:%s", sshHost, sshPort), sshConfig); err == nil {
		//	defer sshcon.Close()

		// Now we register the ViaSSHDialer with the ssh connection as a parameter
		mysql.RegisterDial("mysql+tcp", (&ViaSSHDialer{sshcon}).Dial)

		// And now we can use our new driver with the regular mysql connection string tunneled through the SSH connection
		// Ensure times are handled consistently in Asia/Bangkok
		dbOra, err = sql.Open("mysql", fmt.Sprintf("%s:%s@mysql+tcp(%s)/%s?parseTime=true&loc=Asia%%2FBangkok", dbUser, dbPass, dbHost, dbName))

		//	defer dbOra.Close()
		if err != nil {
			log.Error("... DB Setup Failed ..." + err.Error())
		} else {
			//fmt.Printf("Successfully mysql connected to the db\n")
		}

	}
	return dbOra
}

// InitDB initializes the database connection pool
// Should be called once during application startup
func InitDB() error {
	var initErr error

	dbOnce.Do(func() {
		dbUser := viper.GetString("db.mysql.estisi.connection.dbUser") // DB username
		dbPass := viper.GetString("db.mysql.estisi.connection.dbPass") // DB Password
		dbHost := viper.GetString("db.mysql.estisi.connection.dbHost") // DB Hostname/IP
		dbName := viper.GetString("db.mysql.estisi.connection.dbName") // Database name

		// Ensure times are handled consistently in Asia/Bangkok
		// Add timeout parameters to prevent hanging connections
		dsn := fmt.Sprintf(`%s:%s@tcp(%s)/%s?parseTime=true&loc=Asia%%2FBangkok&timeout=10s&readTimeout=30s&writeTimeout=30s&charset=utf8mb4&collation=utf8mb4_unicode_ci`,
			dbUser, dbPass, dbHost, dbName)
		db, err := sql.Open("mysql", dsn)
		if err != nil {
			initErr = fmt.Errorf("failed to open database: %v", err)
			return
		}

		// Set connection pool settings for better performance
		// MaxOpenConns: Maximum number of open connections to the database
		// Should be set based on expected concurrent requests (typically 2-4x CPU cores)
		db.SetMaxOpenConns(10) // Reduced from 25 to prevent too many connections

		// MaxIdleConns: Maximum number of connections in the idle connection pool
		// Should be less than or equal to MaxOpenConns
		db.SetMaxIdleConns(5) // Keep idle connections for reuse

		// ConnMaxLifetime: Maximum amount of time a connection may be reused
		// Prevents connections from being reused indefinitely (MySQL default wait_timeout is 8 hours)
		db.SetConnMaxLifetime(3600 * 1000000000) // 1 hour in nanoseconds (prevents stale connections)

		// ConnMaxIdleTime: Maximum amount of time a connection may be idle
		// Closes idle connections that haven't been used recently
		db.SetConnMaxIdleTime(300 * 1000000000) // 5 minutes in nanoseconds (closes idle connections)

		// Test the connection
		if err := db.Ping(); err != nil {
			initErr = fmt.Errorf("failed to ping database: %v", err)
			return
		}

		dbConnection = db
		log.Info("Database connection pool initialized successfully")
		log.Info("Connection pool settings: MaxOpenConns=10, MaxIdleConns=5, ConnMaxLifetime=1h, ConnMaxIdleTime=5m")
	})

	return initErr
}

// GetConnectionDB returns the global database connection pool
// The connection pool is initialized by InitDB() during application startup
func GetConnectionDB() *sql.DB {
	if dbConnection == nil {
		log.Error("Database connection not initialized. Call InitDB() first.")
		return nil
	}
	return dbConnection
}

// CloseDB closes the global database connection pool
// Should be called during application shutdown for graceful shutdown
func CloseDB() error {
	if dbConnection != nil {
		log.Info("Closing database connection pool...")

		// Get connection pool stats before closing
		stats := dbConnection.Stats()
		log.Info("Connection pool stats before close: OpenConnections=%d, InUse=%d, Idle=%d, WaitCount=%d",
			stats.OpenConnections, stats.InUse, stats.Idle, stats.WaitCount)

		err := dbConnection.Close()
		dbConnection = nil

		if err != nil {
			log.Error("Error closing database connection pool: %v", err)
			return err
		}

		log.Info("Database connection pool closed successfully")
		return nil
	}
	return nil
}

// GetDBStats returns current database connection pool statistics
// Useful for monitoring and debugging connection pool usage
func GetDBStats() sql.DBStats {
	if dbConnection != nil {
		return dbConnection.Stats()
	}
	return sql.DBStats{}
}
