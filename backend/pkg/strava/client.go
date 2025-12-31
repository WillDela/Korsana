package strava

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const (
	baseURL      = "https://www.strava.com/api/v3"
	authURL      = "https://www.strava.com/oauth/authorize"
	tokenURL     = "https://www.strava.com/oauth/token"
	scope        = "read,activity:read_all,profile:read_all"
)

// Client handles Strava API communication
type Client struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	HTTPClient   *http.Client
}

// NewClient creates a new Strava API client
func NewClient(clientID, clientSecret, redirectURI string) *Client {
	return &Client{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURI:  redirectURI,
		HTTPClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

// TokenResponse represents the OAuth token response
type TokenResponse struct {
	TokenType    string `json:"token_type"`
	AccessToken  string `json:"access_token"`
	ExpiresAt    int64  `json:"expires_at"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Athlete      struct {
		ID        int64  `json:"id"`
		Username  string `json:"username"`
		FirstName string `json:"firstname"`
		LastName  string `json:"lastname"`
	} `json:"athlete"`
}

// GetAuthorizationURL returns the URL to redirect users to for Strava OAuth
func (c *Client) GetAuthorizationURL() string {
	params := url.Values{}
	params.Add("client_id", c.ClientID)
	params.Add("response_type", "code")
	params.Add("redirect_uri", c.RedirectURI)
	params.Add("approval_prompt", "force")
	params.Add("scope", scope)

	return fmt.Sprintf("%s?%s", authURL, params.Encode())
}

// ExchangeToken exchanges the authorization code for an access token
func (c *Client) ExchangeToken(code string) (*TokenResponse, error) {
	params := url.Values{}
	params.Add("client_id", c.ClientID)
	params.Add("client_secret", c.ClientSecret)
	params.Add("code", code)
	params.Add("grant_type", "authorization_code")

	resp, err := c.HTTPClient.PostForm(tokenURL, params)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("strava api returned status: %d", resp.StatusCode)
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}
