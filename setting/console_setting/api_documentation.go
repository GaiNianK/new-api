package console_setting

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

const (
	maxAPIDocumentationEntries    = 100
	maxAPIDocumentationParameters = 100
	maxAPIDocumentationTextLength = 20000
)

var apiDocumentationSlugRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]*$`)

var apiDocumentationMethods = map[string]struct{}{
	"DELETE": {},
	"GET":    {},
	"PATCH":  {},
	"POST":   {},
	"PUT":    {},
}

var apiDocumentationLanguages = map[string]struct{}{
	"curl":       {},
	"javascript": {},
	"python":     {},
	"typescript": {},
}

type APIDocumentationParameter struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type"`
	Required     bool   `json:"required"`
	DefaultValue string `json:"default_value,omitempty"`
	Description  string `json:"description,omitempty"`
}

type APIDocumentationEntry struct {
	ID              string                      `json:"id"`
	Slug            string                      `json:"slug"`
	Title           string                      `json:"title"`
	Category        string                      `json:"category,omitempty"`
	Provider        string                      `json:"provider,omitempty"`
	Model           string                      `json:"model,omitempty"`
	Description     string                      `json:"description,omitempty"`
	BaseURL         string                      `json:"base_url,omitempty"`
	Method          string                      `json:"method"`
	Path            string                      `json:"path"`
	Authentication  string                      `json:"authentication,omitempty"`
	Published       bool                        `json:"published"`
	CodeSamples     map[string]string           `json:"code_samples,omitempty"`
	Parameters      []APIDocumentationParameter `json:"parameters,omitempty"`
	ResponseExample string                      `json:"response_example,omitempty"`
	Notes           string                      `json:"notes,omitempty"`
}

func parseAPIDocumentation(raw string) ([]APIDocumentationEntry, error) {
	if strings.TrimSpace(raw) == "" {
		return []APIDocumentationEntry{}, nil
	}

	var entries []APIDocumentationEntry
	if err := common.UnmarshalJsonStr(raw, &entries); err != nil {
		return nil, fmt.Errorf("API documentation format is invalid: %w", err)
	}
	if entries == nil {
		return []APIDocumentationEntry{}, nil
	}
	return entries, nil
}

func validateAPIDocumentationURL(raw string, index int) error {
	if raw == "" {
		return nil
	}
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return fmt.Errorf("API documentation item %d has an invalid base URL", index)
	}
	return nil
}

func validateAPIDocumentationText(value string, maxLength int, field string, index int) error {
	if len(value) > maxLength {
		return fmt.Errorf("API documentation item %d field %s exceeds %d characters", index, field, maxLength)
	}
	return nil
}

func ValidateAPIDocumentation(raw string) error {
	entries, err := parseAPIDocumentation(raw)
	if err != nil {
		return err
	}
	if len(entries) > maxAPIDocumentationEntries {
		return fmt.Errorf("API documentation cannot contain more than %d items", maxAPIDocumentationEntries)
	}

	ids := make(map[string]struct{}, len(entries))
	slugs := make(map[string]struct{}, len(entries))
	for entryIndex, entry := range entries {
		index := entryIndex + 1
		entry.ID = strings.TrimSpace(entry.ID)
		entry.Slug = strings.TrimSpace(entry.Slug)
		entry.Title = strings.TrimSpace(entry.Title)
		entry.Method = strings.ToUpper(strings.TrimSpace(entry.Method))
		entry.Path = strings.TrimSpace(entry.Path)

		if entry.ID == "" || entry.Title == "" || entry.Slug == "" || entry.Path == "" {
			return fmt.Errorf("API documentation item %d is missing id, title, slug, or path", index)
		}
		if !apiDocumentationSlugRegex.MatchString(entry.Slug) {
			return fmt.Errorf("API documentation item %d has an invalid slug", index)
		}
		if !strings.HasPrefix(entry.Path, "/") {
			return fmt.Errorf("API documentation item %d path must start with /", index)
		}
		if _, ok := apiDocumentationMethods[entry.Method]; !ok {
			return fmt.Errorf("API documentation item %d has an unsupported method", index)
		}
		if _, exists := ids[entry.ID]; exists {
			return fmt.Errorf("API documentation item %d has a duplicate id", index)
		}
		if _, exists := slugs[entry.Slug]; exists {
			return fmt.Errorf("API documentation item %d has a duplicate slug", index)
		}
		ids[entry.ID] = struct{}{}
		slugs[entry.Slug] = struct{}{}

		if err := validateAPIDocumentationURL(strings.TrimSpace(entry.BaseURL), index); err != nil {
			return err
		}
		textFields := []struct {
			name  string
			value string
			limit int
		}{
			{name: "title", value: entry.Title, limit: 200},
			{name: "category", value: entry.Category, limit: 100},
			{name: "provider", value: entry.Provider, limit: 100},
			{name: "model", value: entry.Model, limit: 200},
			{name: "description", value: entry.Description, limit: 2000},
			{name: "authentication", value: entry.Authentication, limit: 5000},
			{name: "response_example", value: entry.ResponseExample, limit: maxAPIDocumentationTextLength},
			{name: "notes", value: entry.Notes, limit: 5000},
		}
		for _, field := range textFields {
			if err := validateAPIDocumentationText(field.value, field.limit, field.name, index); err != nil {
				return err
			}
		}

		for language, sample := range entry.CodeSamples {
			if _, ok := apiDocumentationLanguages[language]; !ok {
				return fmt.Errorf("API documentation item %d has an unsupported code sample language", index)
			}
			if err := validateAPIDocumentationText(sample, maxAPIDocumentationTextLength, "code_samples", index); err != nil {
				return err
			}
		}

		if len(entry.Parameters) > maxAPIDocumentationParameters {
			return fmt.Errorf("API documentation item %d cannot contain more than %d parameters", index, maxAPIDocumentationParameters)
		}
		parameterNames := make(map[string]struct{}, len(entry.Parameters))
		for parameterIndex, parameter := range entry.Parameters {
			parameter.Name = strings.TrimSpace(parameter.Name)
			parameter.Type = strings.TrimSpace(parameter.Type)
			if parameter.ID == "" || parameter.Name == "" || parameter.Type == "" {
				return fmt.Errorf("API documentation item %d parameter %d is missing id, name, or type", index, parameterIndex+1)
			}
			if _, exists := parameterNames[parameter.Name]; exists {
				return fmt.Errorf("API documentation item %d parameter %s is duplicated", index, parameter.Name)
			}
			parameterNames[parameter.Name] = struct{}{}
			if err := validateAPIDocumentationText(parameter.Name, 100, "parameter name", index); err != nil {
				return err
			}
			if err := validateAPIDocumentationText(parameter.Type, 100, "parameter type", index); err != nil {
				return err
			}
			if err := validateAPIDocumentationText(parameter.DefaultValue, 500, "parameter default", index); err != nil {
				return err
			}
			if err := validateAPIDocumentationText(parameter.Description, 1000, "parameter description", index); err != nil {
				return err
			}
		}
	}
	return nil
}

func GetPublishedAPIDocumentation() []APIDocumentationEntry {
	entries, err := parseAPIDocumentation(GetConsoleSetting().ApiDocumentation)
	if err != nil {
		common.SysError("failed to parse API documentation: " + err.Error())
		return []APIDocumentationEntry{}
	}

	published := make([]APIDocumentationEntry, 0, len(entries))
	for _, entry := range entries {
		if entry.Published {
			published = append(published, entry)
		}
	}
	return published
}
