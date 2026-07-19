package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/setting/console_setting"

	"github.com/gin-gonic/gin"
)

func GetAPIDocumentation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    console_setting.GetPublishedAPIDocumentation(),
	})
}
