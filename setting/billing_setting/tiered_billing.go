package billing_setting

import (
	"fmt"
	"math"
	"strings"

	"github.com/QuantumNous/new-api/pkg/billingexpr"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/samber/lo"
)

const (
	BillingModeRatio      = "ratio"
	BillingModeTieredExpr = "tiered_expr"
	BillingModePerSecond  = "per_second"
	BillingModeField      = "billing_mode"
	BillingExprField      = "billing_expr"
	VideoPriceField       = "video_price"
)

// BillingSetting is managed by config.GlobalConfig.Register.
// DB keys: billing_setting.billing_mode, billing_setting.billing_expr, billing_setting.video_price
type BillingSetting struct {
	BillingMode map[string]string             `json:"billing_mode"`
	BillingExpr map[string]string             `json:"billing_expr"`
	VideoPrice  map[string]map[string]float64 `json:"video_price"`
}

var billingSetting = BillingSetting{
	BillingMode: make(map[string]string),
	BillingExpr: make(map[string]string),
	VideoPrice:  make(map[string]map[string]float64),
}

func init() {
	config.GlobalConfig.Register("billing_setting", &billingSetting)
}

func GetBillingMode(model string) string {
	if mode, ok := billingSetting.BillingMode[model]; ok {
		return mode
	}
	return BillingModeRatio
}

func GetBillingExpr(model string) (string, bool) {
	expr, ok := billingSetting.BillingExpr[model]
	return expr, ok
}

func GetBillingModeCopy() map[string]string {
	return lo.Assign(billingSetting.BillingMode)
}

func GetBillingExprCopy() map[string]string {
	return lo.Assign(billingSetting.BillingExpr)
}

func GetVideoPrice(model string) (map[string]float64, bool) {
	prices, ok := billingSetting.VideoPrice[model]
	if !ok {
		return nil, false
	}
	return lo.Assign(prices), true
}

func GetVideoPriceCopy() map[string]map[string]float64 {
	result := make(map[string]map[string]float64, len(billingSetting.VideoPrice))
	for model, prices := range billingSetting.VideoPrice {
		result[model] = lo.Assign(prices)
	}
	return result
}

// ResolveVideoPrice checks the requested resolution, then the default price.
func ResolveVideoPrice(model string, resolution string) (float64, bool) {
	prices, ok := billingSetting.VideoPrice[model]
	if !ok {
		return 0, false
	}
	resolution = strings.ToLower(strings.TrimSpace(resolution))
	if resolution != "" {
		for configuredResolution, price := range prices {
			if strings.ToLower(strings.TrimSpace(configuredResolution)) == resolution && validVideoPrice(price) {
				return price, true
			}
		}
	}
	for configuredResolution, price := range prices {
		if strings.EqualFold(strings.TrimSpace(configuredResolution), "default") && validVideoPrice(price) {
			return price, true
		}
	}
	return 0, false
}

// GetDefaultVideoPrice is used for pre-consume and catalog display.
func GetDefaultVideoPrice(model string) (float64, bool) {
	if price, ok := ResolveVideoPrice(model, ""); ok {
		return price, true
	}
	prices, ok := billingSetting.VideoPrice[model]
	if !ok {
		return 0, false
	}
	var lowest float64
	found := false
	for _, price := range prices {
		if validVideoPrice(price) && (!found || price < lowest) {
			lowest = price
			found = true
		}
	}
	return lowest, found
}

func validVideoPrice(price float64) bool {
	return price >= 0 && !math.IsNaN(price) && !math.IsInf(price, 0)
}

func GetPricingSyncData(base map[string]any) map[string]any {
	extra := make(map[string]any, 3)
	if modes := GetBillingModeCopy(); len(modes) > 0 {
		extra[BillingModeField] = modes
	}
	if exprs := GetBillingExprCopy(); len(exprs) > 0 {
		extra[BillingExprField] = exprs
	}
	if prices := GetVideoPriceCopy(); len(prices) > 0 {
		extra[VideoPriceField] = prices
	}
	return lo.Assign(base, extra)
}

func SmokeTestExpr(exprStr string) error {
	return smokeTestExpr(exprStr)
}

func smokeTestExpr(exprStr string) error {
	vectors := []billingexpr.TokenParams{
		{P: 0, C: 0, Len: 0},
		{P: 1000, C: 1000, Len: 1000},
		{P: 100000, C: 100000, Len: 100000},
		{P: 1000000, C: 1000000, Len: 1000000},
	}
	requests := []billingexpr.RequestInput{
		{},
		{
			Headers: map[string]string{
				"anthropic-beta": "fast-mode-2026-02-01",
			},
			Body: []byte(`{"service_tier":"fast","stream_options":{"include_usage":true},"messages":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]}`),
		},
	}

	for _, v := range vectors {
		for _, request := range requests {
			result, _, err := billingexpr.RunExprWithRequest(exprStr, v, request)
			if err != nil {
				return fmt.Errorf("vector {p=%g, c=%g}: run failed: %w", v.P, v.C, err)
			}
			if result < 0 {
				return fmt.Errorf("vector {p=%g, c=%g}: result %f < 0", v.P, v.C, result)
			}
		}
	}
	return nil
}
