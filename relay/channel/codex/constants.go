package codex

var ModelList = []string{
	"gpt-5.6-sol",
	"gpt-5.6-terra",
	"gpt-5.6-luna",
	"gpt-5.5",
	"gpt-5.4",
	"gpt-5.4-mini",
	"gpt-5.3-codex-spark",
	"codex-auto-review",
}

const ChannelName = "codex"

func withCompactModelSuffix(models []string) []string {
	out := make([]string, 0, len(models)*2)
	out = append(out, models...)
	out = append(out, lo.Map(models, func(model string, _ int) string {
		return ratio_setting.WithCompactModelSuffix(model)
	})...)
	return lo.Uniq(out)
}
