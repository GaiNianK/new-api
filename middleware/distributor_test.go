package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGetEffectiveRequestGroupUsesPlaygroundSelection(t *testing.T) {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest("POST", "/pg/chat/completions", nil)
	common.SetContextKey(c, constant.ContextKeyUsingGroup, "default")

	group := getEffectiveRequestGroup(c, &ModelRequest{Group: "阿里云-智谱"})

	assert.Equal(t, "阿里云-智谱", group)
}

func TestGetEffectiveRequestGroupKeepsAuthenticatedGroupForAPIRequests(t *testing.T) {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest("POST", "/v1/chat/completions", nil)
	common.SetContextKey(c, constant.ContextKeyUsingGroup, "default")

	group := getEffectiveRequestGroup(c, &ModelRequest{Group: "阿里云-智谱"})

	assert.Equal(t, "default", group)
}
