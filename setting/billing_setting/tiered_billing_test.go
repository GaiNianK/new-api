package billing_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolveVideoPrice(t *testing.T) {
	previous := billingSetting.VideoPrice
	billingSetting.VideoPrice = map[string]map[string]float64{
		"video-model": {
			"720p":    0.05,
			"1080P":   0.09,
			"default": 0.07,
		},
		"free-video-model": {
			"720p": 0,
		},
	}
	t.Cleanup(func() {
		billingSetting.VideoPrice = previous
	})

	t.Run("matches normalized resolution", func(t *testing.T) {
		price, ok := ResolveVideoPrice("video-model", " 1080p ")
		require.True(t, ok)
		assert.Equal(t, 0.09, price)
	})

	t.Run("falls back to default resolution", func(t *testing.T) {
		price, ok := ResolveVideoPrice("video-model", "4k")
		require.True(t, ok)
		assert.Equal(t, 0.07, price)
	})

	t.Run("rejects missing model", func(t *testing.T) {
		_, ok := ResolveVideoPrice("missing-model", "720p")
		assert.False(t, ok)
	})

	t.Run("allows an explicitly free resolution", func(t *testing.T) {
		price, ok := ResolveVideoPrice("free-video-model", "720p")
		require.True(t, ok)
		assert.Zero(t, price)
	})
}

func TestGetDefaultVideoPriceUsesLowestConfiguredPrice(t *testing.T) {
	previous := billingSetting.VideoPrice
	billingSetting.VideoPrice = map[string]map[string]float64{
		"video-model": {
			"720p":  0.05,
			"1080p": 0.09,
		},
	}
	t.Cleanup(func() {
		billingSetting.VideoPrice = previous
	})

	price, ok := GetDefaultVideoPrice("video-model")
	require.True(t, ok)
	assert.Equal(t, 0.05, price)
}
