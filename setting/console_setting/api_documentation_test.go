package console_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const validAPIDocumentation = `[
  {
    "id": "chat-completions",
    "slug": "chat-completions",
    "title": "Chat Completions",
    "method": "POST",
    "path": "/v1/chat/completions",
    "published": true,
    "code_samples": {"curl": "curl https://api.example.com/v1/chat/completions"},
    "parameters": [
      {"id": "model", "name": "model", "type": "string", "required": true}
    ]
  }
]`

func TestValidateAPIDocumentation(t *testing.T) {
	require.NoError(t, ValidateAPIDocumentation(validAPIDocumentation))

	invalid := `[
      {"id":"one","slug":"duplicate","title":"One","method":"POST","path":"/v1/one","published":true},
      {"id":"two","slug":"duplicate","title":"Two","method":"POST","path":"/v1/two","published":true}
    ]`
	err := ValidateAPIDocumentation(invalid)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "duplicate slug")
}

func TestGetPublishedAPIDocumentation(t *testing.T) {
	settings := GetConsoleSetting()
	previous := settings.ApiDocumentation
	t.Cleanup(func() {
		settings.ApiDocumentation = previous
	})

	settings.ApiDocumentation = `[
      {"id":"published","slug":"published","title":"Published","method":"GET","path":"/v1/published","published":true},
      {"id":"draft","slug":"draft","title":"Draft","method":"POST","path":"/v1/draft","published":false}
    ]`

	entries := GetPublishedAPIDocumentation()
	require.Len(t, entries, 1)
	assert.Equal(t, "published", entries[0].ID)
}
