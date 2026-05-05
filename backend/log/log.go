package log

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/spf13/viper"
)

var tranID string
var logLevel string

type logger struct {
	Timestamp string `json:"@timestamp"`        // The time at which the log message was created (ns) for kibana
	Suffix    string `json:"@suffix"`           // Suffix for kibana
	Level     string `json:"level"`             // The log level
	Func      string `json:"func"`              // The function name write log
	TranID    string `json:"tranId"`            // The transaction id
	Msg       string `json:"msg"`               // The log message
	Elapsed   string `json:"elapsed,omitempty"` // The elapsed time at end of process (ms)
}

// End ..
func End(startCall time.Time, format string, args ...interface{}) {
	log := logger{}
	pc, _, lineno, ok := runtime.Caller(1)
	if ok {
		str := strings.Split(runtime.FuncForPC(pc).Name(), "/")
		log.Func = fmt.Sprintf("%s:%d", str[len(str)-1], lineno)
	}
	log.Timestamp = time.Now().Format(time.RFC3339Nano)
	log.Suffix = viper.GetString("kibana.suffix")
	log.Level = "INFO"
	log.TranID = tranID
	log.Msg = fmt.Sprintf(format, args...)
	log.Elapsed = fmt.Sprintf("%dms", getElapsedTime(startCall))

	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	if logLevel == "Debug" {
		enc.SetIndent("", "    ")
		enc.Encode(log)
	} else {
		enc.Encode(log)
		fmt.Println("")
	}
}

// Error ..
func Error(format string, args ...interface{}) {
	log := logger{}
	pc, _, lineno, ok := runtime.Caller(1)
	if ok {
		str := strings.Split(runtime.FuncForPC(pc).Name(), "/")
		log.Func = fmt.Sprintf("%s:%d", str[len(str)-1], lineno)
	}
	log.Timestamp = time.Now().Format(time.RFC3339Nano)
	log.Suffix = viper.GetString("kibana.suffix")
	log.Level = "ERROR"
	log.TranID = tranID
	log.Msg = fmt.Sprintf(format, args...)

	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	if logLevel == "Debug" {
		enc.SetIndent("", "    ")
		enc.Encode(log)
	} else {
		enc.Encode(log)
		fmt.Println("")
	}
}

// Info ..
func Info(format string, args ...interface{}) {
	log := logger{}
	pc, _, lineno, ok := runtime.Caller(1)
	if ok {
		str := strings.Split(runtime.FuncForPC(pc).Name(), "/")
		log.Func = fmt.Sprintf("%s:%d", str[len(str)-1], lineno)
	}
	log.Timestamp = time.Now().Format(time.RFC3339Nano)
	log.Suffix = viper.GetString("kibana.suffix")
	log.Level = "INFO"
	log.TranID = tranID
	log.Msg = fmt.Sprintf(format, args...)

	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	if logLevel == "Debug" {
		enc.SetIndent("", "    ")
		enc.Encode(log)
	} else {
		enc.Encode(log)
		fmt.Println("")
	}
}

// Debug ..
func Debug(format string, args ...interface{}) {
	if logLevel == "Debug" {
		log := logger{}
		pc, _, lineno, ok := runtime.Caller(1)
		if ok {
			str := strings.Split(runtime.FuncForPC(pc).Name(), "/")
			log.Func = fmt.Sprintf("%s:%d", str[len(str)-1], lineno)
		}
		log.Timestamp = time.Now().Format(time.RFC3339Nano)
		log.Suffix = viper.GetString("kibana.suffix")
		log.Level = "DEBUG"
		log.TranID = tranID
		log.Msg = fmt.Sprintf(format, args...)

		enc := json.NewEncoder(os.Stdout)
		enc.SetEscapeHTML(false)
		enc.SetIndent("", "    ")
		enc.Encode(log)
	}
}

// GenTranID ...
func GenTranID() {
	tranID = strings.Replace(time.Now().Format("20060201150405.00000"), ".", "", -1)
}

// GetTranID return tranID
func GetTranID() string {
	return tranID
}

// SetLogLevel ..
func SetLogLevel(level string) {
	logLevel = level
}

func getElapsedTime(start time.Time) int64 {
	return time.Now().Sub(start).Nanoseconds() / int64(time.Millisecond)
}

// GetElapsedTime : Return ElapsedTime as int64
func GetElapsedTime(start time.Time) int64 {
	return time.Now().Sub(start).Nanoseconds() / int64(time.Millisecond)
}
