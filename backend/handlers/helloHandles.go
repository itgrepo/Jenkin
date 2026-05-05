package handlers

import (
	"estisi/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Hello API
// @Description Greet API
// @Produce json
// @Success 200 {object} models.MessageResponse
// @Router /api/v1/morenine/hello [get]
func HelloHandler(c *gin.Context) {
	c.JSON(http.StatusOK, models.MessageResponse{Message: "Welcome to E-Service-Tisi App api v1."})
}
