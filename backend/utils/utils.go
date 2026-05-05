package utils

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	uaParser "github.com/mssola/user_agent"
	"github.com/spf13/viper"
	"golang.org/x/text/message"
)

func FormatAmount(a float64) string {
	p := message.NewPrinter(message.MatchLanguage("th")) // หรือ "en"
	return p.Sprintf("%.0f", a)
}

func GetFullPathFilex(fileName string) string {
	if fileName == "" {
		return ""
	}
	miniOHost := viper.GetString("miniO.host")
	bucketName := viper.GetString("miniO.bucketName")
	return fmt.Sprintf(`http://%s/%s/%s`, miniOHost, bucketName, fileName)
}

func ToNullTime(input string) interface{} {
	if strings.TrimSpace(input) == "" {
		return nil
	}
	parsed, err := time.Parse("2006-01-02", input) // หรือใช้ format ตาม input ที่รับ
	if err != nil {
		return nil // หรือจะ return error ก็ได้
	}
	return parsed
}

func MapKeys(m map[int]struct{}) []int {
	keys := make([]int, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func Placeholders(n int) string {
	s := make([]string, n)
	for i := range s {
		s[i] = "?"
	}
	return strings.Join(s, ",")
}

func MakePlaceholdersAndArgsInt(ids []int) (string, []interface{}) {
	if len(ids) == 0 {
		return "", nil
	}
	sb := strings.Builder{}
	args := make([]interface{}, 0, len(ids))
	for i, id := range ids {
		if i > 0 {
			sb.WriteString(",")
		}
		sb.WriteString("?")
		args = append(args, id)
	}
	return sb.String(), args
}

func ParseClientOrNow(s string, fallback time.Time) time.Time {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		// Keep the client's provided offset as-is to avoid shifting the instant
		// Alternatively, use t.UTC() if you want to normalize storage to UTC
		return t
	}
	return fallback
}
func NullF(v float64) interface{} {
	if v == 0 {
		return nil
	}
	return v
}

func ParseUA(uaStr string) (device string) {
	ua := uaParser.New(uaStr)
	mobile := ua.Mobile()
	if mobile {
		return "มือถือ"
	} else {
		return "คอมพิวเตอร์"
	}
}

// GetClientIP extracts the real client IP address from HTTP request
// Checks X-Forwarded-For, X-Real-IP, and RemoteAddr in order
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (proxy/load balancer)
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For may contain multiple IPs, use the first one
		ips := strings.Split(forwarded, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header (some proxies use this)
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return strings.TrimSpace(realIP)
	}

	// Fallback to RemoteAddr
	// RemoteAddr format is "IP:port", so we need to split
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}

	// Remove brackets if IPv6
	ip = strings.Trim(ip, "[]")

	return ip
}

// GetDeviceFromRequest extracts device type from HTTP request User-Agent
func GetDeviceFromRequest(r *http.Request) string {
	userAgent := r.Header.Get("User-Agent")
	return ParseUA(userAgent)
}

func ToNullString(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}

func ToNullFloat(s string) sql.NullFloat64 {
	if s == "" {
		return sql.NullFloat64{}
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return sql.NullFloat64{}
	}
	return sql.NullFloat64{Float64: f, Valid: true}
}

func ToNullDate(s string) sql.NullTime {
	// expect "YYYY-MM-DD"
	if s == "" {
		return sql.NullTime{}
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: t, Valid: true}
}
